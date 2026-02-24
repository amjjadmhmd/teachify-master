from rest_framework.permissions import BasePermission


class IsStudent(BasePermission):
    def has_permission(self, request, view):
        return (
            request.user.is_authenticated and
            request.user.role == "student"
        )


class IsInstructor(BasePermission):
    def has_permission(self, request, view):
        return (
            request.user.is_authenticated and
            request.user.role == "instructor"
        )


class IsPlatformAdmin(BasePermission):
    """
    Allows access only to platform admins.
    Supports both explicit `role=admin` and Django staff/superuser users.
    """

    def has_permission(self, request, view):
        user = request.user
        return bool(
            user.is_authenticated and (
                getattr(user, "role", "") == "admin"
                or user.is_staff
                or user.is_superuser
            )
        )
