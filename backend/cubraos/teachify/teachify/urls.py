from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)
from apps.courses.public_views import platform_stats, public_instructors


from django.contrib import admin

admin.site.site_header = "Geo Top Educational Platform"
admin.site.site_title = "Geo Top Admin"
admin.site.index_title = "Welcome to Geo Top Administration"
from teachify.views import admin_dashboard
from django.conf.urls.i18n import i18n_patterns



urlpatterns = [
    path('i18n/', include('django.conf.urls.i18n')),  # Add this
    path('admin/dashboard/', admin_dashboard, name='admin_dashboard'),
    # -----------------------------
    # Admin Panel
    # -----------------------------
    path('admin/', admin.site.urls),

    # -----------------------------
    # Users / Accounts API
    # -----------------------------
    path('api/accounts/', include('apps.accounts.urls')),


    # -----------------------------
    # Courses, Lessons, Categories API
    # -----------------------------
    path('api/courses/', include('apps.courses.urls')),

    # -----------------------------
    # Exams API (Exams + Questions + Attempts + Answers)
    # -----------------------------
    path('api/', include('apps.exams.urls')),


    # -----------------------------
    # JWT Authentication Endpoints
    # -----------------------------
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),

    # -----------------------------
    # DRF Login/Logout Buttons (Browsable API)
    # -----------------------------
    path('api/auth/', include('rest_framework.urls')),

    #--------------------------
    # stuednt alert path common
    #--------------------------
    path("api/", include("apps.common.urls")),
    
    path('public/stats/', platform_stats, name='platform-stats'),
    path('public/instructors/', public_instructors, name='public-instructors'),


    
]


# إضافة هذا الجزء لخدمة ملفات الميديا والصور
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
