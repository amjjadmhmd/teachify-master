from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils import timezone
from datetime import timedelta

class User(AbstractUser):
    # 01. خيارات الأدوار (Roles)
    ROLE_CHOICES = (
        ("student", "Student"),
        ("instructor", "Instructor"),
        ("admin", "Admin"),
    )

    # 02. الحقول الأساسية (Core Fields)
    # جعل الإيميل هو المفتاح الفريد والأساسي للدخول
    email = models.EmailField(unique=True, verbose_name="Email Address")
    
    # الـ username اختياري (null=True) ولكننا سنقوم بتوليده تلقائياً إذا لزم الأمر
    username = models.CharField(max_length=150, unique=True, null=True, blank=True)
    
    # الدور الافتراضي هو طالب
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default="student")
    
    # 03. الحقول الإضافية (Profile Info)
    phone_number = models.CharField(max_length=15, blank=True, null=True)
    avatar = models.ImageField(upload_to="avatars/%Y/%m/", null=True, blank=True)
    is_verified = models.BooleanField(default=False)
    
    # 04. Instructor Verification
    instructor_verified = models.BooleanField(default=False)
    
    # 05. Email Verification Fields
    email_verified_at = models.DateTimeField(
        null=True, 
        blank=True, 
        verbose_name="Email Verified At"
    )
    verification_token = models.CharField(
        max_length=255, 
        null=True, 
        blank=True,
        db_index=True,
        verbose_name="Verification Token"
    )
    verification_token_expires = models.DateTimeField(
        null=True, 
        blank=True,
        verbose_name="Token Expires At"
    )
    verification_attempts = models.IntegerField(
        default=0,
        verbose_name="Verification Attempts"
    )

    # 06. إعدادات تسجيل الدخول (Authentication Config)
    USERNAME_FIELD = 'email'  # الدخول بالإيميل بدلاً من الاسم
    REQUIRED_FIELDS = ['username'] # مطلوب فقط عند إنشاء الـ Superuser

    # 07. منطق العمل (Business Logic)
    def save(self, *args, **kwargs):
        """
        تعديل أوتوماتيكي: إذا تم منح المستخدم صلاحية Staff أو Superuser،
        يتم تحويل دوره فوراً إلى Instructor لضمان حصوله على صلاحيات التدريس.
        """
        if self.is_superuser or self.is_staff:
            self.role = 'instructor'
        
        # توليد username بسيط من الإيميل إذا كان فارغاً
        if not self.username:
            self.username = self.email.split('@')[0]
            
        super().save(*args, **kwargs)

    def is_verification_token_valid(self):
        """Check if verification token is still valid"""
        if not self.verification_token or not self.verification_token_expires:
            return False
        return timezone.now() < self.verification_token_expires
    
    def mark_email_verified(self):
        """Mark email as verified"""
        self.is_verified = True
        self.email_verified_at = timezone.now()
        self.verification_token = None
        self.verification_token_expires = None
        self.verification_attempts = 0
        self.save()

    def __str__(self):
        # يظهر بوضوح في واجهة الـ API والـ Admin: admin@teachify.com (instructor)
        return f"{self.email} ({self.role})"


class EmailVerificationLog(models.Model):
    """Track email verification attempts"""
    user = models.ForeignKey(
        User, 
        on_delete=models.CASCADE,
        related_name='verification_logs'
    )
    email = models.EmailField()
    token = models.CharField(max_length=255, db_index=True)
    otp = models.CharField(max_length=6, db_index=True, null=True, blank=True)  # Store OTP for easy lookup
    verified = models.BooleanField(default=False)
    attempt_count = models.IntegerField(default=0)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    verified_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['token']),
            models.Index(fields=['user', 'verified']),
        ]
    
    def __str__(self):
        status = 'Verified' if self.verified else 'Pending'
        return f"{self.user.email} - {status}"
    
    def is_expired(self):
        """Check if verification token expired"""
        return timezone.now() > self.expires_at
    
    def mark_verified(self):
        """Mark this verification as successful"""
        self.verified = True
        self.verified_at = timezone.now()
        self.save()