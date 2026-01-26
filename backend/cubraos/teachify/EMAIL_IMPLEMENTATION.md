# Email Notifications Implementation Guide

## Overview
This document describes the email notification system implemented in Teachify. The system uses Django signals to automatically send templated emails to users based on various platform events.

---

## ✅ Implemented Features

### 1. **Welcome Email** (On User Registration)
- **Trigger:** New user registration
- **Recipients:** New users (both students and instructors)
- **File:** `templates/emails/welcome.html`
- **Service:** `WelcomeEmailService.send_welcome_email()`

### 2. **Payment Confirmation Email**
- **Trigger:** Student submits payment proof
- **Recipients:** Student
- **File:** `templates/emails/payment_confirmation.html`
- **Service:** `PaymentEmailService.send_payment_confirmation()`
- **Info:** Confirms payment submission and provides timeline for review

### 3. **Payment Approved Email**
- **Trigger:** Instructor approves payment request
- **Recipients:** Student
- **File:** `templates/emails/payment_approved.html`
- **Service:** `PaymentEmailService.send_payment_approved()`
- **Info:** Auto-enrolls student and provides course access instructions

### 4. **Payment Rejected Email**
- **Trigger:** Instructor rejects payment request
- **Recipients:** Student
- **File:** `templates/emails/payment_rejected.html`
- **Service:** `PaymentEmailService.send_payment_rejected()`
- **Info:** Explains rejection reason and resubmission steps

### 5. **Payment Instructor Notification**
- **Trigger:** Student submits new payment request
- **Recipients:** Relevant instructors
- **File:** `templates/emails/payment_instructor_notification.html`
- **Service:** `PaymentEmailService.send_payment_notification_to_instructor()`
- **Info:** Alerts instructors to review and approve/reject payment

### 6. **Exam Results Email**
- **Trigger:** Student finishes an exam
- **Recipients:** Student
- **File:** `templates/emails/exam_results.html`
- **Service:** `ExamEmailService.send_exam_results()`
- **Info:** Shows score, percentage, pass/fail status, and next steps

### 7. **Task Graded Email**
- **Trigger:** Instructor grades a task submission
- **Recipients:** Student
- **File:** `templates/emails/task_graded.html`
- **Service:** `TaskEmailService.send_task_graded_notification()`
- **Info:** Provides score and instructor feedback

### 8. **Enrollment Confirmation Email**
- **Trigger:** Student is enrolled in a course
- **Recipients:** Student
- **File:** `templates/emails/enrollment_confirmation.html`
- **Service:** `EnrollmentEmailService.send_enrollment_confirmation()`
- **Info:** Welcomes student to course with getting started tips

---

## 📁 File Structure

```
backend/cubraos/teachify/
├── apps/common/
│   ├── email_service.py          # Email service classes
│   ├── signals.py                 # Signal handlers for automation
│   ├── apps.py                    # (UPDATED) Register signals
│   └── management/
│       └── commands/
│           └── test_emails.py     # CLI command for testing
│
├── templates/
│   └── emails/
│       ├── base.html              # Base template with styling
│       ├── welcome.html           # Welcome email
│       ├── payment_confirmation.html
│       ├── payment_approved.html
│       ├── payment_rejected.html
│       ├── payment_instructor_notification.html
│       ├── exam_results.html
│       ├── task_graded.html
│       └── enrollment_confirmation.html
│
└── EMAIL_IMPLEMENTATION.md        # This file
```

---

## 🔧 Configuration

### Environment Variables (Already Set)
```bash
# .env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password
EMAIL_USE_TLS=True
DEFAULT_FROM_EMAIL=your-email@gmail.com
FRONTEND_URL=http://localhost:3000
```

### Django Settings (Already Configured)
```python
# settings.py - Email configuration
EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = config('EMAIL_HOST', default='smtp.gmail.com')
EMAIL_PORT = config('EMAIL_PORT', default=587, cast=int)
EMAIL_HOST_USER = config('EMAIL_HOST_USER')
EMAIL_HOST_PASSWORD = config('EMAIL_HOST_PASSWORD')
EMAIL_USE_TLS = config('EMAIL_USE_TLS', default=True, cast=bool)
DEFAULT_FROM_EMAIL = config('DEFAULT_FROM_EMAIL')
FRONTEND_URL = config('FRONTEND_URL')
```

