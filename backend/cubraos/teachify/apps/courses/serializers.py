from rest_framework import serializers
from .models import Course, Lesson, Category, Enrollment, LessonProgress, WishlistItem, Resource, Task, TaskSubmission
from django.contrib.auth import get_user_model

User = get_user_model()

# ==========================================
# 01. CATEGORY SERIALIZER (تم حل مشكلة الـ icon)
# ==========================================
class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        # تم حذف 'icon' لأنه غير موجود بالموديل ويسبب ImproperlyConfigured
        fields = ["id", "name", "slug"] 
        read_only_fields = ["id", "slug"]


# ==========================================
# 02. LESSON SERIALIZER 
# ==========================================
class LessonSerializer(serializers.ModelSerializer):
    class Meta:
        model = Lesson
        fields = ["id", "course", "title", "description", "video_url", "duration_minutes", "order"]
        read_only_fields = ["id"]
    
    def validate_duration_minutes(self, value):
        """Duration must be greater than 0"""
        if value <= 0:
            raise serializers.ValidationError("Duration must be greater than 0 minutes")
        return value
    
    def validate(self, data):
        """Ensure duration is provided"""
        if 'duration_minutes' not in data or data['duration_minutes'] == 0:
            raise serializers.ValidationError({"duration_minutes": "Duration is required and must be greater than 0"})
        return data


# ==========================================
# 02.5 RESOURCE SERIALIZER
# ==========================================
class ResourceSerializer(serializers.ModelSerializer):
    file_url = serializers.SerializerMethodField()

    class Meta:
        model = Resource
        fields = ["id", "course", "title", "file", "file_url", "created_at"]
        read_only_fields = ["id", "created_at"]

    def get_file_url(self, obj):
        request = self.context.get("request")
        if obj.file:
            try:
                return request.build_absolute_uri(obj.file.url) if request else obj.file.url
            except:
                return None
        return None


# ==========================================
# 03. LESSON PROGRESS SERIALIZER
# ==========================================
class LessonProgressSerializer(serializers.ModelSerializer):
    lesson_title = serializers.ReadOnlyField(source="lesson.title")
    lesson_duration = serializers.ReadOnlyField(source="lesson.duration_minutes")

    class Meta:
        model = LessonProgress
        fields = [
            "id", "lesson", "lesson_title", "lesson_duration", "student", 
            "is_completed", "completed_at", "progress_percent", "time_spent_minutes"
        ]
        read_only_fields = ["student", "completed_at", "progress_percent", "time_spent_minutes"]


# ==========================================
# 04. ENROLLMENT SERIALIZER
# ==========================================
class EnrollmentSerializer(serializers.ModelSerializer):
    course_title = serializers.ReadOnlyField(source="course.title")
    student_email = serializers.ReadOnlyField(source="student.email")

    class Meta:
        model = Enrollment
        fields = ["id", "student", "student_email", "course", "course_title", "enrolled_at"]
        read_only_fields = ["id", "student", "enrolled_at"]


# ==========================================
# 05. COURSE SERIALIZER
# ==========================================
class CourseSerializer(serializers.ModelSerializer):
    lessons = LessonSerializer(many=True, read_only=True)
    resources = ResourceSerializer(many=True, read_only=True)
    category_details = CategorySerializer(source="category", read_only=True)
    is_enrolled = serializers.SerializerMethodField()
    thumbnail = serializers.ImageField(required=False, allow_null=True)
    thumbnail_url = serializers.SerializerMethodField()
    status = serializers.SerializerMethodField()

    class Meta:
        model = Course
        fields = [
            "id", "instructor", "title", "description", 
            "category", "category_details", "price", "thumbnail", "thumbnail_url",
            "total_duration_minutes", "created_at", "lessons", "resources", "is_enrolled", "status"
        ]
        read_only_fields = ["id", "instructor", "created_at", "thumbnail_url", "total_duration_minutes"]
    
    def get_thumbnail_url(self, obj):
        """Return absolute URL for thumbnail image or generate a fallback"""
        request = self.context.get("request")
        
        # Try to use existing thumbnail
        if obj.thumbnail:
            try:
                # Check if file actually exists
                if obj.thumbnail.storage.exists(obj.thumbnail.name):
                    thumb_url = obj.thumbnail.url
                    if request:
                        return request.build_absolute_uri(thumb_url)
                    else:
                        return thumb_url
            except Exception as e:
                print(f"Error getting thumbnail URL: {e}")
        
        # Fallback: Generate a default thumbnail URL based on course ID
        # This will be a colored placeholder based on the course ID
        default_thumb = f"/api/courses/placeholder-thumbnail/{obj.id}/"
        if request:
            return request.build_absolute_uri(default_thumb)
        return default_thumb
    
    def get_status(self, obj):
        """Return course status - default to 'published'"""
        return getattr(obj, 'status', 'published')
    
    def get_is_enrolled(self, obj):
        """Check if current user is enrolled"""
        request = self.context.get("request")
        if not request or not request.user.is_authenticated:
            return False
        return obj.enrollments.filter(student=request.user).exists()


