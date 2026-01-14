from django.db import models
from django.conf import settings
from django.db import models
from django.utils.text import slugify



User = settings.AUTH_USER_MODEL
class Category(models.Model):
    name = models.CharField(max_length=100, unique=True)
    slug = models.SlugField(unique=True, blank=True)

    def save(self, *args, **kwargs):
        # generate slug automatically if empty
        if not self.slug:
            self.slug = slugify(self.name)

        super().save(*args, **kwargs)

    def __str__(self):
        return self.name



class Course(models.Model):
    CHOICES={
        "draft":"DRAFT",
        "publish":"PUBLISH"
    }
    instructor = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="courses"
    )
    title = models.CharField(max_length=255)
    description = models.TextField()
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True)
    price = models.DecimalField(max_digits=8, decimal_places=2, default=0)
    thumbnail = models.ImageField(upload_to="thumbnails/", null=True, blank=True)
    total_duration_minutes = models.IntegerField(default=0, help_text="Auto-calculated from lessons")
    created_at = models.DateTimeField(auto_now_add=True)
    # status = models.CharField(max_length=20,choices=CHOICES,default="DRAFT")  IMPORTANT
    
    def update_total_duration(self):
        """Auto-calculate total duration from all lessons"""
        total = self.lessons.aggregate(models.Sum('duration_minutes'))['duration_minutes__sum'] or 0
        self.total_duration_minutes = total
        self.save(update_fields=['total_duration_minutes'])
    
    def __str__(self):
        return self.title


class Lesson(models.Model):
    course = models.ForeignKey(
        "Course",
        related_name="lessons",
        on_delete=models.CASCADE
    )
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    video_url = models.URLField(blank=True, null=True)
    duration_minutes = models.IntegerField(default=0, help_text="Duration of lesson in minutes (required)")
    order = models.PositiveIntegerField(default=1)

    class Meta:
        ordering = ['order']
        unique_together = ('course', 'order')
    
    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        # Auto-update course total duration when lesson is saved
        self.course.update_total_duration()

    def __str__(self):
        return f"{self.course.title} — {self.order} — {self.title}"


class Resource(models.Model):
    course = models.ForeignKey(
        Course,
        related_name="resources",
        on_delete=models.CASCADE
    )
    title = models.CharField(max_length=255)
    file = models.FileField(upload_to="resources/")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.course.title} — {self.title}"


        
#=======================
#   Progress Tracking
#=======================

class LessonProgress(models.Model):
    student = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="lesson_progress"
    )
    lesson = models.ForeignKey(
        Lesson,
        on_delete=models.CASCADE,
        related_name="progress_entries"
    )

    # ----------- NEW FIELDS -----------
    progress_percent = models.IntegerField(default=0)
    time_spent_minutes = models.IntegerField(default=0, help_text="Auto-set from lesson duration when completed")
    # ---------------------------------

    is_completed = models.BooleanField(default=False)
    completed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        unique_together = ("student", "lesson")  # كل طالب ليه سجل واحد لكل درس
    
    def save(self, *args, **kwargs):
        # Auto-set time_spent_minutes from lesson duration when marking as complete
        if self.is_completed and not self.completed_at:
            self.time_spent_minutes = self.lesson.duration_minutes
            from django.utils import timezone
            self.completed_at = timezone.now()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.student} - {self.lesson} - {self.progress_percent}%"




# ============================
#   ENROLLMENT MODEL
# ============================
class Enrollment(models.Model):
    student = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="enrollments"
    )
    course = models.ForeignKey(
        Course,
        on_delete=models.CASCADE,
        related_name="enrollments"
    )
    enrolled_at = models.DateTimeField(auto_now_add=True)

    # لو عايز تخلي الطالب يتسجل مرة واحدة فقط
    class Meta:
        unique_together = ('student', 'course')

    def __str__(self):
        return f"{self.student} enrolled in {self.course}"


# Wishlist model
class WishlistItem(models.Model):
    student = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="wishlist"
    )
    course = models.ForeignKey(
        Course,
        on_delete=models.CASCADE,
        related_name="wishlisted_by"
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("student", "course")
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.student} ♥ {self.course.title}"


# ============================
#   TASK MODEL (NEW)
# ============================
class Task(models.Model):
    PRIORITY_CHOICES = (
        ("low", "Low"),
        ("medium", "Medium"),
        ("high", "High"),
        ("critical", "Critical"),
    )
    
    instructor = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="tasks_created"
    )
    course = models.ForeignKey(
        Course,
        on_delete=models.CASCADE,
        related_name="tasks"
    )
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    file = models.FileField(
        upload_to="tasks/",
        help_text="PDF, Word, or other document files"
    )
    priority = models.CharField(
        max_length=20,
        choices=PRIORITY_CHOICES,
        default="medium"
    )
    due_date = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.title} - {self.course.title}"


# ============================
#   TASK SUBMISSION MODEL (NEW)
# ============================
class TaskSubmission(models.Model):
    STATUS_CHOICES = (
        ("submitted", "Submitted"),
        ("graded", "Graded"),
        ("pending_review", "Pending Review"),
    )
    
    task = models.ForeignKey(
        Task,
        on_delete=models.CASCADE,
        related_name="submissions"
    )
    student = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="task_submissions"
    )
    submission_file = models.FileField(
        upload_to="task_submissions/",
        help_text="Student submission file"
    )
    submitted_at = models.DateTimeField(auto_now_add=True)
    score = models.IntegerField(
        null=True,
        blank=True,
        help_text="Score/Grade out of 100"
    )
    feedback = models.TextField(blank=True, null=True)
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default="submitted"
    )
    graded_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        unique_together = ("task", "student")
        ordering = ["-submitted_at"]

    def __str__(self):
        return f"{self.student.email} - {self.task.title}"
