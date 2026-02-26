from rest_framework import viewsets, permissions, status, mixins
from rest_framework.response import Response
from rest_framework.decorators import action, api_view
from django.utils import timezone
from django.db.models import Count, Avg, Q
from django.contrib.auth import get_user_model
from django.http import HttpResponse
from datetime import datetime, timedelta

# استيراد الإشعارات 🔔
from apps.common.models import Notification

from .models import (
    Course, Lesson, Category,
    Enrollment, LessonProgress, WishlistItem, LandingCourse, LandingBlog, LandingProject
)
from .serializers import (
    CourseSerializer, LessonSerializer, CategorySerializer,
    EnrollmentSerializer, LessonProgressSerializer, WishlistSerializer,
    LandingCourseSerializer, LandingBlogSerializer, LandingProjectSerializer
)
from .utils import generate_placeholder_thumbnail

User = get_user_model()

# ============================
# 🛡️ 01. الأذونات (Permissions)
# ============================
class IsInstructor(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == "instructor"

class IsStudent(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == "student"


class IsLandingCourseAdmin(permissions.BasePermission):
    """
    Permission for landing-content management endpoints.
    Allows instructors, admins, and Django staff/superusers.
    """

    def has_permission(self, request, view):
        user = request.user
        return bool(
            user.is_authenticated and (
                getattr(user, "role", "") == "instructor"
                or getattr(user, "role", "") == "admin"
                or user.is_staff
                or user.is_superuser
            )
        )


def _is_landing_manager(user):
    return bool(
        user.is_authenticated and (
            getattr(user, "role", "") == "instructor"
            or getattr(user, "role", "") == "admin"
            or user.is_staff
            or user.is_superuser
        )
    )

# ============================
# 📚 02. الكورسات والدروس
# ============================
class CourseViewSet(viewsets.ModelViewSet):
    queryset = Course.objects.select_related("category", "instructor").prefetch_related("lessons", "resources")
    serializer_class = CourseSerializer

    def get_permissions(self):
        if self.action in ["create", "update", "partial_update", "destroy"]:
            return [IsInstructor()]
        return [permissions.AllowAny()]

    def get_queryset(self):
        queryset = super().get_queryset()
        user = self.request.user
        requested_status = (self.request.query_params.get("status") or "").strip().lower()

        if self.action in ["update", "partial_update", "destroy"]:
            if not user.is_authenticated:
                return queryset.none()
            return queryset.filter(instructor=user)

        if user.is_authenticated and (
            getattr(user, "role", "") == "admin" or user.is_staff or user.is_superuser
        ):
            if requested_status in {Course.Status.DRAFT, Course.Status.PUBLISHED}:
                return queryset.filter(status=requested_status)
            return queryset

        if user.is_authenticated and getattr(user, "role", "") == "instructor":
            queryset = queryset.filter(Q(status=Course.Status.PUBLISHED) | Q(instructor=user))
            if requested_status in {Course.Status.DRAFT, Course.Status.PUBLISHED}:
                if requested_status == Course.Status.DRAFT:
                    return queryset.filter(instructor=user, status=Course.Status.DRAFT)
                return queryset.filter(status=Course.Status.PUBLISHED)
            return queryset.distinct()

        # Public/student users can only see published courses.
        queryset = queryset.filter(status=Course.Status.PUBLISHED)
        if requested_status == Course.Status.DRAFT:
            return queryset.none()
        return queryset

    def perform_create(self, serializer):
        serializer.save(instructor=self.request.user)

class LessonViewSet(viewsets.ModelViewSet):
    queryset = Lesson.objects.all()
    serializer_class = LessonSerializer
    def get_permissions(self):
        if self.action in ["create", "update", "partial_update", "destroy"]:
            return [IsInstructor()]
        return [permissions.AllowAny()]

# ============================
# ❤️ 03. المفضلة والاشتراكات
# ============================
class WishlistViewSet(mixins.ListModelMixin, mixins.CreateModelMixin, 
                      mixins.DestroyModelMixin, viewsets.GenericViewSet):
    serializer_class = WishlistSerializer
    permission_classes = [permissions.IsAuthenticated, IsStudent]
    def get_queryset(self):
        return WishlistItem.objects.filter(student=self.request.user)
    def perform_create(self, serializer):
        course = serializer.validated_data.get('course')
        # Check if already in wishlist, if so don't create duplicate
        if course and WishlistItem.objects.filter(student=self.request.user, course=course).exists():
            return
        serializer.save(student=self.request.user)

class EnrollmentViewSet(viewsets.ModelViewSet):
    queryset = Enrollment.objects.all()
    serializer_class = EnrollmentSerializer
    permission_classes = [permissions.IsAuthenticated, IsInstructor]

# ============================
# 📊 04. لوحات التحكم
# ============================




# ============================
# 🏷️ 05. التقدم (المنطق المعدل) 👈
# ============================
class LessonProgressViewSet(viewsets.ModelViewSet):
    queryset = LessonProgress.objects.all()
    serializer_class = LessonProgressSerializer
    permission_classes = [permissions.IsAuthenticated, IsStudent]

    def perform_create(self, serializer):
        # حفظ التقدم الدراسي
        progress = serializer.save(student=self.request.user)

        # ⚡ منطق الإشعارات الجديد
        if progress.is_completed:
            completed_count = LessonProgress.objects.filter(
                student=self.request.user, is_completed=True
            ).count()

            # تحفيز الطالب عند الوصول لأرقام معينة
            if completed_count in [1, 3, 5, 10]:
                Notification.objects.create(
                    user=self.request.user,
                    title="إنجاز جديد 🏆",
                    message=f"لقد أكملت {completed_count} دروس حتى الآن. استمر في التألق!",
                    type="success"
                )

class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [permissions.AllowAny]
    

class LandingCourseViewSet(viewsets.ModelViewSet):
    """
    Public read + admin write ViewSet for landing-page courses.
    """

    queryset = LandingCourse.objects.prefetch_related("episodes").all()
    serializer_class = LandingCourseSerializer

    def get_permissions(self):
        if self.action in ["list", "retrieve"]:
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated(), IsLandingCourseAdmin()]

    def get_queryset(self):
        queryset = super().get_queryset().order_by("sort_order", "id")

        user = self.request.user
        is_admin_user = _is_landing_manager(user)

        # Public users see published items only.
        if not is_admin_user:
            queryset = queryset.filter(is_published=True)

        # Optional filter for admin dashboards.
        published = self.request.query_params.get("published")
        if published is not None:
            normalized = published.strip().lower()
            if normalized in {"true", "1", "yes"}:
                queryset = queryset.filter(is_published=True)
            elif normalized in {"false", "0", "no"} and is_admin_user:
                queryset = queryset.filter(is_published=False)

        return queryset

    def perform_create(self, serializer):
        serializer.save(
            created_by=self.request.user,
            updated_by=self.request.user,
        )

    def perform_update(self, serializer):
        serializer.save(updated_by=self.request.user)


class LandingBlogViewSet(viewsets.ModelViewSet):
    """
    Public read + instructor/admin write ViewSet for landing blogs.
    """

    queryset = LandingBlog.objects.all()
    serializer_class = LandingBlogSerializer

    def get_permissions(self):
        if self.action in ["list", "retrieve"]:
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated(), IsLandingCourseAdmin()]

    def get_queryset(self):
        queryset = super().get_queryset().order_by("sort_order", "id")
        user = self.request.user
        is_manager_user = _is_landing_manager(user)

        if not is_manager_user:
            queryset = queryset.filter(is_published=True)

        published = self.request.query_params.get("published")
        if published is not None:
            normalized = published.strip().lower()
            if normalized in {"true", "1", "yes"}:
                queryset = queryset.filter(is_published=True)
            elif normalized in {"false", "0", "no"} and is_manager_user:
                queryset = queryset.filter(is_published=False)

        return queryset

    def perform_create(self, serializer):
        serializer.save(
            created_by=self.request.user,
            updated_by=self.request.user,
        )

    def perform_update(self, serializer):
        serializer.save(updated_by=self.request.user)