# ==========================================
# 06. WISHLIST SERIALIZER
# ==========================================
class WishlistSerializer(serializers.ModelSerializer):
    course_title = serializers.ReadOnlyField(source="course.title")
    course_thumbnail = serializers.SerializerMethodField()

    class Meta:
        model = WishlistItem
        fields = ["id", "student", "course", "course_title", "course_thumbnail", "created_at"]
        read_only_fields = ["id", "student", "created_at"]

    def get_course_thumbnail(self, obj):
        # Handle both model instances and validated data (OrderedDict)
        if isinstance(obj, dict):
            course = obj.get('course')
            if isinstance(course, dict):
                return course.get('thumbnail')
            return None
        
        request = self.context.get('request')
        if hasattr(obj, 'course') and obj.course and hasattr(obj.course, 'thumbnail') and obj.course.thumbnail:
            try:
                return request.build_absolute_uri(obj.course.thumbnail.url) if request else obj.course.thumbnail.url
            except:
                return None


# ==========================================
# TASK SERIALIZERS (NEW)
# ==========================================
class TaskSerializer(serializers.ModelSerializer):
    instructor_name = serializers.ReadOnlyField(source="instructor.email")
    course_title = serializers.ReadOnlyField(source="course.title")
    file_url = serializers.SerializerMethodField()
    submission_count = serializers.SerializerMethodField()

    class Meta:
        model = Task
        fields = [
            "id", "instructor", "instructor_name", "course", "course_title",
            "title", "description", "file", "file_url", "priority", "due_date",
            "created_at", "updated_at", "submission_count"
        ]
        read_only_fields = ["id", "instructor", "created_at", "updated_at"]

    def get_file_url(self, obj):
        request = self.context.get('request')
        if obj.file:
            try:
                return request.build_absolute_uri(obj.file.url) if request else obj.file.url
            except:
                return None
        return None

    def get_submission_count(self, obj):
        return obj.submissions.count()


# ==========================================
# TASK SUBMISSION SERIALIZERS (NEW)
# ==========================================
class TaskSubmissionSerializer(serializers.ModelSerializer):
    student_name = serializers.ReadOnlyField(source="student.email")
    student_username = serializers.ReadOnlyField(source="student.username")
    task_title = serializers.ReadOnlyField(source="task.title")
    submission_file_url = serializers.SerializerMethodField()

    class Meta:
        model = TaskSubmission
        fields = [
            "id", "task", "task_title", "student", "student_name", "student_username",
            "submission_file", "submission_file_url", "submitted_at", "score", 
            "feedback", "status", "graded_at"
        ]
        read_only_fields = ["id", "submitted_at", "student"]

    def get_submission_file_url(self, obj):
        request = self.context.get('request')
        if obj.submission_file:
            try:
                return request.build_absolute_uri(obj.submission_file.url) if request else obj.submission_file.url
            except:
                return None
        return None


# ==========================================
# TASK SUBMISSION CREATE SERIALIZER
# ==========================================
class TaskSubmissionCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = TaskSubmission
        fields = ["task", "submission_file"]
        read_only_fields = ["student"]

    def create(self, validated_data):
        validated_data['student'] = self.context['request'].user
        return super().create(validated_data)