from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.conf import settings
from .utilities import VerificationTokenGenerator, EmailVerificationService, LoginValidationService
from .models import EmailVerificationLog

User = get_user_model()

# ==========================================
# 01. USER DATA SERIALIZER (عرض البيانات)
# ==========================================
class UserSerializer(serializers.ModelSerializer):
    """مخصص لعرض بيانات المستخدم في أي مكان في النظام"""
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'role', 'phone_number', 'avatar', 'is_verified', 'instructor_verified', 'email_verified_at']
        read_only_fields = ['is_verified', 'instructor_verified', 'email_verified_at']


# ==========================================
# 02. REGISTER SERIALIZER (إنشاء حساب)
# ==========================================
class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    instructor_code = serializers.CharField(write_only=True, required=False, allow_blank=True)
    
    class Meta:
        model = User
        fields = ["email", "username", "password", "role", "phone_number", "avatar", "instructor_code"]
        extra_kwargs = {
            'username': {'required': False}, # اختياري لأننا نولده في الـ save() داخل الموديل
        }

    def validate(self, data):
        """
        Validate instructor verification code for instructor registrations
        """
        role = data.get('role', 'student')
        instructor_code = (data.get('instructor_code', '') or '').strip()
        data['instructor_code'] = instructor_code
        
        if role == 'instructor' and instructor_code != settings.INSTRUCTOR_VERIFICATION_CODE:
            raise serializers.ValidationError(
                "Invalid instructor verification code. Only users with the correct code can register as instructors."
            )
        
        return data

    def create(self, validated_data):
        # Remove instructor_code from validated_data before creating user
        validated_data.pop('instructor_code', None)
        
        # إنشاء المستخدم باستخدام الميثود المخصصة لضمان تشفير الباسورد
        user = User.objects.create_user(**validated_data)
        
        # Generate verification token
        token = VerificationTokenGenerator.generate_token()
        otp = VerificationTokenGenerator.generate_otp()
        
        # Save token to user
        user.verification_token = token
        user.verification_token_expires = VerificationTokenGenerator.get_expiry_time()
        user.is_verified = False  # Ensure unverified
        user.save()
        
        # Create verification log with OTP
        EmailVerificationLog.objects.create(
            user=user,
            email=user.email,
            token=token,
            otp=otp,
            expires_at=user.verification_token_expires,
        )
        
        # Send verification email
        EmailVerificationService.send_verification_email(user, token, otp)
        
        # Auto-verify instructors for instructor_verified field only
        if user.role == 'instructor':
            user.instructor_verified = True
            user.save()
        
        return user


# ==========================================
# 03. EMAIL VERIFICATION SERIALIZER
# ==========================================
class EmailVerificationSerializer(serializers.Serializer):
    """Serialize email verification - only OTP code"""
    otp = serializers.CharField(required=True, max_length=6, min_length=6)
    
    def validate_otp(self, value):
        """Validate OTP code"""
        try:
            log = EmailVerificationLog.objects.get(otp=value, verified=False)
            if log.is_expired():
                raise serializers.ValidationError("OTP has expired. Please request a new one.")
            return value
        except EmailVerificationLog.DoesNotExist:
            raise serializers.ValidationError("Invalid OTP code. Please check and try again.")


# ==========================================
# 04. RESEND VERIFICATION EMAIL SERIALIZER
# ==========================================
class ResendVerificationEmailSerializer(serializers.Serializer):
    """Request to resend verification email"""
    email = serializers.EmailField()
    
    def validate_email(self, value):
        try:
            user = User.objects.get(email=value)
            if user.is_verified:
                raise serializers.ValidationError("Email already verified")
            return value
        except User.DoesNotExist:
            raise serializers.ValidationError("User not found")


# ==========================================
# 05. LOGIN SERIALIZER (تخصيص الـ JWT)
# ==========================================
class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        # بيانات مشفرة داخل الـ Payload (لا تظهر إلا بفك التشفير)
        token['role'] = user.role
        token['email'] = user.email
        return token

    def validate(self, attrs):
        # First validate credentials
        data = super().validate(attrs)
        
        # Check if user can login
        can_login, message = LoginValidationService.check_login_eligibility(self.user)
        if not can_login:
            raise serializers.ValidationError({
                "detail": message,
                "code": "email_not_verified" if message == "Email not verified" else "account_disabled"
            })
        
        # Add user data
        data['user'] = UserSerializer(self.user, context=self.context).data
        return data
