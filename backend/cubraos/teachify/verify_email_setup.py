#!/usr/bin/env python
"""
Email Setup Verification Script
Checks if email system is properly configured

Usage: python verify_email_setup.py
"""
import os
import sys
import django
from pathlib import Path

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'teachify.settings')
django.setup()

from django.conf import settings
from django.core.mail import send_mail
import smtplib

def check_settings():
    """Check if all required settings are configured"""
    print("\n📋 Checking Email Settings...\n")
    
    checks = {
        'EMAIL_HOST': settings.EMAIL_HOST,
        'EMAIL_PORT': settings.EMAIL_PORT,
        'EMAIL_HOST_USER': settings.EMAIL_HOST_USER,
        'DEFAULT_FROM_EMAIL': settings.DEFAULT_FROM_EMAIL,
        'FRONTEND_URL': settings.FRONTEND_URL,
        'EMAIL_USE_TLS': settings.EMAIL_USE_TLS,
    }
    
    all_good = True
    for key, value in checks.items():
        if value:
            print(f"✓ {key}: {value}")
        else:
            print(f"✗ {key}: NOT CONFIGURED")
            all_good = False
    
    return all_good


def check_smtp_connection():
    """Test SMTP connection"""
    print("\n🔗 Testing SMTP Connection...\n")
    
    try:
        server = smtplib.SMTP(settings.EMAIL_HOST, settings.EMAIL_PORT)
        server.starttls()
        print(f"✓ Connected to {settings.EMAIL_HOST}:{settings.EMAIL_PORT}")
        
        try:
            server.login(settings.EMAIL_HOST_USER, settings.EMAIL_HOST_PASSWORD)
            print(f"✓ Authentication successful for {settings.EMAIL_HOST_USER}")
            return True
        except smtplib.SMTPAuthenticationError:
            print("✗ Authentication failed!")
            print("  → Check your EMAIL_HOST_USER and EMAIL_HOST_PASSWORD")
            print("  → For Gmail, use an App Password (not your regular password)")
            return False
        finally:
            server.quit()
    
    except Exception as e:
        print(f"✗ Connection failed: {str(e)}")
        print("  → Check EMAIL_HOST and EMAIL_PORT")
        print("  → Check firewall allows SMTP traffic")
        return False


def check_templates():
    """Check if email templates exist"""
    print("\n📄 Checking Email Templates...\n")
    
    templates = [
        'base.html',
        'welcome.html',
        'payment_confirmation.html',
        'payment_approved.html',
        'payment_rejected.html',
        'payment_instructor_notification.html',
        'exam_results.html',
        'task_graded.html',
        'enrollment_confirmation.html',
    ]
    
    template_dir = Path(__file__).parent / 'templates' / 'emails'
    
    if not template_dir.exists():
        print(f"✗ Template directory not found: {template_dir}")
        return False
    
    all_exist = True
    for template in templates:
        path = template_dir / template
        if path.exists():
            print(f"✓ {template}")
        else:
            print(f"✗ {template} - NOT FOUND")
            all_exist = False
    
    return all_exist


def check_email_service():
    """Check if email service is properly configured"""
    print("\n⚙️  Checking Email Service...\n")
    
    try:
        from apps.common.email_service import EmailService
        print("✓ EmailService imported successfully")
        
        from apps.common.email_service import (
            WelcomeEmailService,
            PaymentEmailService,
            ExamEmailService,
            TaskEmailService,
            EnrollmentEmailService,
        )
        print("✓ All email service classes imported successfully")
        
        return True
    except ImportError as e:
        print(f"✗ Import error: {str(e)}")
        return False


def check_signals():
    """Check if signals are registered"""
    print("\n📡 Checking Signal Handlers...\n")
    
    try:
        from apps.common import signals
        print("✓ Signal handlers imported successfully")
        
        # Check if specific handlers exist
        handlers = [
            'send_welcome_email_on_register',
            'send_payment_notifications',
            'send_exam_results_email',
            'send_task_grading_email',
            'send_enrollment_confirmation_email',
        ]
        
        all_exist = True
        for handler in handlers:
            if hasattr(signals, handler):
                print(f"✓ {handler}")
            else:
                print(f"✗ {handler} - NOT FOUND")
                all_exist = False
        
        return all_exist
    except ImportError as e:
        print(f"✗ Import error: {str(e)}")
        return False


def run_all_checks():
    """Run all verification checks"""
    print("=" * 60)
    print("📧 TEACHIFY EMAIL SYSTEM VERIFICATION")
    print("=" * 60)
    
    results = {
        'Settings': check_settings(),
        'SMTP Connection': check_smtp_connection(),
        'Templates': check_templates(),
        'Email Service': check_email_service(),
        'Signal Handlers': check_signals(),
    }
    
    print("\n" + "=" * 60)
    print("✅ VERIFICATION SUMMARY")
    print("=" * 60 + "\n")
    
    all_passed = True
    for check, result in results.items():
        status = "✓ PASS" if result else "✗ FAIL"
        print(f"{check}: {status}")
        all_passed = all_passed and result
    
    print("\n" + "=" * 60)
    if all_passed:
        print("✅ All checks passed! Email system is ready.")
        print("\nNext steps:")
        print("1. Test with: python manage.py test_emails --email=your@email.com")
        print("2. Check logs for any issues: grep -i email debug.log")
        print("3. Register a new user to see welcome email in action")
    else:
        print("❌ Some checks failed. Please fix the issues above.")
        print("\nCommon issues:")
        print("- Gmail: Use App Password, not regular password")
        print("- Check firewall allows SMTP traffic")
        print("- Verify .env file has correct credentials")
    
    print("=" * 60 + "\n")
    
    return all_passed


if __name__ == '__main__':
    try:
        success = run_all_checks()
        sys.exit(0 if success else 1)
    except KeyboardInterrupt:
        print("\n\n⚠️  Verification cancelled by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n\n❌ Verification failed with error: {str(e)}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
