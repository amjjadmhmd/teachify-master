"""
Script to set default duration for existing lessons
Run: python manage.py shell < set_lesson_durations.py
Or run directly: python set_lesson_durations.py
"""

import os
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'teachify.settings')
django.setup()

from apps.courses.models import Lesson

# Get all lessons without duration
lessons = Lesson.objects.filter(duration_minutes=0)

print(f"Found {lessons.count()} lessons with duration=0")

# Set default duration (30 minutes) for all lessons without duration
if lessons.count() > 0:
    lessons.update(duration_minutes=30)
    print(f"✅ Updated {lessons.count()} lessons to 30 minutes")
    
    # Update course total durations
    from django.db.models import Sum
    from apps.courses.models import Course
    
    courses = Course.objects.all()
    updated_count = 0
    for course in courses:
        course.update_total_duration()
        updated_count += 1
    
    print(f"✅ Updated {updated_count} course durations")
else:
    print("✅ All lessons already have duration set")
