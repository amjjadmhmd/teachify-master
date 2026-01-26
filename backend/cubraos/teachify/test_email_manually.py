#!/usr/bin/env python
"""
Manual Email Testing Script
Run this to quickly test email sending without Django shell

Usage:
    python test_email_manually.py
    python test_email_manually.py your-email@example.com
"""
import os
import sys
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'teachify.settings')
django.setup()

from django.conf import settings
from apps.common.email_service import (
    EmailService,
    WelcomeEmailService,
    PaymentEmailService,
    ExamEmailService,
    TaskEmailService,
    EnrollmentEmailService,
)
from apps.accounts.models import User


def main():
    print("\n" + "="*70)
    print("📧 TEACHIFY EMAIL TESTING UTILITY")
    print("="*70 + "\n")
    
    # Get email from CLI argument or prompt
    email = sys.argv[1] if len(sys.argv) > 1 else input("Enter test email address: ").strip()
    
    if not email or '@' not in email:
        print("❌ Invalid email address!")
        return False
    
    print(f"\n📬 Testing with: {email}\n")
    
    # Create or get test user
    try:
        user, created = User.objects.get_or_create(
            email=email,
            defaults={
                'username': email.split('@')[0],
                'first_name': 'Test',
                'last_name': 'User',
            }
        )
        
        if created:
            print(f"✓ Created test user: {email}")
            user.set_password('testpass123')
            user.save()
        else:
            print(f"✓ Using existing user: {email}")
    
    except Exception as e:
        print(f"❌ Error creating user: {e}")
        return False
    
    # Test email sending
    print("\n" + "-"*70)
    print("🧪 TESTING EMAIL SENDING")
    print("-"*70 + "\n")
    
    tests = [
        ("Welcome Email", lambda: WelcomeEmailService.send_welcome_email(user)),
        ("Generic Email", lambda: EmailService.send_email(
            subject="Test Email from Teachify",
            to_email=email,
            template_name="welcome",
            context={'user_name': user.first_name or email.split('@')[0]}
        )),
    ]
    
    results = []
    for test_name, test_func in tests:
        try:
            result = test_func()
            status = "✓ SENT" if result else "✗ FAILED"
            results.append((test_name, status))
            print(f"{test_name}: {status}")
        except Exception as e:
            results.append((test_name, f"✗ ERROR: {str(e)[:50]}"))
            print(f"{test_name}: ✗ ERROR")
            print(f"  {str(e)}")
    
    # Summary
    print("\n" + "-"*70)
    print("📊 TEST SUMMARY")
    print("-"*70 + "\n")
    
    success_count = sum(1 for _, status in results if "✓" in status)
    total_count = len(results)
    
    for test_name, status in results:
        print(f"{test_name}: {status}")
    
    print(f"\n{success_count}/{total_count} tests passed")
    
    if success_count == total_count:
        print("\n✅ All tests passed! Email system is working correctly.")
        print(f"\n📧 Check your inbox at {email}")
        return True
    else:
        print("\n⚠️  Some tests failed. Check the errors above.")
        print("\nTroubleshooting:")
        print("1. Verify .env has correct EMAIL_HOST_USER and EMAIL_HOST_PASSWORD")
        print("2. For Gmail: Use App Password, not regular password")
        print("3. Run: python verify_email_setup.py")
        return False


if __name__ == '__main__':
    try:
        success = main()
        print("\n" + "="*70 + "\n")
        sys.exit(0 if success else 1)
    except KeyboardInterrupt:
        print("\n\n⚠️  Test cancelled by user\n")
        sys.exit(0)
    except Exception as e:
        print(f"\n❌ Test failed: {str(e)}\n")
        import traceback
        traceback.print_exc()
        sys.exit(1)
