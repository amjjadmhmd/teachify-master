from rest_framework import serializers
from .models import (
    Exam,
    Question,
    StudentExamAttempt,
    StudentAnswer,
    Certificate,
)

# =========================
# QUESTIONS
# =========================

class QuestionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Question
        exclude = ["correct_option"]


# =========================
# EXAMS
# =========================

class ExamSerializer(serializers.ModelSerializer):
    questions = QuestionSerializer(many=True, read_only=True)
    instructor_id = serializers.SerializerMethodField()
    question_count = serializers.SerializerMethodField()
    course_title = serializers.SerializerMethodField()
    duration_minutes = serializers.SerializerMethodField()
    due_date = serializers.SerializerMethodField()

    class Meta:
        model = Exam
        fields = "__all__"

    def get_instructor_id(self, obj):
        return obj.course.instructor.id if obj.course and obj.course.instructor else None

    def get_question_count(self, obj):
        return obj.questions.count()

    def get_course_title(self, obj):
        return obj.course.title if obj.course else ""

    def get_duration_minutes(self, obj):
        # Map time_limit to duration_minutes for frontend compatibility
        return obj.time_limit

    def get_due_date(self, obj):
        # Convert publish_date to due_date (as date string)
        return obj.publish_date.strftime('%Y-%m-%d') if obj.publish_date else None


# =========================
# STUDENT ANSWERS
# =========================

class StudentAnswerSerializer(serializers.ModelSerializer):
    is_correct = serializers.ReadOnlyField()

    class Meta:
        model = StudentAnswer
        fields = [
            "id",
            "attempt",
            "question",
            "selected_option",
            "is_correct",
        ]


# =========================
# EXAM ATTEMPTS
# =========================

class StudentExamAttemptSerializer(serializers.ModelSerializer):
    answers = StudentAnswerSerializer(many=True, read_only=True)
    student = serializers.ReadOnlyField(source="student.id")
    score = serializers.ReadOnlyField()
    is_passed = serializers.ReadOnlyField()
    started_at = serializers.ReadOnlyField()
    finished_at = serializers.ReadOnlyField()

    class Meta:
        model = StudentExamAttempt
        fields = [
            "id",
            "exam",
            "student",
            "score",
            "started_at",
            "finished_at",
            "is_passed",
            "answers",
        ]


# =========================
# CERTIFICATES
# =========================

class CertificateSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.username', read_only=True)
    exam_title = serializers.CharField(source='exam.title', read_only=True)
    attempt_id = serializers.IntegerField(source='attempt.id', read_only=True)
    image = serializers.SerializerMethodField()
    
    class Meta:
        model = Certificate
        fields = ['id', 'attempt_id', 'student', 'student_name', 'exam', 'exam_title', 'certificate_code', 'verification_code', 'issued_at', 'image']
        read_only_fields = ['id', 'attempt_id', 'certificate_code', 'verification_code', 'issued_at', 'student', 'exam', 'image']
    
    def get_image(self, obj):
        """Return the full URL for the certificate image"""
        if obj.image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.image.url)
            return obj.image.url
        return None


# class CertificateCreateSerializer(serializers.Serializer):
#     """Simplified serializer for certificate creation by instructor"""
#     student = serializers.IntegerField()
#     course_title = serializers.CharField()
#     image = serializers.FileField(required=False)
    
#     def create(self, validated_data):
#         from apps.accounts.models import User
#         from apps.courses.models import Course
#         import random
#         import string
        
#         student_id = validated_data.get('student')
#         course_title = validated_data.get('course_title')
        
#         # Get student
#         student = User.objects.get(id=student_id)
        
#         # Try to find a course matching the title, or create a dummy exam
#         try:
#             course = Course.objects.get(title=course_title)
#             exam = course.exams.first()
#         except Course.DoesNotExist:
#             # If no course found, we still need an exam for the Certificate model
#             # For now, we'll create a certificate-only record
#             exam = None
        
#         if not exam:
#             # Create a minimal exam just for the certificate
#             from apps.courses.models import Course as CourseModel
#             dummy_course = CourseModel.objects.first() or CourseModel.objects.create(
#                 title=course_title,
#                 description=f"Auto-generated for certificate: {course_title}",
#                 instructor=self.context['request'].user
#             )
#             exam = Exam.objects.create(
#                 course=dummy_course,
#                 title=course_title,
#                 description="Auto-generated exam for certificate",
#                 total_marks=100
#             )
        
#         # Create or find an attempt
#         attempt = StudentExamAttempt.objects.filter(
#             student=student, exam=exam
#         ).first()
        