class LandingProjectViewSet(viewsets.ModelViewSet):
    """
    Public read + instructor/admin write ViewSet for landing projects.
    """

    queryset = LandingProject.objects.all()
    serializer_class = LandingProjectSerializer

    def get_permissions(self):
        if self.action in ["list", "retrieve"]:
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated(), IsLandingCourseAdmin()]

    def get_queryset(self):
        queryset = super().get_queryset().order_by("sort_order", "id")
        user = self.request.user
        is_manager_user = _is_landing_manager(user)

        if not is_manager_user:
            queryset = queryset.filter(is_published=True)

        published = self.request.query_params.get("published")
        if published is not None:
            normalized = published.strip().lower()
            if normalized in {"true", "1", "yes"}:
                queryset = queryset.filter(is_published=True)
            elif normalized in {"false", "0", "no"} and is_manager_user:
                queryset = queryset.filter(is_published=False)

        return queryset

    def perform_create(self, serializer):
        serializer.save(
            created_by=self.request.user,
            updated_by=self.request.user,
        )

    def perform_update(self, serializer):
        serializer.save(updated_by=self.request.user)



class InstructorDashboardViewSet(viewsets.ViewSet):
    """
    Instructor Dashboard - Overview of courses, students, earnings
    GET /api/courses/instructor/dashboard/
    """
    permission_classes = [permissions.IsAuthenticated, IsInstructor]
    
    def list(self, request):
        instructor = request.user
        
        # Get instructor's courses
        courses = Course.objects.filter(instructor=instructor)
        
        # Calculate statistics
        total_courses = courses.count()
        total_lessons = Lesson.objects.filter(course__in=courses).count()
        total_students = Enrollment.objects.filter(course__in=courses).values('student').distinct().count()
        
        # Calculate earnings
        enrollments = Enrollment.objects.filter(course__in=courses)
        total_earnings = sum(float(e.course.price) for e in enrollments)
        
        # Calculate pending payouts (20% platform fee held)
        pending_payouts = total_earnings * 0.20
        
        # Calculate average rating (mock for now - add Rating model later)
        average_rating = 4.8
        
        # Revenue trend for last 7 days (mock data)
        revenue_trend = []
        for i in range(7):
            date = datetime.now() - timedelta(days=6-i)
            # In production, calculate actual daily revenue
            daily_revenue = (total_earnings / 30) if total_earnings > 0 else 0
            revenue_trend.append({
                'date': date.strftime('%b %d'),
                'amount': round(daily_revenue * (0.8 + i * 0.05), 2)  # Mock trend
            })
        
        # Latest enrollments
        latest_enrollments = Enrollment.objects.filter(
            course__in=courses
        ).select_related('student', 'course').order_by('-enrolled_at')[:10]
        
        enrollments_data = [{
            'student_name': e.student.username,
            'course_title': e.course.title,
            'date': e.enrolled_at.strftime('%Y-%m-%d')
        } for e in latest_enrollments]
        
        # Pending assessments - exams awaiting instructor review
        try:
            from apps.exams.models import StudentExamAttempt
            
            # Get recent exam attempts from instructor's courses
            pending_exams = StudentExamAttempt.objects.filter(
                exam__course__instructor=request.user
            ).select_related('student', 'exam', 'exam__course').order_by('-finished_at')[:5]
            
            pending_assignments = [{
                'id': attempt.id,
                'title': attempt.exam.title,
                'student_name': attempt.student.username,
                'score': int(attempt.score) if attempt.score else 0,
                'date': attempt.finished_at.strftime('%Y-%m-%d %H:%M') if attempt.finished_at else 'In Progress',
                'course_title': attempt.exam.course.title
            } for attempt in pending_exams]
        except Exception as e:
            print(f"Error fetching pending exams: {e}")
            pending_assignments = []
        
        # Serialize courses using CourseSerializer
        from .serializers import CourseSerializer
        courses_serializer = CourseSerializer(courses, many=True, context={'request': request})
        
        return Response({
            'stats': {
                'total_earnings': round(total_earnings, 2),
                'total_students': total_students,
                'total_courses': total_courses,
                'total_lessons': total_lessons,
                'average_rating': average_rating,
                'pending_payouts': round(pending_payouts, 2)
            },
            'my_courses': courses_serializer.data,
            'revenue_trend': revenue_trend,
            'latest_enrollments': enrollments_data,
            'pending_assignments': pending_assignments
        })


