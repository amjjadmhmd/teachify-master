"""
Instructor-specific views for wallet, students, and advanced features
"""
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth import get_user_model
from django.db.models import Count, Avg, Sum, Q
from datetime import datetime, timedelta

from apps.common.permissions import IsInstructor
from .models import Course, Enrollment, LessonProgress
from .serializers import EnrollmentSerializer

User = get_user_model()


@api_view(['GET'])
@permission_classes([IsInstructor])
def instructor_wallet(request):
    """
    GET /api/courses/instructor/wallet/
    Returns instructor's wallet information and transaction history
    """
    instructor = request.user
    
    # Get all courses by this instructor
    courses = Course.objects.filter(instructor=instructor)
    
    # Calculate earnings (mock data - in production, integrate payment system)
    total_students = Enrollment.objects.filter(course__in=courses).count()
    total_revenue = sum(float(course.price) * Enrollment.objects.filter(course=course).count() 
                       for course in courses)
    
    # Mock balance (80% of revenue after platform fee)
    balance = total_revenue * 0.80
    pending_payout = total_revenue * 0.20
    
    # Mock transaction history
    history = []
    for i, course in enumerate(courses[:10]):
        enrollments_count = Enrollment.objects.filter(course=course).count()
        if enrollments_count > 0:
            amount = float(course.price) * enrollments_count * 0.80
            history.append({
                'id': i + 1,
                'type': 'Course Sale',
                'course': course.title,
                'amount': round(amount, 2),
                'date': course.created_at.strftime('%Y-%m-%d')
            })
    
    return Response({
        'balance': round(balance, 2),
        'pending_payout': round(pending_payout, 2),
        'total_revenue': round(total_revenue, 2),
        'total_students': total_students,
        'history': history[:10]  # Last 10 transactions
    })


@api_view(['GET'])
@permission_classes([IsInstructor])
def instructor_students(request):
    """
    GET /api/courses/instructor/students/
    Returns detailed list of students enrolled in instructor's courses
    """
    instructor = request.user
    
    # Get all courses by this instructor
    courses = Course.objects.filter(instructor=instructor)
    
    # Get unique students enrolled in these courses
    enrollments = Enrollment.objects.filter(
        course__in=courses
    ).select_related('student', 'course').order_by('-enrolled_at')
    
    # Group students and aggregate their data
    student_data = {}
    
    for enrollment in enrollments:
        student = enrollment.student
        
        if student.id not in student_data:
            # Calculate progress for this student
            completed_lessons = LessonProgress.objects.filter(
                student=student,
                lesson__course__in=courses,
                is_completed=True
            ).count()
            
            total_lessons = sum(course.lessons.count() for course in courses)
            progress_avg = int((completed_lessons / max(total_lessons, 1)) * 100)
            
            # Get enrolled courses
            enrolled_courses = [
                e.course.title 
                for e in Enrollment.objects.filter(student=student, course__in=courses)
            ]
            
            # Calculate total spent (sum of course prices)
            total_spent = sum(
                float(e.course.price) 
                for e in Enrollment.objects.filter(student=student, course__in=courses)
            )
            
            student_data[student.id] = {
                'id': student.id,
                'name': student.username,
                'email': student.email,
                'enrolled_courses': enrolled_courses,
                'progress_avg': progress_avg,
                'last_active': enrollment.enrolled_at.strftime('%Y-%m-%d'),
                'join_date': student.date_joined.strftime('%Y-%m-%d'),
                'total_spent': round(total_spent, 2)
            }
    
    return Response(list(student_data.values()))


