import os
from decouple import config

from pathlib import Path
from datetime import timedelta

BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = config('SECRET_KEY')

DEBUG = config('DEBUG', default=True, cast=bool)
BASE_DIR = Path(__file__).resolve().parent.parent

ALLOWED_HOSTS = ['*']
# ALLOWED_HOSTS = config('ALLOWED_HOSTS', default='localhost,127.0.0.1', cast=lambda v: [s.strip() for s in v.split(',')])

INSTALLED_APPS = [
    'jazzmin',
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',

    'corsheaders',
    'rest_framework',
    'rest_framework_simplejwt',
    'rest_framework_simplejwt.token_blacklist',

    'apps.accounts',
    'apps.branding',
    'apps.common',
    'apps.courses',
    'apps.exams',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
    'django.middleware.locale.LocaleMiddleware',
]

ROOT_URLCONF = 'teachify.urls'

CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]
# CORS_ALLOWED_ORIGINS = config('CORS_ALLOWED_ORIGINS', default='http://localhost:3000', cast=lambda v: [s.strip() for s in v.split(',')])

CORS_ALLOW_CREDENTIALS = True

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
        'rest_framework.authentication.SessionAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.AllowAny',
    ),
}

SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=60),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
    'ALGORITHM': 'HS256',
    'SIGNING_KEY': SECRET_KEY,
    'AUTH_HEADER_TYPES': ('Bearer',),
}

SECURE_SSL_REDIRECT = config('SECURE_SSL_REDIRECT', default=False, cast=bool)
SESSION_COOKIE_SECURE = config('SESSION_COOKIE_SECURE', default=False, cast=bool)
CSRF_COOKIE_SECURE = config('CSRF_COOKIE_SECURE', default=False, cast=bool)
SECURE_HSTS_SECONDS = config('SECURE_HSTS_SECONDS', default=0, cast=int)
SECURE_HSTS_INCLUDE_SUBDOMAINS = config('SECURE_HSTS_INCLUDE_SUBDOMAINS', default=False, cast=bool)
X_FRAME_OPTIONS = 'DENY'

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': config('DB_NAME', default='teachify_db'),
        'USER': config('DB_USER', default='postgres'),
        'PASSWORD': config('DB_PASSWORD', default='cubra2004'),
        'HOST': config('DB_HOST', default='localhost'),
        'PORT': config('DB_PORT', default='5432'),
        'CONN_MAX_AGE': config('DB_CONN_MAX_AGE', default=600, cast=int),
    }
}

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [os.path.join(BASE_DIR, 'templates')],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True

STATIC_URL = '/static/'

STATICFILES_DIRS = [
    BASE_DIR / 'static',
]

STATIC_ROOT = BASE_DIR / 'staticfiles'

MEDIA_URL = '/media/'
MEDIA_ROOT = os.path.join(BASE_DIR, 'media')

AUTH_USER_MODEL = 'accounts.User'
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

LANGUAGES = [
    ('en', 'English'),
    ('ar', 'Arabic'),
]

LOCALE_PATHS = [
    BASE_DIR / 'locale',
]

INSTRUCTOR_VERIFICATION_CODE = config('INSTRUCTOR_VERIFICATION_CODE', default='Tech12@')

EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = config('EMAIL_HOST', default='smtp.gmail.com')
EMAIL_PORT = config('EMAIL_PORT', default=587, cast=int)
EMAIL_HOST_USER = config('EMAIL_HOST_USER', default='mahmoudwafi33@gmail.com')
EMAIL_HOST_PASSWORD = config('EMAIL_HOST_PASSWORD', default='pvay rygl gzzg vaan')
EMAIL_USE_TLS = config('EMAIL_USE_TLS', default=True, cast=bool)

DEFAULT_FROM_EMAIL = config('DEFAULT_FROM_EMAIL', default='mahmoudwafi33@gmail.com')

