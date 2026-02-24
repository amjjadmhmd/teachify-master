# from rest_framework.routers import DefaultRouter
# from .views import (
#     CourseViewSet,
#     LessonViewSet,
#     CategoryViewSet,
#     EnrollmentViewSet,
#     LessonProgressViewSet,
#     WishlistViewSet,
#     DashboardViewSet,
#     InstructorDashboardViewSet,
#     TopStudentsViewSet,
# )

# router = DefaultRouter()

# router.register("courses", CourseViewSet, basename="courses")
# router.register("lessons", LessonViewSet, basename="lessons")
# router.register("categories", CategoryViewSet, basename="categories")
# router.register("enrollments", EnrollmentViewSet, basename="enrollments")
# router.register("progress", LessonProgressViewSet, basename="progress")
# router.register("wishlist", WishlistViewSet, basename="wishlist")

# router.register("dashboard", DashboardViewSet, basename="dashboard")
# router.register(
#     "instructor/dashboard",
#     InstructorDashboardViewSet,
#     basename="instructor-dashboard"
# )


# router.register(
#     "top-students",
#     TopStudentsViewSet,
#     basename="top-students"
# )


# urlpatterns = router.urls


# File: backend/cubraos/teachify/apps/courses/urls.py
"""
Updated URLs with public endpoints and instructor features
"""
from rest_framework.routers import DefaultRouter
from django.urls import path
from .views import (
    CourseViewSet,
    LessonViewSet,
    CategoryViewSet,
    LandingCourseViewSet,
    EnrollmentViewSet,
    LessonProgressViewSet,
    WishlistViewSet,
    DashboardViewSet,
    InstructorDashboardViewSet,
    TopStudentsViewSet,
    placeholder_thumbnail,
    TaskViewSet,
    TaskSubmissionViewSet,
)
from .payment_views import CartViewSet, PaymentRequestViewSet
from .public_views import PublicCourseViewSet
from .instructor_views import instructor_wallet, instructor_students, create_course_lesson, create_course_resource, delete_resource

router = DefaultRouter()

# Existing routes
router.register("courses", CourseViewSet, basename="courses")
router.register("lessons", LessonViewSet, basename="lessons")
router.register("categories", CategoryViewSet, basename="categories")
router.register("landing-courses", LandingCourseViewSet, basename="landing-courses")
router.register("enrollments", EnrollmentViewSet, basename="enrollments")
router.register("progress", LessonProgressViewSet, basename="progress")
router.register("wishlist", WishlistViewSet, basename="wishlist")
router.register("dashboard", DashboardViewSet, basename="dashboard")
router.register(
    "instructor/dashboard",
    InstructorDashboardViewSet,
    basename="instructor-dashboard"
)
router.register(
    "top-students",
    TopStudentsViewSet,
    basename="top-students"
)

# Public routes (no authentication required)
router.register("public/courses", PublicCourseViewSet, basename="public-courses")

# Task routes (new)
router.register("tasks", TaskViewSet, basename="tasks")
router.register("task-submissions", TaskSubmissionViewSet, basename="task-submissions")

# Payment & Cart routes (new)
router.register("cart", CartViewSet, basename="cart")
router.register("payment-requests", PaymentRequestViewSet, basename="payment-requests")

urlpatterns = router.urls + [
    # Public endpoints
        
    # Instructor-specific endpoints
    path('instructor/wallet/', instructor_wallet, name='instructor-wallet'),
    path('instructor/students/', instructor_students, name='instructor-students'),
    
    # Nested course endpoints for lessons and resources
    path('courses/<int:course_id>/lessons/', create_course_lesson, name='create-course-lesson'),
    path('courses/<int:course_id>/resources/', create_course_resource, name='create-course-resource'),
    path('resources/<int:resource_id>/', delete_resource, name='delete-resource'),
    
    # Placeholder thumbnail endpoint
    path('placeholder-thumbnail/<int:course_id>/', placeholder_thumbnail, name='placeholder-thumbnail'),
]
