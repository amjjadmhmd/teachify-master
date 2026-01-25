"""
Email Verification Utilities
Handles token generation, email sending, and verification logic
"""

import secrets
import string
from django.utils import timezone
from datetime import timedelta
from django.conf import settings
from django.core.mail import send_mail
from django.template.loader import render_to_string


class VerificationTokenGenerator:
    """Generate secure verification tokens"""
    
    @staticmethod
    def generate_token(length=32):
        """Generate cryptographically secure token"""
        alphabet = string.ascii_letters + string.digits
        return ''.join(secrets.choice(alphabet) for _ in range(length))
    
    @staticmethod
    def generate_otp(length=6):
        """Generate 6-digit OTP"""
        return ''.join(secrets.choice(string.digits) for _ in range(length))
    
    @staticmethod
    def get_expiry_time(hours=None):
        """Get token expiry time"""
        hours = hours or getattr(settings, 'EMAIL_VERIFICATION_EXPIRY_HOURS', 24)
        return timezone.now() + timedelta(hours=hours)


class EmailVerificationService:
    """Handle email verification logic"""
    
    @staticmethod
    def send_verification_email(user, token, otp=None):
        """Send verification email to user"""
        try:
            subject = "Verify Your Teachify Email"
            context = {
                'user': user,
                'token': token,
                'otp': otp,
                'verification_url': f"{settings.FRONTEND_URL}/verify-email?token={token}",
                'expiry_hours': getattr(settings, 'EMAIL_VERIFICATION_EXPIRY_HOURS', 24),
            }
            
            # Try to render HTML template
            try:
                html_message = render_to_string(
                    'accounts/emails/verify_email.html', 
                    context
                )
            except:
                # Fallback to plain text if template not found
                html_message = f"""
                <h2>Verify Your Email</h2>
                <p>Hi {user.email},</p>
                <p>Your verification code is: <strong>{otp}</strong></p>
                <p>Or use this link: <a href="{context['verification_url']}">Verify Email</a></p>
                <p>This code expires in {context['expiry_hours']} hours.</p>
                """
            
            # Send email
            send_mail(
                subject=subject,
                message=f"Use this code to verify: {otp or token}",
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[user.email],
                html_message=html_message,
                fail_silently=False,
            )
            return True
        except Exception as e:
            print(f"Error sending verification email: {str(e)}")
            return False
    
    @staticmethod
    def verify_email(user, token):
        """Verify user email with token"""
        from .models import EmailVerificationLog
        
        # Find verification log
        log = EmailVerificationLog.objects.filter(
            token=token,
            user=user,
            verified=False
        ).first()
        
        if not log:
            return False, "Invalid verification token"
        
        if log.is_expired():
            return False, "Verification token has expired"
        
        # Mark as verified
        log.mark_verified()
        user.mark_email_verified()
        
        return True, "Email verified successfully"
    
    @staticmethod
    def resend_verification_email(user):
        """Resend verification email"""
        from .models import EmailVerificationLog
        
        # Check rate limit (max 3 per hour)
        recent_logs = EmailVerificationLog.objects.filter(
            user=user,
            created_at__gte=timezone.now() - timedelta(hours=1)
        ).count()
        
        max_resends = getattr(settings, 'VERIFICATION_EMAIL_RATE_LIMIT', 3)
        if recent_logs >= max_resends:
            return False, f"Too many requests. Try again in 1 hour."
        
        # Generate new token
        token = VerificationTokenGenerator.generate_token()
        otp = VerificationTokenGenerator.generate_otp()
        
        # Create verification log with OTP
        EmailVerificationLog.objects.create(
            user=user,
            email=user.email,
            token=token,
            otp=otp,
            expires_at=VerificationTokenGenerator.get_expiry_time(),
        )
        
        # Send email
        success = EmailVerificationService.send_verification_email(user, token, otp)
        
        if success:
            return True, "Verification email sent"
        else:
            return False, "Failed to send verification email"


class LoginValidationService:
    """Validate login conditions"""
    
    @staticmethod
    def is_email_verified(user):
        """Check if user's email is verified"""
        return user.is_verified
    
    @staticmethod
    def check_login_eligibility(user):
        """Check if user can login"""
        if not user.is_active:
            return False, "Account is disabled"
        
        # Allow admin/staff to login without email verification
        if user.is_staff or user.is_superuser:
            return True, "OK"
        
        # Require email verification for students and instructors
        if not LoginValidationService.is_email_verified(user):
            return False, "Email not verified"
        
        return True, "OK"
