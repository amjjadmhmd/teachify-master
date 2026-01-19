from django.contrib import admin
from .models import (
    Course,
    Lesson,
    Category,
    Enrollment,
    LessonProgress,
    WishlistItem,
    Task,
    TaskSubmission,
    CartItem,
    PaymentRequest
)

# ============================
# Cart Admin
# ============================
class CartItemAdmin(admin.ModelAdmin):
    list_display = ('student', 'course', 'added_at')
    list_filter = ('added_at', 'student')
    search_fields = ('student__email', 'course__title')
    readonly_fields = ('added_at',)


# ============================
# Payment Admin
# ============================
class PaymentRequestAdmin(admin.ModelAdmin):
    list_display = ('id', 'student', 'total_amount', 'status', 'submitted_at')
    list_filter = ('status', 'submitted_at', 'processed_at')
    search_fields = ('student__email', 'courses__title')
    readonly_fields = ('submitted_at', 'processed_at', 'processed_by')
    
    def get_readonly_fields(self, request, obj=None):
        if obj:  # Editing existing payment
            return self.readonly_fields + ('student', 'status')
        return self.readonly_fields


# Register with custom admins
admin.site.register(Course)
admin.site.register(Lesson)
admin.site.register(Category)
admin.site.register(Enrollment)
admin.site.register(LessonProgress)
admin.site.register(WishlistItem)
admin.site.register(Task)
admin.site.register(TaskSubmission)
admin.site.register(CartItem, CartItemAdmin)
admin.site.register(PaymentRequest, PaymentRequestAdmin)

