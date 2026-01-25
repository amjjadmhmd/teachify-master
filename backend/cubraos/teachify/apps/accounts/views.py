from django.contrib.auth import get_user_model
from django.conf import settings
from django.utils import timezone
from datetime import timedelta
from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework_simplejwt.views import TokenObtainPairView

# استيراد السيريالايزر الموحد والمحدث
from .serializers import (
    RegisterSerializer, 
    CustomTokenObtainPairSerializer, 
    UserSerializer,
    EmailVerificationSerializer,
    ResendVerificationEmailSerializer
)
from .models import EmailVerificationLog
from .utilities import EmailVerificationService

User = get_user_model()

# ==========================================
# 01. AUTHENTICATION (التوثيق)
# ==========================================

class RegisterView(generics.CreateAPIView):
    """إنشاء حساب جديد لجميع الأدوار"""
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [AllowAny]
    
    def create(self, request, *args, **kwargs):
        response = super().create(request, *args, **kwargs)
        # Add custom message
        response.data['message'] = "Account created. Check your email for verification link."
        response.data['verification_required'] = True
        return response


class CustomTokenObtainPairView(TokenObtainPairView):
    """تسجيل الدخول والحصول على JWT Token"""
    serializer_class = CustomTokenObtainPairSerializer


class MeView(APIView):
    """جلب بيانات المستخدم المسجل حالياً بالكامل"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        serializer = UserSerializer(request.user, context={'request': request})
        return Response(serializer.data, status=status.HTTP_200_OK)


# ==========================================
# 02. EMAIL VERIFICATION
# ==========================================

class VerifyEmailView(APIView):
    """Verify user email with OTP code"""
    permission_classes = [AllowAny]
    
    def post(self, request):
        serializer = EmailVerificationSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(
                serializer.errors, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        otp = serializer.validated_data['otp']
        
        try:
            log = EmailVerificationLog.objects.get(otp=otp, verified=False)
            user = log.user
            
            if log.is_expired():
                return Response(
                    {"error": "OTP has expired. Please request a new one."},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Mark as verified
            log.mark_verified()
            user.mark_email_verified()
            
            return Response({
                "message": "Email verified successfully",
                "user": UserSerializer(user).data
            }, status=status.HTTP_200_OK)
            
        except EmailVerificationLog.DoesNotExist:
            return Response(
                {"error": "Invalid OTP code"},
                status=status.HTTP_400_BAD_REQUEST
            )


class ResendVerificationEmailView(APIView):
    """Resend verification email"""
    permission_classes = [AllowAny]
    
    def post(self, request):
        serializer = ResendVerificationEmailSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(
                serializer.errors,
                status=status.HTTP_400_BAD_REQUEST
            )
        
        email = serializer.validated_data['email']
        user = User.objects.get(email=email)
        
        success, message = EmailVerificationService.resend_verification_email(user)
        
        status_code = status.HTTP_200_OK if success else status.HTTP_429_TOO_MANY_REQUESTS
        return Response(
            {"message": message},
            status=status_code
        )


# ==========================================
# 03. USER MANAGEMENT (إدارة المستخدمين)
# ==========================================

class InstructorListView(generics.ListAPIView):
    """قائمة المدرسين فقط"""
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return User.objects.filter(role='instructor').order_by('-date_joined')


class StudentListView(generics.ListAPIView):
    """قائمة الطلاب فقط"""
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return User.objects.filter(role='student').order_by('-date_joined')


# ==========================================
# 04. PASSWORD RESET
# ==========================================

class ForgotPasswordView(APIView):
    """Send password reset OTP to email"""
    permission_classes = [AllowAny]
    
    def post(self, request):
        email = request.data.get('email')
        
        if not email:
            return Response(
                {"error": "Email required"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            # Security: don't reveal if user exists
            return Response(
                {"message": "If email exists, reset code sent"},
                status=status.HTTP_200_OK
            )
        
        # Generate OTP
        otp = EmailVerificationService.generate_otp()
        expires_at = timezone.now() + timedelta(hours=1)
        
        # Save OTP to database
        from .models import PasswordResetLog
        PasswordResetLog.objects.create(
            user=user,
            email=email,
            otp=otp,
            expires_at=expires_at
        )
        
        # Send email with modern template
        try:
            from django.template.loader import render_to_string
            from django.core.mail import send_mail
            
            context = {
                'user': user,
                'otp': otp,
                'expiry_hours': getattr(settings, 'PASSWORD_RESET_EXPIRY_HOURS', 1),
            }
            
            # Render HTML template
            html_message = render_to_string(
                'accounts/emails/reset_password.html',
                context
            )
            
            # Render plain text template
            text_message = render_to_string(
                'accounts/emails/reset_password.txt',
                context
            )
            
            send_mail(
                subject="Your Password Reset Code - Teachify",
                message=text_message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[email],
                html_message=html_message,
                fail_silently=False,
            )
        except Exception as e:
            print(f"Error sending password reset email: {str(e)}")
            return Response(
                {"error": "Failed to send email"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        
        return Response(
            {"message": "Reset code sent to email"},
            status=status.HTTP_200_OK
        )


class ResetPasswordView(APIView):
    """Verify OTP and reset password"""
    permission_classes = [AllowAny]
    
    def post(self, request):
        otp = request.data.get('otp')
        new_password = request.data.get('new_password')
        confirm_password = request.data.get('confirm_password')
        
        # Validate
        if not all([otp, new_password, confirm_password]):
            return Response(
                {"error": "All fields required"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if new_password != confirm_password:
            return Response(
                {"error": "Passwords do not match"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if len(new_password) < 6:
            return Response(
                {"error": "Password must be at least 6 characters"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Find OTP
        from .models import PasswordResetLog
        try:
            reset_log = PasswordResetLog.objects.get(otp=otp, used=False)
        except PasswordResetLog.DoesNotExist:
            return Response(
                {"error": "Invalid OTP"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check if expired
        if reset_log.is_expired():
            return Response(
                {"error": "OTP expired"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Reset password
        user = reset_log.user
        user.set_password(new_password)
        user.save()
        
        # Mark OTP as used
        reset_log.used = True
        reset_log.used_at = timezone.now()
        reset_log.save()
        
        return Response(
            {"message": "Password reset successfully"},
            status=status.HTTP_200_OK
        )