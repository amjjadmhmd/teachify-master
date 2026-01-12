from django.contrib.auth.models import AbstractUser
from django.db import models

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

    # 04. إعدادات تسجيل الدخول (Authentication Config)
    USERNAME_FIELD = 'email'  # الدخول بالإيميل بدلاً من الاسم
    REQUIRED_FIELDS = ['username'] # مطلوب فقط عند إنشاء الـ Superuser

    # 05. منطق العمل (Business Logic)
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

    def __str__(self):
        # يظهر بوضوح في واجهة الـ API والـ Admin: admin@teachify.com (instructor)
        return f"{self.email} ({self.role})"