EMAIL_VERIFICATION_REQUIRED = config('EMAIL_VERIFICATION_REQUIRED', default=True, cast=bool)
EMAIL_VERIFICATION_EXPIRY_HOURS = config('EMAIL_VERIFICATION_EXPIRY_HOURS', default=24, cast=int)
OTP_EXPIRY_MINUTES = config('OTP_EXPIRY_MINUTES', default=15, cast=int)
MAX_VERIFICATION_ATTEMPTS = config('MAX_VERIFICATION_ATTEMPTS', default=5, cast=int)
VERIFICATION_EMAIL_RATE_LIMIT = config('VERIFICATION_EMAIL_RATE_LIMIT', default=3, cast=int)
FRONTEND_URL = config('FRONTEND_URL', default='http://localhost:3000')

JAZZMIN_SETTINGS = {
    "site_title": "Teachify Admin",
    "site_header": "Teachify Educational Platform",
    "site_brand": "Teachify",
    "site_logo": "images/logo.png",
    "site_logo_classes": "img-circle",
    "welcome_sign": "Welcome Back To Teachify Educational Platform",
    "copyright": "Teachify Educational Platform © 2024",
    "search_model": ["auth.User", "courses.Course", "exams.Exam"],
    "user_avatar": None,
    "topmenu_links": [
        {"name": "Home", "url": "admin:index", "permissions": ["auth.view_user"]},
        {"name": "View Site", "url": "/", "new_window": True},
        {"name": "Support", "url": "https://github.com/yourusername/teachify/issues", "new_window": True},
        {"model": "auth.User"},
        {"model": "courses.Course"},
        {"app": "courses"},
    ],
    "usermenu_links": [
        {"name": "View Site", "url": "/", "new_window": True},
        {"model": "auth.user"},
    ],
    "show_sidebar": True,
    "navigation_expanded": True,
    "hide_apps": [],
    "hide_models": [],
    "order_with_respect_to": [
        "auth",
        "accounts",
        "courses",
        "exams",
        "common",
    ],
    "icons": {
        "auth": "fas fa-users-cog",
        "auth.user": "fas fa-user",
        "auth.Group": "fas fa-users",
        "accounts.User": "fas fa-user-graduate",
        "accounts.Profile": "fas fa-id-card",
        "courses": "fas fa-book-open",
        "courses.Course": "fas fa-book",
        "courses.Category": "fas fa-folder",
        "courses.Enrollment": "fas fa-user-check",
        "courses.Lesson": "fas fa-chalkboard-teacher",
        "courses.Material": "fas fa-file-pdf",
        "exams": "fas fa-clipboard-list",
        "exams.Exam": "fas fa-file-alt",
        "exams.Question": "fas fa-question-circle",
        "exams.StudentExamAttempt": "fas fa-tasks",
        "exams.StudentAnswer": "fas fa-check-circle",
        "exams.Certificate": "fas fa-certificate",
        "common": "fas fa-cog",
        "common.Notification": "fas fa-bell",
        "common.Settings": "fas fa-sliders-h",
    },
    "custom_links": {
        "courses": [{
            "name": "Import Courses",
            "url": "/admin/courses/import/",
            "icon": "fas fa-file-import",
            "permissions": ["courses.add_course"]
        }],
        "exams": [{
            "name": "Export Results",
            "url": "/admin/exams/export/",
            "icon": "fas fa-file-export",
            "permissions": ["exams.view_studentexamattempt"]
        }]
    },
    "show_ui_builder": False,
    "changeform_format": "horizontal_tabs",
    "changeform_format_overrides": {
        "auth.user": "collapsible",
        "auth.group": "vertical_tabs",
    },
    "related_modal_active": True,
    "language_chooser": True,
}

JAZZMIN_UI_TWEAKS = {
    "custom_css": "css/custom_admin.css",
    "navbar": "navbar-dark",
    "no_navbar_border": False,
    "navbar_fixed": True,
    "layout_boxed": False,
    "footer_fixed": False,
    "sidebar_fixed": True,
    "sidebar": "sidebar-dark-primary",
    "brand_color": "navbar-primary",
    "brand_small_text": False,
    "accent": "accent-primary",
    "button_classes": {
        "primary": "btn-primary",
        "secondary": "btn-secondary",
        "info": "btn-info",
        "warning": "btn-warning",
        "danger": "btn-danger",
        "success": "btn-success",
    },
    "custom_css": "css/custom_admin.css",
    "custom_js": "js/custom_admin.js",
    "theme": "default",
    "actions_sticky_top": True,
}
