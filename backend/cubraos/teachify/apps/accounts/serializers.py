from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.conf import settings

User = get_user_model()

# ==========================================
# 01. USER DATA SERIALIZER (عرض البيانات)
# ==========================================
class UserSerializer(serializers.ModelSerializer):
    """مخصص لعرض بيانات المستخدم في أي مكان في النظام"""
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'role', 'phone_number', 'avatar', 'is_verified', 'instructor_verified']
        read_only_fields = ['is_verified', 'instructor_verified']


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
        instructor_code = data.get('instructor_code', '')
        
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
        
        # Auto-verify instructors upon successful registration
        if user.role == 'instructor':
            user.instructor_verified = True
            user.save()
        
        return user


# ==========================================
# 03. LOGIN SERIALIZER (تخصيص الـ JWT)
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
        data = super().validate(attrs)
        
        # بيانات واضحة للفرونت إند (React) في الرد المباشر
        # نستخدم UserSerializer لضمان توحيد شكل البيانات
        data['user'] = UserSerializer(self.user, context=self.context).data
        return data