@api_view(['POST'])
@permission_classes([IsInstructor])
def create_course_lesson(request, course_id):
    """
    POST /api/courses/{course_id}/lessons/
    Create a new lesson with video upload
    """
    from .models import Lesson
    from .serializers import LessonSerializer
    
    try:
        course = Course.objects.get(id=course_id, instructor=request.user)
    except Course.DoesNotExist:
        return Response(
            {'error': 'Course not found or you do not have permission'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    # Extract form data
    title = request.data.get('title')
    description = request.data.get('description', '')
    duration_minutes = request.data.get('duration_minutes', 0)
    video_file = request.FILES.get('video')
    
    if not title:
        return Response(
            {'error': 'Title is required'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Validate duration
    try:
        duration_minutes = int(duration_minutes) if duration_minutes else 0
        if duration_minutes <= 0:
            return Response(
                {'error': 'Duration must be greater than 0 minutes'},
                status=status.HTTP_400_BAD_REQUEST
            )
    except (ValueError, TypeError):
        return Response(
            {'error': 'Duration must be a valid number'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Get the next order number for lessons in this course
    last_lesson = Lesson.objects.filter(course=course).order_by('-order').first()
    next_order = (last_lesson.order if last_lesson else 0) + 1
    
    # Create lesson with video file or URL
    try:
        # Generate video URL from uploaded file
        video_url = ''
        if video_file:
            # For development, create a temporary URL for the video file
            # In production, upload to AWS S3 or similar service
            # For now, we'll store it in Django's media folder
            import os
            from django.core.files.storage import default_storage
            
            # Generate unique filename
            import uuid
            ext = os.path.splitext(video_file.name)[1]
            filename = f"videos/{course.id}/{uuid.uuid4().hex}{ext}"
            
            # Save file to storage
            try:
                path = default_storage.save(filename, video_file)
                # Generate full URL
                video_url = f"/media/{path}"
            except Exception as save_error:
                print(f"Error saving video file: {save_error}")
                # Fallback: use the filename as URL (you can process this later)
                video_url = f"videos/{course.id}/{video_file.name}"
        
        lesson = Lesson.objects.create(
            course=course,
            title=title,
            description=description,
            video_url=video_url,  # Store the actual video URL
            duration_minutes=duration_minutes,  # Save duration
            order=next_order
        )
        
        serializer = LessonSerializer(lesson, context={'request': request})
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_400_BAD_REQUEST
        )


@api_view(['POST'])
@permission_classes([IsInstructor])
def create_course_resource(request, course_id):
    """
    POST /api/courses/{course_id}/resources/
    Upload a resource file (PDF, document, etc.)
    """
    from .models import Resource
    from .serializers import ResourceSerializer
    
    try:
        course = Course.objects.get(id=course_id, instructor=request.user)
    except Course.DoesNotExist:
        return Response(
            {'error': 'Course not found or you do not have permission'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    # Handle file upload
    title = request.data.get('title')
    file = request.FILES.get('file')
    
    if not title or not file:
        return Response(
            {'error': 'Title and file are required'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Validate file size (max 50MB)
    max_size = 50 * 1024 * 1024  # 50MB
    if file.size > max_size:
        return Response(
            {'error': f'File size exceeds {max_size // (1024*1024)}MB limit'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Validate file type
    allowed_extensions = ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.txt', '.zip']
    allowed_mimetypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'text/plain',
        'application/zip'
    ]
    
    file_ext = file.name[file.name.rfind('.'):].lower()
    if file_ext not in allowed_extensions or file.content_type not in allowed_mimetypes:
        return Response(
            {'error': f'File type not allowed. Allowed: {", ".join(allowed_extensions)}'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        # Create resource
        resource = Resource.objects.create(
            course=course,
            title=title,
            file=file
        )
        
        serializer = ResourceSerializer(resource, context={'request': request})
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_400_BAD_REQUEST
        )


@api_view(['DELETE'])
@permission_classes([IsInstructor])
def delete_resource(request, resource_id):
    """
    DELETE /api/courses/resources/{resource_id}/
    Delete a resource file
    """
    from .models import Resource
    
    try:
        resource = Resource.objects.get(id=resource_id)
        # Verify user is instructor of the course
        if resource.course.instructor != request.user:
            return Response(
                {'error': 'You do not have permission to delete this resource'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Delete the file from storage
        if resource.file:
            resource.file.delete()
        
        # Delete the resource record
        resource.delete()
        
        return Response(
            {'message': 'Resource deleted successfully'},
            status=status.HTTP_204_NO_CONTENT
        )
    except Resource.DoesNotExist:
        return Response(
            {'error': 'Resource not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_400_BAD_REQUEST
        )


@api_view(['POST'])
@permission_classes([IsInstructor])
def send_certificate_to_student(request):
    """
    POST /api/instructor/certificates/
    Send a certificate image to a student
    """
    from apps.exams.models import Certificate
    from django.core.files.base import ContentFile
    import uuid
    
    student_id = request.data.get('student')
    course_title = request.data.get('course_title')
    image = request.FILES.get('image')
    
    if not all([student_id, course_title, image]):
        return Response(
            {'error': 'student, course_title, and image are required'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        student = User.objects.get(id=student_id, role='student')
    except User.DoesNotExist:
        return Response(
            {'error': 'Student not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    # Create certificate record
    # Note: This is a simplified version - adjust to your Certificate model
    certificate = Certificate.objects.create(
        student=student,
        exam=None,  # Can be None for instructor-issued certificates
        attempt=None,
        certificate_code=uuid.uuid4().hex[:10].upper(),
        verification_code=uuid.uuid4().hex[:10].upper()
    )
    
    # Send notification to student
    from apps.common.models import Notification
    Notification.objects.create(
        user=student,
        title='Certificate Received',
        message=f'You have received a certificate for {course_title}',
        type='success'
    )
    
    return Response({
        'id': certificate.id,
        'message': 'Certificate sent successfully'
    }, status=status.HTTP_201_CREATED)