---

## 🚀 How It Works

### Signal Flow
```
Event Occurs
    ↓
Django Signal Emitted
    ↓
Signal Handler Triggered (signals.py)
    ↓
Email Service Method Called
    ↓
Template Rendered with Context
    ↓
Email Sent via SMTP
```

### Example: Payment Approval Flow
```python
# 1. Instructor approves payment in PaymentRequest model
payment.status = 'approved'
payment.save()

# 2. Signal handler is triggered (post_save signal)
# apps/common/signals.py::send_payment_notifications()

# 3. Service method is called
PaymentEmailService.send_payment_approved(payment_request)

# 4. Template is rendered
# templates/emails/payment_approved.html

# 5. Email is sent to student
# Student receives: "✅ Payment Approved! Your Courses Are Ready"
```

---

## 📧 Email Classes & Methods

### EmailService (Base Class)
```python
EmailService.send_email(
    subject: str,          # Email subject
    to_email: str,         # Recipient email
    template_name: str,    # Template name (without .html)
    context: dict,         # Template variables
    tags: list = None      # Tracking tags (optional)
) → bool
```

### WelcomeEmailService
```python
WelcomeEmailService.send_welcome_email(user) → bool
```

### PaymentEmailService
```python
PaymentEmailService.send_payment_confirmation(payment_request) → bool
PaymentEmailService.send_payment_approved(payment_request) → bool
PaymentEmailService.send_payment_rejected(payment_request) → bool
PaymentEmailService.send_payment_notification_to_instructor(payment_request) → bool
```

### ExamEmailService
```python
ExamEmailService.send_exam_results(exam_attempt) → bool
```

### TaskEmailService
```python
TaskEmailService.send_task_graded_notification(task_submission) → bool
```

### EnrollmentEmailService
```python
EnrollmentEmailService.send_enrollment_confirmation(enrollment) → bool
```

---

## 🧪 Testing Emails

### Option 1: Management Command
```bash
# Test welcome email
python manage.py test_emails --email=test@example.com --type=welcome

# List available types
python manage.py test_emails --help
```

### Option 2: Django Admin
1. Create a new user manually
2. Save → Welcome email is sent automatically
3. Create PaymentRequest, ExamAttempt, etc. in admin
4. Modify status fields → Emails trigger automatically

### Option 3: API Endpoints
```bash
# Register new user
POST /api/accounts/register/
{
    "email": "student@example.com",
    "password": "secure123",
    "first_name": "John",
    "role": "student"
}
# ✓ Welcome email sent automatically

# Submit payment (triggers confirmation)
POST /api/courses/payment-requests/
{
    "courses": [1, 2, 3],
    "total_amount": 99.99,
    "payment_proof_image": <file>
}
# ✓ Payment confirmation email sent to student
# ✓ Payment notification email sent to instructors
```

### Option 4: Python Shell
```python
from apps.accounts.models import User
from apps.common.email_service import WelcomeEmailService

user = User.objects.first()
WelcomeEmailService.send_welcome_email(user)
```

---

## 📝 Email Template Variables

### Universal Context (All Emails)
```python
{
    'site_name': 'Teachify',
    'site_url': 'http://localhost:3000',
    'current_year': 2024,
    'support_email': 'support@teachify.com'
}
```

### Welcome Email
```python
{
    'user_name': 'John',
    'user_email': 'john@example.com',
    'role': 'Student',
    'verification_required': True
}
```

### Payment Confirmation Email
```python
{
    'user_name': 'John',
    'payment_request_id': 42,
    'courses': ['Python 101', 'Web Development'],
    'course_count': 2,
    'total_amount': 99.99,
    'submitted_at': '2024-01-15 10:30:00',
    'status': 'pending'
}
```

### Exam Results Email
```python
{
    'user_name': 'John',
    'exam_title': 'Python Basics Final Exam',
    'course_title': 'Python 101',
    'score': 85,
    'total_marks': 100,
    'percentage': 85.0,
    'passed': True,
    'status': 'PASSED ✅',
    'finished_at': '2024-01-15 10:30:00'
}
```

