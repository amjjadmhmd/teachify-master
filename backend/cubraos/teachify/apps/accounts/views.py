from django.contrib.auth import get_user_model
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