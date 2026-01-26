"""
Email Service - Handles all email notifications
"""
from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string
from django.conf import settings
from django.utils.html import strip_tags
from django.utils import timezone
import logging

logger = logging.getLogger(__name__)


class EmailService:
    """
    Centralized email service for sending templated emails
    """
    
    @staticmethod
    def send_email(
        subject: str,
        to_email: str,
        template_name: str,
        context: dict,
        tags: list = None,
    ) -> bool:
        """
        Send email using Django templates
        
        Args:
            subject: Email subject
            to_email: Recipient email
            template_name: Path to template (relative to templates/emails/)
            context: Template context dictionary
            tags: Email tags for tracking (list)
        
        Returns:
            bool: True if sent successfully
        """
        try:
            # Add default context
            default_context = {
                'site_name': 'Teachify',
                'site_url': settings.FRONTEND_URL,
                'current_year': timezone.now().year,
                'support_email': settings.DEFAULT_FROM_EMAIL,
            }
            default_context.update(context)
            
            # Render template
            html_message = render_to_string(
                f'emails/{template_name}.html',
                default_context
            )
            plain_message = strip_tags(html_message)
            
            # Create email
            email = EmailMultiAlternatives(
                subject=subject,
                body=plain_message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                to=[to_email],
            )
            email.attach_alternative(html_message, "text/html")
            
            # Send
            result = email.send(fail_silently=False)
            logger.info(f"✓ Email sent to {to_email}: {subject}")
            return result > 0
            
        except Exception as e:
            logger.error(f"✗ Failed to send email to {to_email}: {str(e)}")
            return False


class WelcomeEmailService(EmailService):
    """Send welcome email to new users"""
    
    @staticmethod
    def send_welcome_email(user) -> bool:
        """
        Send welcome email after user registration
        
        Args:
            user: User object
        
        Returns:
            bool: Success status
        """
        context = {
            'user_name': user.first_name or user.email.split('@')[0],
            'user_email': user.email,
            'role': user.get_role_display(),
            'verification_required': settings.EMAIL_VERIFICATION_REQUIRED,
        }
        
        return EmailService.send_email(
            subject='🎓 Welcome to Teachify - Your Learning Journey Starts Now!',
            to_email=user.email,
            template_name='welcome',
            context=context,
        )


class EmailVerificationService(EmailService):
    """Send email verification links/codes"""
    
    @staticmethod
    def send_verification_email(verification_log) -> bool:
        """
        Send email verification link/OTP
        
        Args:
            verification_log: EmailVerificationLog object
        
        Returns:
            bool: Success status
        """
        user = verification_log.user
        
        # Generate verification link
        verify_url = f"{settings.FRONTEND_URL}/verify-email?token={verification_log.token}"
        
        context = {
            'user_name': user.first_name or user.email.split('@')[0],
            'user_email': user.email,
            'verification_token': verification_log.token,
            'otp': verification_log.otp,
            'verify_url': verify_url,
            'expiry_hours': settings.EMAIL_VERIFICATION_EXPIRY_HOURS,
            'expires_at': verification_log.expires_at.strftime('%Y-%m-%d %H:%M:%S'),
        }
        
        return EmailService.send_email(
            subject='📧 Verify Your Email Address - Teachify',
            to_email=user.email,
            template_name='verify_email',
            context=context,
        )


class PasswordResetService(EmailService):
    """Send password reset emails"""
    
    @staticmethod
    def send_password_reset_email(password_reset_log) -> bool:
        """
        Send password reset OTP/link
        
        Args:
            password_reset_log: PasswordResetLog object
        
        Returns:
            bool: Success status
        """
        user = password_reset_log.user
        reset_url = f"{settings.FRONTEND_URL}/reset-password?otp={password_reset_log.otp}&email={user.email}"
        
        context = {
            'user_name': user.first_name or user.email.split('@')[0],
            'user_email': user.email,
            'otp': password_reset_log.otp,
            'reset_url': reset_url,
            'expiry_minutes': settings.OTP_EXPIRY_MINUTES,
            'expires_at': password_reset_log.expires_at.strftime('%Y-%m-%d %H:%M:%S'),
        }
        
        return EmailService.send_email(
            subject='🔐 Password Reset Request - Teachify',
            to_email=user.email,
            template_name='password_reset',
            context=context,
        )