#         if not attempt:
#             attempt = StudentExamAttempt.objects.create(
#                 student=student,
#                 exam=exam,
#                 score=100,
#                 is_passed=True
#             )
        
#         # Generate codes
#         cert_code = ''.join(random.choices(string.ascii_uppercase + string.digits, k=10))
#         verify_code = ''.join(random.choices(string.ascii_uppercase + string.digits, k=10))
        
#         # Create certificate
#         certificate = Certificate.objects.create(
#             attempt=attempt,
#             student=student,
#             exam=exam,
#             certificate_code=cert_code,
#             verification_code=verify_code
#         )
        
#         return certificate
class CertificateCreateSerializer(serializers.Serializer):
    """Simplified serializer for certificate creation by instructor"""
    student = serializers.IntegerField()
    course_title = serializers.CharField()
    image = serializers.FileField(required=False)
    
    def validate_student(self, value):
        """Validate that the student exists"""
        from apps.accounts.models import User
        try:
            User.objects.get(id=value)
        except User.DoesNotExist:
            raise serializers.ValidationError(f"Student with ID {value} does not exist")
        return value
    
    def create(self, validated_data):
        from apps.accounts.models import User
        from apps.courses.models import Course
        from apps.common.models import Notification
        import random
        import string
        import logging
        
        logger = logging.getLogger(__name__)
        
        try:
            student_id = validated_data.get('student')
            course_title = validated_data.get('course_title')
            
            if not student_id or not course_title:
                raise serializers.ValidationError("Both student ID and course_title are required")
            
            # Get student
            try:
                student = User.objects.get(id=student_id)
            except User.DoesNotExist:
                raise serializers.ValidationError(f"Student with ID {student_id} does not exist")
            
            # Try to find a course matching the title, or create a dummy exam
            exam = None
            try:
                course = Course.objects.get(title=course_title)
                exam = course.exams.first()
            except Course.DoesNotExist:
                pass
            
            if not exam:
                try:
                    dummy_course = Course.objects.first()
                    if not dummy_course:
                        dummy_course = Course.objects.create(
                            title=course_title,
                            description=f"Auto-generated for certificate: {course_title}",
                            instructor=self.context.get('request').user if self.context.get('request') else student
                        )
                    exam = Exam.objects.create(
                        course=dummy_course,
                        title=course_title,
                        description="Auto-generated exam for certificate",
                        total_marks=100
                    )
                except Exception as e:
                    logger.error(f"Error creating exam: {str(e)}")
                    raise serializers.ValidationError(f"Error creating exam: {str(e)}")
            
            # Check if certificate already exists for this student and exam
            existing_cert = Certificate.objects.filter(
                student=student, exam=exam
            ).first()
            
            if existing_cert:
                logger.info(f"Certificate already exists for student {student.id} and exam {exam.id}")
                return existing_cert
            
            # Create a new attempt for the certificate
            try:
                attempt = StudentExamAttempt.objects.create(
                    student=student,
                    exam=exam,
                    score=100,
                    is_passed=True
                )
            except Exception as e:
                logger.error(f"Error creating exam attempt: {str(e)}")
                raise serializers.ValidationError(f"Error creating exam attempt: {str(e)}")
            
            # Generate codes
            cert_code = ''.join(random.choices(string.ascii_uppercase + string.digits, k=10))
            verify_code = ''.join(random.choices(string.ascii_uppercase + string.digits, k=10))
            
            # Create certificate
            try:
                certificate = Certificate.objects.create(
                    attempt=attempt,
                    student=student,
                    exam=exam,
                    certificate_code=cert_code,
                    verification_code=verify_code,
                    image=validated_data.get('image')  # Save the uploaded image
                )
            except Exception as e:
                logger.error(f"Error creating certificate: {str(e)}")
                raise serializers.ValidationError(f"Error creating certificate: {str(e)}")
            
            # Create notification for student
            try:
                Notification.objects.create(
                    user=student,
                    title="Certificate Approved ✅",
                    message=f"Your certificate for {course_title} has been approved!\nCode: {cert_code}\nVerification Code: {verify_code}",
                    type="success"
                )
            except Exception as e:
                logger.warning(f"Warning: Could not create notification: {str(e)}")
            
            return certificate
        except serializers.ValidationError:
            raise
        except Exception as e:
            logger.error(f"Unexpected error creating certificate: {str(e)}")
            raise serializers.ValidationError(f"Error creating certificate: {str(e)}")
    
    def to_representation(self, instance):
        """Use CertificateSerializer for the response"""
        return CertificateSerializer(instance, context=self.context).data
