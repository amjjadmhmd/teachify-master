"""
Signal handlers for automated email notifications
"""
from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from django.core.exceptions import ObjectDoesNotExist
from apps.accounts.models import User
from apps.courses.models import (
    Enrollment,
    PaymentRequest,
    TaskSubmission,
)
from apps.exams.models import StudentExamAttempt
from .email_service import (
    WelcomeEmailService,
    PaymentEmailService,
    ExamEmailService,
    TaskEmailService,
    EnrollmentEmailService,
)
import logging

logger = logging.getLogger(__name__)


# ============================================================
# USER REGISTRATION - WELCOME EMAIL
# ============================================================
@receiver(post_save, sender=User)
def send_welcome_email_on_register(sender, instance, created, **kwargs):
    """Send welcome email when new user registers"""
    if created and instance.email:
        try:
            # Don't send to superusers/staff created from admin
            if not instance.is_staff and not instance.is_superuser:
                WelcomeEmailService.send_welcome_email(instance)
                logger.info(f"✓ Welcome email sent to {instance.email}")
        except Exception as e:
            logger.error(f"✗ Failed to send welcome email: {str(e)}")


# ============================================================
# PAYMENT REQUEST - STUDENT & INSTRUCTOR NOTIFICATIONS
# ============================================================
@receiver(post_save, sender=PaymentRequest)
def send_payment_notifications(sender, instance, created, **kwargs):
    """Send payment notifications to student and instructor"""
    try:
        if created:
            # Send confirmation to student
            PaymentEmailService.send_payment_confirmation(instance)
            logger.info(f"✓ Payment confirmation email sent to {instance.student.email}")
            
            # Notify instructors
            PaymentEmailService.send_payment_notification_to_instructor(instance)
            logger.info(f"✓ Payment notification sent to instructors")
        
        else:
            # Handle status changes
            if instance.status == 'approved' and instance.processed_at:
                PaymentEmailService.send_payment_approved(instance)
                logger.info(f"✓ Payment approved email sent to {instance.student.email}")
            
            elif instance.status == 'rejected' and instance.rejection_reason:
                PaymentEmailService.send_payment_rejected(instance)
                logger.info(f"✓ Payment rejected email sent to {instance.student.email}")
    
    except Exception as e:
        logger.error(f"✗ Payment notification error: {str(e)}")


# ============================================================
# EXAM SUBMISSION - RESULTS EMAIL
# ============================================================
@receiver(post_save, sender=StudentExamAttempt)
def send_exam_results_email(sender, instance, created, **kwargs):
    """Send exam results email when exam is finished"""
    try:
        # Send email only when exam is finished (finished_at is set)
        if instance.finished_at and not created:
            ExamEmailService.send_exam_results(instance)
            logger.info(f"✓ Exam results email sent to {instance.student.email}")
    except Exception as e:
        logger.error(f"✗ Exam results email error: {str(e)}")


# ============================================================
# TASK GRADING - STUDENT NOTIFICATION
# ============================================================
@receiver(post_save, sender=TaskSubmission)
def send_task_grading_email(sender, instance, created, **kwargs):
    """Send notification when task is graded"""
    try:
        # Send email when task is graded (status changed to 'graded')
        if instance.status == 'graded' and instance.graded_at and not created:
            TaskEmailService.send_task_graded_notification(instance)
            logger.info(f"✓ Task grading email sent to {instance.student.email}")
    except Exception as e:
        logger.error(f"✗ Task grading email error: {str(e)}")


# ============================================================
# ENROLLMENT - CONFIRMATION EMAIL
# ============================================================
@receiver(post_save, sender=Enrollment)
def send_enrollment_confirmation_email(sender, instance, created, **kwargs):
    """Send enrollment confirmation email"""
    try:
        if created:
            EnrollmentEmailService.send_enrollment_confirmation(instance)
            logger.info(f"✓ Enrollment confirmation email sent to {instance.student.email}")
    except Exception as e:
        logger.error(f"✗ Enrollment confirmation email error: {str(e)}")