class PaymentEmailService(EmailService):
    """Send payment-related emails"""
    
    @staticmethod
    def send_payment_confirmation(payment_request) -> bool:
        """
        Send payment confirmation email to student
        
        Args:
            payment_request: PaymentRequest object
        
        Returns:
            bool: Success status
        """
        user = payment_request.student
        courses_list = payment_request.courses.all().values_list('title', flat=True)
        
        context = {
            'user_name': user.first_name or user.email.split('@')[0],
            'user_email': user.email,
            'payment_request_id': payment_request.id,
            'courses': list(courses_list),
            'course_count': courses_list.count(),
            'total_amount': payment_request.total_amount,
            'currency': 'USD',
            'status': payment_request.status,
            'submitted_at': payment_request.submitted_at.strftime('%Y-%m-%d %H:%M:%S'),
        }
        
        return EmailService.send_email(
            subject=f'💳 Payment Submitted Successfully - Teachify (#{payment_request.id})',
            to_email=user.email,
            template_name='payment_confirmation',
            context=context,
        )
    
    @staticmethod
    def send_payment_approved(payment_request) -> bool:
        """
        Send payment approval email to student + enroll them
        
        Args:
            payment_request: PaymentRequest object
        
        Returns:
            bool: Success status
        """
        from apps.courses.models import Enrollment
        
        user = payment_request.student
        courses_list = payment_request.courses.all()
        
        # Auto-enroll student in approved courses
        for course in courses_list:
            Enrollment.objects.get_or_create(student=user, course=course)
        
        context = {
            'user_name': user.first_name or user.email.split('@')[0],
            'user_email': user.email,
            'courses': [{'title': c.title, 'id': c.id} for c in courses_list],
            'course_count': courses_list.count(),
            'total_amount': payment_request.total_amount,
            'processed_at': payment_request.processed_at.strftime('%Y-%m-%d %H:%M:%S'),
            'dashboard_url': f"{settings.FRONTEND_URL}/dashboard",
        }
        
        return EmailService.send_email(
            subject='✅ Payment Approved! Your Courses are Ready - Teachify',
            to_email=user.email,
            template_name='payment_approved',
            context=context,
        )
    
    @staticmethod
    def send_payment_rejected(payment_request) -> bool:
        """
        Send payment rejection email to student
        
        Args:
            payment_request: PaymentRequest object
        
        Returns:
            bool: Success status
        """
        user = payment_request.student
        courses_list = payment_request.courses.all().values_list('title', flat=True)
        
        context = {
            'user_name': user.first_name or user.email.split('@')[0],
            'user_email': user.email,
            'payment_request_id': payment_request.id,
            'courses': list(courses_list),
            'course_count': courses_list.count(),
            'total_amount': payment_request.total_amount,
            'rejection_reason': payment_request.rejection_reason or 'Not specified',
            'support_email': settings.DEFAULT_FROM_EMAIL,
        }
        
        return EmailService.send_email(
            subject='❌ Payment Request Rejected - Teachify',
            to_email=user.email,
            template_name='payment_rejected',
            context=context,
        )
    
    @staticmethod
    def send_payment_notification_to_instructor(payment_request) -> bool:
        """
        Notify instructor of new payment request
        
        Args:
            payment_request: PaymentRequest object
        
        Returns:
            bool: Success status
        """
        instructors = payment_request.courses.values_list(
            'instructor',
            flat=True
        ).distinct()
        
        from apps.accounts.models import User
        
        success = True
        for instructor_id in instructors:
            instructor = User.objects.get(id=instructor_id)
            courses = payment_request.courses.filter(instructor=instructor)
            
            context = {
                'instructor_name': instructor.first_name or instructor.email.split('@')[0],
                'instructor_email': instructor.email,
                'student_name': payment_request.student.first_name or payment_request.student.email,
                'student_email': payment_request.student.email,
                'courses': [c.title for c in courses],
                'course_count': courses.count(),
                'total_amount': payment_request.total_amount,
                'payment_request_id': payment_request.id,
                'admin_url': f"{settings.FRONTEND_URL}/instructor/dashboard",
            }
            
            result = EmailService.send_email(
                subject=f'💰 New Payment Request Awaiting Review - Teachify (#{payment_request.id})',
                to_email=instructor.email,
                template_name='payment_instructor_notification',
                context=context,
            )
            success = success and result
        
        return success