class DashboardViewSet(viewsets.ViewSet):
    """
    Student Dashboard - Overview of enrolled courses and progress
    GET /api/courses/dashboard/
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def list(self, request):
        student = request.user
        
        # Get enrolled courses
        enrollments = Enrollment.objects.filter(
            student=student
        ).select_related('course').prefetch_related('course__lessons', 'course__resources')
        
        courses_data = []
        for enrollment in enrollments:
            course = enrollment.course
            
            # Calculate progress
            total_lessons = course.lessons.count()
            completed_lessons = LessonProgress.objects.filter(
                student=student,
                lesson__course=course,
                is_completed=True
            ).count()
            
            progress = int((completed_lessons / total_lessons * 100)) if total_lessons > 0 else 0
            
            # Get lessons with completion status for each
            lessons_data = []
            for lesson in course.lessons.all().order_by('order'):
                is_completed = LessonProgress.objects.filter(
                    student=student,
                    lesson=lesson,
                    is_completed=True
                ).exists()
                
                lessons_data.append({
                    'id': lesson.id,
                    'title': lesson.title,
                    'description': lesson.description,
                    'video_url': lesson.video_url,
                    'duration_minutes': lesson.duration_minutes,
                    'order': lesson.order,
                    'is_completed': is_completed,
                })
            
            # Get resources with proper URLs
            resources_data = []
            for resource in course.resources.all():
                resource_url = resource.file.url if resource.file else None
                if resource_url and request:
                    resource_url = request.build_absolute_uri(resource_url)
                resources_data.append({
                    'id': resource.id,
                    'title': resource.title,
                    'file': resource.file.name if resource.file else None,
                    'file_url': resource_url,
                    'created_at': resource.created_at.isoformat(),
                })
            
            # Use serializer to get proper thumbnail URL
            from .serializers import CourseSerializer
            course_serializer = CourseSerializer(course, context={'request': request})
            thumbnail_url = course_serializer.data.get('thumbnail_url')
            
            courses_data.append({
                'id': course.id,
                'title': course.title,
                'description': course.description,
                'thumbnail': course_serializer.data.get('thumbnail'),  # File path
                'thumbnail_url': thumbnail_url,  # Full URL or fallback
                'progress': progress,
                'total_lessons': total_lessons,
                'completed_lessons': completed_lessons,
                'instructor': course.instructor.username,
                'enrolled_at': enrollment.enrolled_at.strftime('%Y-%m-%d'),
                'lessons': lessons_data,  # Add lessons with completion status
                'resources': resources_data,  # Add resources with file URLs
                'category': course.category.id if course.category else None,
                'category_name': course.category.name if course.category else None,
            })
        
        # Calculate overall statistics
        total_completed_lessons = LessonProgress.objects.filter(
            student=student,
            is_completed=True
        ).count()
        
        total_enrolled_courses = len(courses_data)
        overall_progress = sum(c['progress'] for c in courses_data) / len(courses_data) if courses_data else 0
        
        # Calculate average quiz score from exam attempts
        from apps.exams.models import StudentExamAttempt, Certificate
        from django.db.models import Avg
        
        attempts = StudentExamAttempt.objects.filter(
            student=student,
            finished_at__isnull=False
        )
        average_score = 0
        if attempts.exists():
            average_score = round(float(attempts.aggregate(Avg('score'))['score__avg'] or 0), 1)
        
        # Get earned certificates
        certificates = Certificate.objects.filter(student=student)
        earned_certificates = [{
            'id': cert.id,
            'course_title': cert.exam.course.title,
            'issued_at': cert.issued_at.strftime('%Y-%m-%d'),
            'image_url': request.build_absolute_uri(cert.image.url) if cert.image else '',
            'certificate_url': '',
        } for cert in certificates]
        
        # Calculate total hours and minutes studied (from completed lessons)
        from django.db.models import Sum
        total_minutes = LessonProgress.objects.filter(
            student=student,
            is_completed=True  # Only count completed lessons
        ).aggregate(Sum('time_spent_minutes'))['time_spent_minutes__sum'] or 0
        total_hours = total_minutes // 60
        remaining_minutes = total_minutes % 60
        
        return Response({
            'active_courses': courses_data,  # Match frontend expectation
            'enrolled_courses': courses_data,  # Keep for backward compatibility
            'total_courses': total_enrolled_courses,
            'total_completed_lessons': total_completed_lessons,
            'avg_progress': int(overall_progress),
            'progress_percent': int(overall_progress),
            'total_enrolled_courses': total_enrolled_courses,
            'wishlist_count': 0,  # Add default values to match DashboardData interface
            'latest_completed_lessons': [],
            'earned_certificates': earned_certificates,
            'past_results': [],
            'my_assignments': [],
            'average_quiz_score': average_score,
            'total_hours_studied': total_hours,
            'total_minutes_studied': remaining_minutes,
            'upcoming_tasks': [],
        })


class TopStudentsViewSet(viewsets.ViewSet):
    """
    Top Students Leaderboard (Instructor Only)
    Returns top 10 students enrolled in THIS instructor's courses
    GET /api/courses/top-students/
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def list(self, request):
        try:
            # Check if user is instructor
            if request.user.role != 'instructor':
                return Response(
                    {'detail': 'Only instructors can view the top students leaderboard.'},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            instructor = request.user
            from django.contrib.auth import get_user_model
            User = get_user_model()
            
            # Get all courses by this instructor
            instructor_courses = Course.objects.filter(instructor=instructor)
            
            # Get unique students enrolled in these courses, ranked by completed lessons
            students = User.objects.filter(
                role='student',
                enrollments__course__in=instructor_courses
            ).distinct().annotate(
                completed_count=Count(
                    'lesson_progress',
                    filter=Q(
                        lesson_progress__is_completed=True
                    ) & Q(
                        lesson_progress__lesson__course__in=instructor_courses
                    )
                )
            ).order_by('-completed_count')[:10]
            
            leaderboard = []
            for idx, student in enumerate(students, 1):
                leaderboard.append({
                    'rank': idx,
                    'id': student.id,
                    'name': student.username,
                    'completed_lessons': student.completed_count,
                    'avatar': request.build_absolute_uri(student.avatar.url) if hasattr(student, 'avatar') and student.avatar else None
                })
            
            return Response(leaderboard)
        except Exception as e:
            return Response(
                {'detail': f'Error fetching top students: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


@api_view(['GET'])
def placeholder_thumbnail(request, course_id):
    """
    Generate and return a placeholder thumbnail for a course
    GET /api/courses/placeholder-thumbnail/{course_id}/
    """
    try:
        course = Course.objects.get(id=course_id)
    except Course.DoesNotExist:
        return Response(
            {'error': 'Course not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    # Generate placeholder thumbnail
    try:
        img_file = generate_placeholder_thumbnail(course.id, course.title)
        if not img_file:
            return Response(
                {'error': 'Could not generate thumbnail'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        
        response = HttpResponse(img_file.read(), content_type='image/jpeg')
        response['Content-Disposition'] = f'inline; filename="placeholder_{course_id}.jpg"'
        return response
    except Exception as e:
        return Response(
            {'error': f'Error generating thumbnail: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


# ============================
#   TASK VIEWS (NEW)
# ============================
from rest_framework.decorators import action
from rest_framework import viewsets, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .models import Task, TaskSubmission
from .serializers import TaskSerializer, TaskSubmissionSerializer, TaskSubmissionCreateSerializer
from apps.common.permissions import IsInstructor, IsStudent
from django.shortcuts import get_object_or_404
from django.utils import timezone


class TaskViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Task management.
    Instructors can create, read, update, delete tasks.
    Students can only view tasks for their enrolled courses.
    """
    serializer_class = TaskSerializer
    permission_classes = [IsAuthenticated]
    queryset = Task.objects.all()

    def get_queryset(self):
        user = self.request.user
        if user.role == 'instructor':
            # Instructors see only their own tasks
            return Task.objects.filter(instructor=user)
        elif user.role == 'student':
            # Students see tasks from courses they're enrolled in
            from .models import Enrollment
            enrolled_courses = Enrollment.objects.filter(
                student=user
            ).values_list('course', flat=True)
            return Task.objects.filter(course__in=enrolled_courses)
        return Task.objects.none()

    def list(self, request, *args, **kwargs):
        """
        Override list to support course filtering.
        Students can filter by course parameter.
        """
        queryset = self.get_queryset()
        
        # Support filtering by course
        course_id = request.query_params.get('course')
        if course_id:
            queryset = queryset.filter(course_id=course_id)
        
        # Support filtering by priority
        priority = request.query_params.get('priority')
        if priority:
            queryset = queryset.filter(priority=priority)
        
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    def perform_create(self, serializer):
        # Set the instructor as the current user
        serializer.save(instructor=self.request.user)

    def create(self, request, *args, **kwargs):
        # Only instructors can create tasks
        if request.user.role != 'instructor':
            return Response(
                {'detail': 'Only instructors can create tasks'},
                status=status.HTTP_403_FORBIDDEN
            )
        return super().create(request, *args, **kwargs)

    def update(self, request, *args, **kwargs):
        # Only the task creator can update
        task = self.get_object()
        if task.instructor != request.user:
            return Response(
                {'detail': 'You can only update your own tasks'},
                status=status.HTTP_403_FORBIDDEN
            )
        return super().update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        # Only the task creator can delete
        task = self.get_object()
        if task.instructor != request.user:
            return Response(
                {'detail': 'You can only delete your own tasks'},
                status=status.HTTP_403_FORBIDDEN
            )
        return super().destroy(request, *args, **kwargs)

    @action(detail=True, methods=['get'], permission_classes=[IsAuthenticated])
    def submissions(self, request, pk=None):
        """
        Get all submissions for a task.
        Only the task instructor and submitting student can see this.
        """
        task = self.get_object()
        
        # Only instructor of the course can see submissions
        if task.instructor != request.user:
            return Response(
                {'detail': 'You do not have permission to view these submissions'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        submissions = task.submissions.all()
        serializer = TaskSubmissionSerializer(
            submissions,
            many=True,
            context={'request': request}
        )
        return Response(serializer.data)


class TaskSubmissionViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Task Submissions.
    Students can submit their work.
    Instructors can grade submissions.
    """
    serializer_class = TaskSubmissionSerializer
    permission_classes = [IsAuthenticated]
    queryset = TaskSubmission.objects.all()

    def get_queryset(self):
        user = self.request.user
        if user.role == 'instructor':
            # Instructors see submissions for their tasks
            return TaskSubmission.objects.filter(task__instructor=user)
        elif user.role == 'student':
            # Students see only their own submissions
            return TaskSubmission.objects.filter(student=user)
        return TaskSubmission.objects.none()

    def get_serializer_class(self):
        if self.action == 'create':
            return TaskSubmissionCreateSerializer
        return TaskSubmissionSerializer

    def create(self, request, *args, **kwargs):
        # Only students can submit
        if request.user.role != 'student':
            return Response(
                {'detail': 'Only students can submit tasks'},
                status=status.HTTP_403_FORBIDDEN
            )
        return super().create(request, *args, **kwargs)

    def perform_create(self, serializer):
        serializer.save(student=self.request.user)

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def grade(self, request, pk=None):
        """
        Grade a task submission.
        Only the task instructor can grade.
        """
        submission = self.get_object()
        
        # Only the task instructor can grade
        if submission.task.instructor != request.user:
            return Response(
                {'detail': 'Only the task instructor can grade submissions'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        score = request.data.get('score')
        feedback = request.data.get('feedback', '')
        
        if score is None or not (0 <= score <= 100):
            return Response(
                {'detail': 'Score must be between 0 and 100'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        submission.score = score
        submission.feedback = feedback
        submission.status = 'graded'
        submission.graded_at = timezone.now()
        submission.save()
        
        serializer = TaskSubmissionSerializer(
            submission,
            context={'request': request}
        )
        return Response(serializer.data)

    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def my_submissions(self, request):
        """
        Get the current student's submissions for all tasks.
        """
        if request.user.role != 'student':
            return Response(
                {'detail': 'Only students can view their submissions'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        submissions = TaskSubmission.objects.filter(student=request.user)
        serializer = TaskSubmissionSerializer(
            submissions,
            many=True,
            context={'request': request}
        )
        return Response({
            'count': submissions.count(),
            'results': serializer.data
        })
