"""
Public API views for landing page and unauthenticated users
"""
from rest_framework import viewsets, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from django.contrib.auth import get_user_model
from django.db.models import Count, Avg

from .models import Course, Enrollment
from .serializers import CourseSerializer

User = get_user_model()

@api_view(['GET'])
@permission_classes([AllowAny])
def platform_stats(request):
    """
    GET /api/public/stats/
    Returns public platform statistics for landing page
    """
    total_students = User.objects.filter(role='student').count()
    total_instructors = User.objects.filter(role='instructor').count()
    total_courses = Course.objects.filter(status=Course.Status.PUBLISHED).count()
    total_enrollments = Enrollment.objects.count()
    
    # Calculate hired graduates (mock: 96% of enrolled students)
    hired_percentage = int((total_enrollments / max(total_students, 1)) * 96) if total_students > 0 else 0
    
    return Response({
        'active_students': f"{total_students:,}+",
        'expert_instructors': str(total_instructors),
        'total_courses': str(total_courses),
        'hired_graduates': f"{hired_percentage}%"
    })


@api_view(['GET'])
@permission_classes([AllowAny])
def public_instructors(request):
    """
    GET /api/public/instructors/
    Returns list of instructors with their stats for public display
    """
    instructors = User.objects.filter(role='instructor').annotate(
        course_count=Count('courses'),
        student_count=Count('courses__enrollments', distinct=True)
    )[:12]  # Limit to 12 featured instructors
    
    data = []
    for instructor in instructors:
        data.append({
            'id': instructor.id,
            'name': instructor.username,
            'role': 'Senior Instructor',  # Can be customized per user
            'company': 'Teachify',  # Can be added to User model
            'image': request.build_absolute_uri(instructor.avatar.url) if instructor.avatar else None,
            'bio': f"Expert instructor with {instructor.course_count} courses",
            'student_count': f"{instructor.student_count}+",
            'rating': 4.8  # Can be calculated from course ratings
        })
    
    return Response(data)


class PublicCourseViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Public read-only access to courses for marketplace browsing
    """
    queryset = Course.objects.filter(status=Course.Status.PUBLISHED)
    serializer_class = CourseSerializer
    permission_classes = [AllowAny]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Filter by category if provided
        category = self.request.query_params.get('category', None)
        if category:
            queryset = queryset.filter(category__slug=category)
        
        # Search functionality
        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(
                title__icontains=search
            ) | queryset.filter(
                description__icontains=search
            )
        
        return queryset.order_by('-created_at')
