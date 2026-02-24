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


# ============================
#   SHOPPING CART MODEL
# ============================
class CartItem(models.Model):
    student = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="cart_items"
    )
    course = models.ForeignKey(
        Course,
        on_delete=models.CASCADE,
        related_name="cart_items"
    )
    added_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("student", "course")
        ordering = ["-added_at"]

    def __str__(self):
        return f"{self.student.email} - {self.course.title}"


# ============================
#   PAYMENT REQUEST MODEL
# ============================
class PaymentRequest(models.Model):
    STATUS_CHOICES = (
        ("pending", "Pending"),
        ("approved", "Approved"),
        ("rejected", "Rejected"),
    )

    student = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="payment_requests"
    )
    instructor = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="received_payment_requests",
        null=True,
        blank=True
    )
    
    # Track courses in this payment request (many-to-many)
    courses = models.ManyToManyField(
        Course,
        related_name="payment_requests"
    )
    
    # Payment details
    total_amount = models.DecimalField(max_digits=10, decimal_places=2)
    payment_proof_image = models.ImageField(upload_to="payment_proofs/")
    
    # Status tracking
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default="pending"
    )
    rejection_reason = models.TextField(blank=True, null=True)
    
    # Timestamps
    submitted_at = models.DateTimeField(auto_now_add=True)
    processed_at = models.DateTimeField(null=True, blank=True)
    processed_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="processed_payment_requests"
    )

    class Meta:
        ordering = ["-submitted_at"]

    def __str__(self):
        return f"{self.student.email} - Payment Request #{self.id} ({self.status})"


class LandingCourse(models.Model):
    """
    Dedicated model for landing-page course content managed by admins.
    Kept separate from Course to avoid impacting existing marketplace/integration flows.
    """

    title = models.CharField(max_length=255)
    slug = models.SlugField(max_length=300, unique=True, blank=True)
    short_description = models.CharField(max_length=300, blank=True)
    description = models.TextField(blank=True)
    image_url = models.URLField(max_length=1000, blank=True)
    price = models.DecimalField(max_digits=8, decimal_places=2, default=0)
    is_free = models.BooleanField(default=True)
    instructor_name = models.CharField(max_length=255, blank=True)
    level_label = models.CharField(max_length=255, blank=True)
    course_language = models.CharField(max_length=120, blank=True)
    rating_value = models.DecimalField(max_digits=3, decimal_places=2, default=5.00)
    enrolled_students = models.PositiveIntegerField(default=0)
    requirements = models.JSONField(default=list, blank=True)
    outcomes = models.JSONField(default=list, blank=True)
    sort_order = models.PositiveIntegerField(default=0, db_index=True)
    is_published = models.BooleanField(default=True, db_index=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="landing_courses_created",
    )
    updated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="landing_courses_updated",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["sort_order", "id"]

    def save(self, *args, **kwargs):
        if not self.slug:
            base_slug = slugify(self.title) or "landing-course"
            unique_slug = base_slug
            counter = 2
            while LandingCourse.objects.filter(slug=unique_slug).exclude(pk=self.pk).exists():
                unique_slug = f"{base_slug}-{counter}"
                counter += 1
            self.slug = unique_slug
        super().save(*args, **kwargs)

    def __str__(self):
        return self.title


class LandingCourseEpisode(models.Model):
    course = models.ForeignKey(
        LandingCourse,
        on_delete=models.CASCADE,
        related_name="episodes",
    )
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    duration_minutes = models.PositiveIntegerField(default=0)
    video_url = models.URLField(max_length=1000, blank=True)
    sort_order = models.PositiveIntegerField(default=0, db_index=True)
    is_preview = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["sort_order", "id"]

    def __str__(self):
        return f"{self.course.title} - {self.title}"
