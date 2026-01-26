"""
Management command to test email sending
Usage: python manage.py test_emails --email=test@example.com
"""
from django.core.management.base import BaseCommand, CommandError
from apps.common.email_service import (
    WelcomeEmailService,
    PaymentEmailService,
    ExamEmailService,
    TaskEmailService,
    EnrollmentEmailService,
)
from apps.accounts.models import User


class Command(BaseCommand):
    help = 'Test email sending functionality'

    def add_arguments(self, parser):
        parser.add_argument(
            '--email',
            type=str,
            help='Recipient email address',
            required=True,
        )
        parser.add_argument(
            '--type',
            type=str,
            default='welcome',
            help='Email type: welcome, payment_confirmation, exam_results, etc.',
        )

    def handle(self, *args, **options):
        email = options['email']
        email_type = options['type']
        
        try:
            # Get test user
            user = User.objects.filter(email=email).first()
            
            if not user:
                self.stdout.write(
                    self.style.WARNING(f'User with email {email} not found. Creating test user...')
                )
                user = User.objects.create_user(
                    email=email,
                    username=email.split('@')[0],
                    first_name='Test',
                    last_name='User',
                    password='testpass123'
                )
                self.stdout.write(self.style.SUCCESS(f'Created test user: {email}'))
            
            # Send appropriate email
            if email_type == 'welcome':
                result = WelcomeEmailService.send_welcome_email(user)
                email_name = 'Welcome Email'
            
            elif email_type == 'payment_confirmation':
                # This requires a PaymentRequest object
                self.stdout.write(self.style.ERROR(
                    'Payment confirmation email requires a PaymentRequest object. '
                    'Use the API or admin to test.'
                ))
                return
            
            elif email_type == 'exam_results':
                self.stdout.write(self.style.ERROR(
                    'Exam results email requires a StudentExamAttempt object. '
                    'Use the API or admin to test.'
                ))
                return
            
            elif email_type == 'task_graded':
                self.stdout.write(self.style.ERROR(
                    'Task graded email requires a TaskSubmission object. '
                    'Use the API or admin to test.'
                ))
                return
            
            elif email_type == 'enrollment':
                self.stdout.write(self.style.ERROR(
                    'Enrollment email requires an Enrollment object. '
                    'Use the API or admin to test.'
                ))
                return
            
            else:
                raise CommandError(f'Unknown email type: {email_type}')
            
            if result:
                self.stdout.write(
                    self.style.SUCCESS(f'✓ {email_name} sent successfully to {email}')
                )
            else:
                self.stdout.write(
                    self.style.ERROR(f'✗ Failed to send {email_name} to {email}')
                )
        
        except Exception as e:
            raise CommandError(f'Error: {str(e)}')
