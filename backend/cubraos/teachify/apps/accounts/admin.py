from django.contrib import admin
from django.utils.html import format_html
from .models import User, EmailVerificationLog


@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ['email', 'role', 'verification_status', 'date_joined']
    list_filter = ['role', 'is_verified', 'is_active', 'date_joined']
    search_fields = ['email', 'username', 'first_name', 'last_name']
    readonly_fields = ['date_joined', 'last_login', 'email_verified_at']
    
    fieldsets = (
        ('Authentication', {'fields': ('email', 'username', 'password')}),
        ('Personal Info', {'fields': ('first_name', 'last_name', 'phone_number', 'avatar')}),
        ('Role & Permissions', {'fields': ('role', 'is_staff', 'is_superuser', 'is_active', 'groups', 'user_permissions')}),
        ('Verification', {'fields': ('is_verified', 'email_verified_at', 'instructor_verified', 'verification_attempts')}),
        ('Timestamps', {'fields': ('date_joined', 'last_login'), 'classes': ('collapse',)}),
    )
    
    def verification_status(self, obj):
        if obj.is_verified:
            return format_html('<span style="color: green;">✓ Verified</span>')
        return format_html('<span style="color: red;">✗ Unverified</span>')
    verification_status.short_description = 'Status'


@admin.register(EmailVerificationLog)
class EmailVerificationLogAdmin(admin.ModelAdmin):
    list_display = ['user', 'email', 'verification_status', 'created_at']
    list_filter = ['verified', 'created_at']
    search_fields = ['user__email', 'email']
    readonly_fields = ['user', 'email', 'token', 'created_at', 'verified_at']
    
    def verification_status(self, obj):
        if obj.verified:
            return format_html('<span style="color: green;">✓ Verified</span>')
        if obj.is_expired():
            return format_html('<span style="color: orange;">⏱ Expired</span>')
        return format_html('<span style="color: blue;">⏳ Pending</span>')
    verification_status.short_description = 'Status'