---

## 🔐 Security Considerations

### Best Practices Implemented
1. **From Address:** Uses `DEFAULT_FROM_EMAIL` from settings
2. **Template Escaping:** Django templates auto-escape user input
3. **SMTP Security:** Uses TLS/SSL encryption
4. **Credentials:** Stored in `.env` file (not in code)
5. **Error Logging:** All failures are logged for debugging

### Additional Recommendations
1. **Rate Limiting:** Implement rate limiting for email sending
2. **Unsubscribe Links:** Add unsubscribe links to emails
3. **Email Verification:** Already implemented in auth system
4. **Bounce Handling:** Monitor and handle hard bounces
5. **SPF/DKIM:** Configure DNS records for authentication

---

## 🐛 Troubleshooting

### Email Not Sending?

#### 1. Check Email Configuration
```python
# Django shell
from django.core.mail import send_mail
send_mail(
    'Test',
    'This is a test.',
    'from@example.com',
    ['to@example.com'],
    fail_silently=False,
)
```

#### 2. Check Logs
```bash
# Look for email errors in console/logs
tail -f logs/django.log | grep -i email
```

#### 3. Verify Gmail App Password
- Gmail requires "App Passwords" for third-party apps
- Generate one at: https://myaccount.google.com/apppasswords
- Use it instead of your regular password

#### 4. Check SMTP Connection
```python
from django.conf import settings
import smtplib

try:
    server = smtplib.SMTP(settings.EMAIL_HOST, settings.EMAIL_PORT)
    server.starttls()
    server.login(settings.EMAIL_HOST_USER, settings.EMAIL_HOST_PASSWORD)
    print("✓ SMTP connection successful")
    server.quit()
except Exception as e:
    print(f"✗ SMTP error: {e}")
```

### Signal Not Triggering?

#### 1. Verify Signal Registration
```python
# Check that signals.py is imported in apps.py ready()
# apps/common/apps.py should have:
def ready(self):
    import apps.common.signals
```

#### 2. Check Signal Decorator
```python
# Signals must use the correct decorator
@receiver(post_save, sender=PaymentRequest)
def handler(sender, instance, created, **kwargs):
    pass
```

#### 3. Test Manually
```python
# Django shell
from apps.accounts.models import User
user = User.objects.create_user('test@test.com', 'pass')
# Check email logs - welcome email should be triggered
```

---

## 📊 Monitoring & Analytics

### Email Sending Statistics
```python
# Count sent emails (from logs)
# Implement email logging model to track:
# - recipient
# - template
# - status (sent/failed)
# - timestamp
```

### Recommended Additions
1. **Email History Model:** Track all sent emails
2. **Bounce Handling:** Track failed deliveries
3. **Analytics Dashboard:** Monitor email metrics
4. **Retry Logic:** Automatic retry for failed sends

---

## 🔄 Future Enhancements

### Planned Features
1. **Email Scheduling:** Send emails at specific times (Celery)
2. **SMS Notifications:** Add SMS support for critical alerts
3. **Push Notifications:** Browser/mobile push notifications
4. **Notification Preferences:** Let users choose notification types
5. **Email Customization:** Allow admins to customize email templates
6. **Bulk Emails:** Newsletter system for announcements
7. **Email Analytics:** Track opens and clicks
8. **A/B Testing:** Test different email variations

---

## 📚 References

- Django Email Documentation: https://docs.djangoproject.com/en/stable/topics/email/
- Django Signals: https://docs.djangoproject.com/en/stable/topics/signals/
- Gmail App Passwords: https://myaccount.google.com/apppasswords

---

## ✨ Summary

The email notification system is now fully implemented and operational:
- ✅ 8 email types configured
- ✅ Automated signal-based triggers
- ✅ Professional HTML email templates
- ✅ Logging and error handling
- ✅ Management command for testing
- ✅ Ready for production deployment

**Next Steps:**
1. Install dependencies: `pip install -r requirements.txt`
2. Test emails: `python manage.py test_emails --email=your-email@example.com`
3. Monitor logs for any issues
4. Deploy to production with proper email credentials
