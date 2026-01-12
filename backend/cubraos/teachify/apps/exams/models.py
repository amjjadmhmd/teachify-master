from django.db import models
from django.conf import settings
from apps.courses.models import Course
import uuid

User = settings.AUTH_USER_MODEL


class Exam(models.Model):
    course = models.ForeignKey(
        Course, on_delete=models.CASCADE, related_name="exams"
    )
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    time_limit = models.PositiveIntegerField(default=30)
    total_marks = models.PositiveIntegerField(default=0)
    publish_date = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.title} — {self.course.title}"


class Question(models.Model):
    exam = models.ForeignKey(
        Exam, on_delete=models.CASCADE, related_name="questions"
    )
    question_text = models.TextField()
    option_a = models.CharField(max_length=255)
    option_b = models.CharField(max_length=255)
    option_c = models.CharField(max_length=255)
    option_d = models.CharField(max_length=255)
    correct_option = models.CharField(
        max_length=1,
        choices=[("A", "Option A"), ("B", "Option B"), ("C", "Option C"), ("D", "Option D")],
    )
    mark = models.PositiveIntegerField(default=1)

    def __str__(self):
        return f"Q: {self.question_text[:50]}..."


class StudentExamAttempt(models.Model):
    student = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="exam_attempts"
    )
    exam = models.ForeignKey(
        Exam, on_delete=models.CASCADE, related_name="attempts"
    )
    score = models.FloatField(default=0)
    started_at = models.DateTimeField(auto_now_add=True)
    finished_at = models.DateTimeField(null=True, blank=True)
    is_passed = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.student} → {self.exam} ({self.score}%)"


class StudentAnswer(models.Model):
    attempt = models.ForeignKey(
        StudentExamAttempt, on_delete=models.CASCADE, related_name="answers"
    )
    question = models.ForeignKey(Question, on_delete=models.CASCADE)
    selected_option = models.CharField(max_length=1)
    is_correct = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.attempt.student} answered {self.selected_option}"


class Certificate(models.Model):
    attempt = models.OneToOneField(
        StudentExamAttempt, on_delete=models.CASCADE, related_name="certificate"
    )
    student = models.ForeignKey(User, on_delete=models.CASCADE)
    exam = models.ForeignKey(Exam, on_delete=models.CASCADE)

    certificate_code = models.CharField(max_length=20, unique=True)
    verification_code = models.CharField(max_length=20, unique=True)
    image = models.ImageField(upload_to="certificates/", null=True, blank=True)
    issued_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Certificate {self.certificate_code} for {self.student}"
