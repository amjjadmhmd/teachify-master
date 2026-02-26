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
    PaymentRequest,
    LandingCourse,
    LandingCourseEpisode,
    LandingBlog,
    LandingProject,
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


class LandingCourseEpisodeInline(admin.TabularInline):
    model = LandingCourseEpisode
    extra = 1
    fields = (
        "title",
        "duration_minutes",
        "sort_order",
        "is_preview",
        "video_url",
    )
    ordering = ("sort_order", "id")


class LandingCourseAdmin(admin.ModelAdmin):
    list_display = (
        "title",
        "is_published",
        "sort_order",
        "is_free",
        "updated_at",
    )
    list_filter = ("is_published", "is_free", "course_language")
    search_fields = ("title", "slug", "instructor_name")
    ordering = ("sort_order", "id")
    readonly_fields = ("slug", "created_at", "updated_at", "created_by", "updated_by")
    inlines = [LandingCourseEpisodeInline]


class LandingBlogAdmin(admin.ModelAdmin):
    list_display = (
        "title",
        "author_name",
        "is_published",
        "sort_order",
        "updated_at",
    )
    list_filter = ("is_published",)
    search_fields = ("title", "slug", "author_name")
    ordering = ("sort_order", "id")
    readonly_fields = ("slug", "created_at", "updated_at", "created_by", "updated_by")


class LandingProjectAdmin(admin.ModelAdmin):
    list_display = (
        "title",
        "project_type",
        "client_name",
        "is_published",
        "sort_order",
        "updated_at",
    )
    list_filter = ("is_published", "project_type")
    search_fields = ("title", "slug", "project_type", "client_name")
    ordering = ("sort_order", "id")
    readonly_fields = ("slug", "created_at", "updated_at", "created_by", "updated_by")


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
admin.site.register(LandingCourse, LandingCourseAdmin)
admin.site.register(LandingBlog, LandingBlogAdmin)
admin.site.register(LandingProject, LandingProjectAdmin)

