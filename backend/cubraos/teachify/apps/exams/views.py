from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from rest_framework.decorators import action
from django.utils import timezone
from django.shortcuts import get_object_or_404
import uuid

from .models import (
    Exam,
    Question,
    StudentExamAttempt,
    StudentAnswer,
    Certificate,
)
from .serializers import (
    ExamSerializer,
    QuestionSerializer,
    StudentExamAttemptSerializer,
    StudentAnswerSerializer,
    CertificateSerializer,
)

# from apps.common.permissions import IsInstructor , IsStudent
# =====================================================
# PERMISSIONS
# =====================================================

class IsInstructor(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == "instructor"

class IsStudent(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == "student"

# =====================================================
# QUESTIONS
# =====================================================

class QuestionViewSet(viewsets.ModelViewSet):
    queryset = Question.objects.all()
    serializer_class = QuestionSerializer

    def get_permissions(self):
        if self.action in ["create", "update", "partial_update", "destroy"]:
            return [IsInstructor()]
        return [permissions.IsAuthenticated()]
    


# =====================================================
# EXAMS
# =====================================================

class ExamViewSet(viewsets.ModelViewSet):
    queryset = Exam.objects.all()
    serializer_class = ExamSerializer

    def get_permissions(self):
        if self.action in ["create", "update", "partial_update", "destroy"]:
            return [IsInstructor()]
        return [permissions.IsAuthenticated()]

    def list(self, request, *args, **kwargs):
        """Filter exams based on user role"""
        user = request.user
        
        if user.role == "instructor":
            # Instructors see only their exams
            queryset = Exam.objects.filter(course__instructor=user)
        elif user.role == "student":
            # Students see exams from courses they're enrolled in
            from apps.courses.models import Enrollment
            enrolled_courses = Enrollment.objects.filter(
                student=user
            ).values_list('course', flat=True)
            queryset = Exam.objects.filter(course__in=enrolled_courses)
        else:
            # Default: all exams for other roles
            queryset = Exam.objects.all()
        
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    def create(self, request, *args, **kwargs):
        """Handle nested question creation"""
        questions_data = request.data.pop("questions", [])
        
        # Create the exam without questions
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        exam = serializer.save()
        
        # Create questions
        for q_data in questions_data:
            options = q_data.get("options", ["", "", "", ""])
            correct_answer = q_data.get("correctAnswer", "").upper().strip()
            
            # Validate correctAnswer is A, B, C, or D
            if correct_answer not in ["A", "B", "C", "D"]:
                correct_answer = "A"
            
            Question.objects.create(
                exam=exam,
                question_text=q_data.get("text", ""),
                option_a=options[0] if len(options) > 0 else "",
                option_b=options[1] if len(options) > 1 else "",
                option_c=options[2] if len(options) > 2 else "",
                option_d=options[3] if len(options) > 3 else "",
                correct_option=correct_answer,
                mark=q_data.get("points", 1),
            )
        
        response_data = ExamSerializer(exam).data
        
        # Send notifications to enrolled students
        from apps.courses.models import Enrollment
        from apps.common.models import Notification
        
        enrolled_students = Enrollment.objects.filter(course=exam.course).values_list('student', flat=True)
        for student_id in enrolled_students:
            Notification.objects.create(
                user_id=student_id,
                title="New Exam Available 📝",
                message=f"A new exam '{exam.title}' has been published for {exam.course.title}",
                type="info"
            )
        
        return Response(response_data, status=status.HTTP_201_CREATED)

    # -----------------------------------------
    # STUDENT SUBMIT EXAM
    # POST /api/exams/{id}/submit/
    # -----------------------------------------
    @action(detail=True, methods=["post"], permission_classes=[IsStudent])
    def submit(self, request, pk=None):
        exam = self.get_object()
        student = request.user
        answers = request.data.get("answers", [])

        # 🔹 الحصول على attempt مفتوح أو جديد
        attempt, _ = StudentExamAttempt.objects.get_or_create(
            student=student,
            exam=exam,
            finished_at__isnull=True,
            defaults={"started_at": timezone.now()},
        )

        # 🔹 حساب total_marks لكل الأسئلة
        questions = Question.objects.filter(exam=exam)
        total_marks = sum(q.mark for q in questions)
        obtained_marks = 0

        # 🔹 معالجة إجابات الطالب
        for ans in answers:
            question = get_object_or_404(
                Question,
                id=ans["question"],
                exam=exam
            )

            selected_option = ans["selected_option"].upper().strip()
            
            # Convert option text to letter (A, B, C, D) if it's not already a letter
            if selected_option not in ["A", "B", "C", "D"]:
                # Map option text to letter based on position
                options = [question.option_a, question.option_b, question.option_c, question.option_d]
                try:
                    option_index = options.index(selected_option)
                    selected_option = chr(65 + option_index)  # Convert 0->A, 1->B, 2->C, 3->D
                except (ValueError, IndexError):
                    # If not found, try case-insensitive search
                    options_lower = [opt.lower() for opt in options]
                    try:
                        option_index = options_lower.index(selected_option.lower())
                        selected_option = chr(65 + option_index)
                    except ValueError:
                        selected_option = "A"  # Default to A if not found
            
            correct_answer = question.correct_option.upper().strip()
            is_correct = selected_option == correct_answer

            StudentAnswer.objects.update_or_create(
                attempt=attempt,
                question=question,
                defaults={
                    "selected_option": selected_option,
                    "is_correct": is_correct
                }
            )

            if is_correct:
                obtained_marks += question.mark

        # 🔹 حساب الدرجة النهائية
        score = (obtained_marks / total_marks) * 100 if total_marks else 0
        attempt.score = score
        attempt.is_passed = score >= 50
        attempt.finished_at = timezone.now()
        attempt.save()

        # 🔹 Certificate creation is now manual only - instructor decides via separate endpoint
        # No auto-generation of certificates

        # Send notification to student about their results
        from apps.common.models import Notification
        result_type = "success" if attempt.is_passed else "warning"
        result_message = f"You {'passed' if attempt.is_passed else 'failed'} the exam '{exam.title}' with a score of {score:.1f}%"
        
        # Add message about certificate request for passed exams
        if attempt.is_passed:
            result_message += "\n\nWait for your instructor to issue a certificate."
        
        Notification.objects.create(
            user=student,
            title="Exam Results 📊",
            message=result_message,
            type=result_type
        )
        
        return Response({
            "attempt_id": attempt.id,
            "score": score,
            "earned_points": obtained_marks,
            "total_points": total_marks,
            "is_passed": attempt.is_passed,
        })

    # -----------------------------------------
    # GET EXAM SUBMISSIONS (INSTRUCTOR ONLY)
    # GET /api/exams/{id}/submissions/
    # -----------------------------------------
    @action(detail=True, methods=["get"], permission_classes=[IsInstructor])
    def submissions(self, request, pk=None):
        exam = self.get_object()
        attempts = StudentExamAttempt.objects.filter(exam=exam).select_related('student')
        
        submissions_data = []
        for attempt in attempts:
            submissions_data.append({
                'id': attempt.id,
                'student_id': attempt.student.id,
                'student_name': attempt.student.username,
                'earned_points': sum(ans.question.mark for ans in attempt.answers.filter(is_correct=True)),
                'total_points': sum(q.mark for q in exam.questions.all()),
                'percentage': round(attempt.score, 2),
                'is_passed': attempt.is_passed,
                'submitted_at': attempt.finished_at,
            })
        
        return Response(submissions_data)

# =====================================================
# STUDENT EXAM ATTEMPTS
# =====================================================

class StudentExamAttemptViewSet(viewsets.ReadOnlyModelViewSet):
    """
    - الطالب يشوف محاولاته فقط
    - الإنستراكتور يشوف الكل
    """
    queryset = StudentExamAttempt.objects.all()
    serializer_class = StudentExamAttemptSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == "student":
            return StudentExamAttempt.objects.filter(student=user)
        return StudentExamAttempt.objects.all()

# =====================================================
# STUDENT ANSWERS
# =====================================================

class StudentAnswerViewSet(viewsets.ModelViewSet):
    queryset = StudentAnswer.objects.all()
    serializer_class = StudentAnswerSerializer

    def get_permissions(self):
        if self.action in ["create", "update", "partial_update"]:
            return [IsStudent()]
        return [permissions.IsAuthenticated()]

    def get_queryset(self):
        user = self.request.user
        if user.role == "student":
            return StudentAnswer.objects.filter(attempt__student=user)
        return StudentAnswer.objects.all()

    def perform_create(self, serializer):
        attempt = serializer.validated_data["attempt"]
        if attempt.student != self.request.user:
            raise permissions.PermissionDenied(
                "You cannot submit answers for another student."
            )
        serializer.save()

# =====================================================
# CERTIFICATES
# =====================================================

class CertificateViewSet(viewsets.ModelViewSet):
    queryset = Certificate.objects.select_related('student', 'exam', 'attempt').all()
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == "student":
            return Certificate.objects.select_related('student', 'exam', 'attempt').filter(student=user)
        return Certificate.objects.select_related('student', 'exam', 'attempt').all()
    
    def get_serializer_class(self):
        if self.action == 'create':
            from .serializers import CertificateCreateSerializer
            return CertificateCreateSerializer
        return CertificateSerializer
    
    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context
    
    def perform_create(self, serializer):
        serializer.save()