class ExamEmailService(EmailService):
    """Send exam-related emails"""
    
    @staticmethod
    def send_exam_results(exam_attempt) -> bool:
        """
        Send exam results email to student
        
        Args:
            exam_attempt: StudentExamAttempt object
        
        Returns:
            bool: Success status
        """
        user = exam_attempt.student
        exam = exam_attempt.exam
        
        # Calculate percentage
        percentage = (exam_attempt.score / exam.total_marks * 100) if exam.total_marks > 0 else 0
        passed = percentage >= 60  # Assuming 60% is passing
        
        context = {
            'user_name': user.first_name or user.email.split('@')[0],
            'user_email': user.email,
            'exam_title': exam.title,
            'exam_description': exam.description,
            'course_title': exam.course.title,
            'score': exam_attempt.score,
            'total_marks': exam.total_marks,
            'percentage': round(percentage, 2),
            'passed': passed,
            'status': 'PASSED ✅' if passed else 'NEEDS IMPROVEMENT 📚',
            'finished_at': exam_attempt.finished_at.strftime('%Y-%m-%d %H:%M:%S') if exam_attempt.finished_at else 'Not finished',
            'dashboard_url': f"{settings.FRONTEND_URL}/dashboard",
        }
        
        return EmailService.send_email(
            subject=f'📊 Your Exam Results - {exam.title} - Teachify',
            to_email=user.email,
            template_name='exam_results',
            context=context,
        )


class TaskEmailService(EmailService):
    """Send task-related emails"""
    
    @staticmethod
    def send_task_graded_notification(task_submission) -> bool:
        """
        Send notification when task is graded
        
        Args:
            task_submission: TaskSubmission object
        
        Returns:
            bool: Success status
        """
        user = task_submission.student
        task = task_submission.task
        
        context = {
            'user_name': user.first_name or user.email.split('@')[0],
            'user_email': user.email,
            'task_title': task.title,
            'course_title': task.course.title,
            'score': task_submission.score,
            'feedback': task_submission.feedback or 'No feedback provided',
            'graded_at': task_submission.graded_at.strftime('%Y-%m-%d %H:%M:%S') if task_submission.graded_at else 'Unknown',
            'dashboard_url': f"{settings.FRONTEND_URL}/dashboard",
        }
        
        return EmailService.send_email(
            subject=f'📝 Your Task Has Been Graded - {task.title} - Teachify',
            to_email=user.email,
            template_name='task_graded',
            context=context,
        )


class EnrollmentEmailService(EmailService):
    """Send enrollment-related emails"""
    
    @staticmethod
    def send_enrollment_confirmation(enrollment) -> bool:
        """
        Send enrollment confirmation
        
        Args:
            enrollment: Enrollment object
        
        Returns:
            bool: Success status
        """
        user = enrollment.student
        course = enrollment.course
        
        context = {
            'user_name': user.first_name or user.email.split('@')[0],
            'user_email': user.email,
            'course_title': course.title,
            'course_description': course.description[:200],
            'instructor_name': course.instructor.first_name or course.instructor.email,
            'total_duration': course.total_duration_minutes,
            'enrolled_at': enrollment.enrolled_at.strftime('%Y-%m-%d %H:%M:%S'),
            'course_url': f"{settings.FRONTEND_URL}/course/{course.id}",
        }
        
        return EmailService.send_email(
            subject=f'🎓 Welcome to {course.title} - Teachify',
            to_email=user.email,
            template_name='enrollment_confirmation',
            context=context,
        )
