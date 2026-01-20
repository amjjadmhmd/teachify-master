from rest_framework import viewsets, status, permissions, mixins
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from django.db.models import Q
from django.contrib.auth import get_user_model
from django.shortcuts import get_object_or_404

from .models import PaymentRequest, CartItem, Course, Enrollment
from .serializers import (
    PaymentRequestSerializer,
    PaymentRequestCreateSerializer,
    PaymentRequestApproveSerializer,
    PaymentRequestRejectSerializer,
    CartItemSerializer
)
from apps.common.models import Notification

User = get_user_model()


# ============================
# 🛡️ PERMISSIONS
# ============================
class IsStudent(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == "student"


class IsInstructor(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == "instructor"


# ============================
# 🛒 CART VIEWSET
# ============================
class CartViewSet(mixins.ListModelMixin, mixins.CreateModelMixin, 
                  mixins.DestroyModelMixin, viewsets.GenericViewSet):
    """
    Cart management for students
    POST /api/courses/cart/ - Add course to cart
    GET /api/courses/cart/ - Get all cart items
    DELETE /api/courses/cart/{id}/ - Remove course from cart
    POST /api/courses/cart/{id}/clear-cart/ - Clear entire cart
    """
    serializer_class = CartItemSerializer
    permission_classes = [permissions.IsAuthenticated, IsStudent]

    def get_queryset(self):
        return CartItem.objects.filter(student=self.request.user)

    def perform_create(self, serializer):
        """
        Create or get CartItem to prevent duplicate key errors
        If item already in cart, return existing item (don't error)
        """
        course_id = self.request.data.get('course')
        if course_id:
            # Use get_or_create to handle duplicates gracefully
            CartItem.objects.get_or_create(
                student=self.request.user,
                course_id=course_id
            )
        else:
            # Fallback to normal save if no course specified
            serializer.save(student=self.request.user)

    @action(detail=False, methods=['post'])
    def clear_cart(self, request):
        """Clear all items from student's cart"""
        CartItem.objects.filter(student=request.user).delete()
        return Response({
            'detail': 'Cart cleared successfully'
        }, status=status.HTTP_204_NO_CONTENT)

    @action(detail=False, methods=['get'])
    def total(self, request):
        """Get cart total and item count"""
        cart_items = CartItem.objects.filter(student=request.user)
        total_amount = sum(float(item.course.price) for item in cart_items)
        return Response({
            'item_count': cart_items.count(),
            'total_amount': total_amount,
            'items': CartItemSerializer(cart_items, many=True, context={'request': request}).data
        })


# ============================
# 💳 PAYMENT REQUEST VIEWSET
# ============================
class PaymentRequestViewSet(viewsets.ModelViewSet):
    """
    Payment request management for students and instructors
    Students can:
        - Submit payment requests (POST /api/courses/payment-requests/)
        - View their own payment requests (GET /api/courses/payment-requests/)
        - View payment history (GET /api/courses/payment-requests/my-history/)
    
    Instructors can:
        - View payment requests from their students (GET /api/courses/payment-requests/pending/)
        - Approve payment requests (POST /api/courses/payment-requests/{id}/approve/)
        - Reject payment requests (POST /api/courses/payment-requests/{id}/reject/)
        - View payment history (GET /api/courses/payment-requests/history/)
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def get_serializer_class(self):
        if self.action == 'create':
            return PaymentRequestCreateSerializer
        return PaymentRequestSerializer

    def get_queryset(self):
        user = self.request.user
        if user.role == 'student':
            return PaymentRequest.objects.filter(student=user)
        elif user.role == 'instructor':
            # Instructors see payment requests from courses they teach
            instructed_courses = Course.objects.filter(instructor=user).values_list('id', flat=True)
            return PaymentRequest.objects.filter(courses__in=instructed_courses).distinct()
        return PaymentRequest.objects.none()

    def create(self, request, *args, **kwargs):
        """Submit a payment request"""
        if request.user.role != 'student':
            return Response(
                {'detail': 'Only students can submit payment requests'},
                status=status.HTTP_403_FORBIDDEN
            )
        return super().create(request, *args, **kwargs)

    def perform_create(self, serializer):
        """Create payment request from cart items"""
        payment_request = serializer.save(student=self.request.user)
        
        # Clear the cart items after payment submission
        cart_items = CartItem.objects.filter(student=self.request.user)
        cart_items.delete()

    @action(detail=False, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def my_history(self, request):
        """Get student's payment request history"""
        if request.user.role != 'student':
            return Response(
                {'detail': 'Only students can view payment history'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        payment_requests = PaymentRequest.objects.filter(student=request.user)
        serializer = self.get_serializer(payment_requests, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def pending(self, request):
        """Get all pending payment requests for instructor"""
        if request.user.role != 'instructor':
            return Response(
                {'detail': 'Only instructors can view pending payments'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        instructed_courses = Course.objects.filter(instructor=request.user).values_list('id', flat=True)
        pending_requests = PaymentRequest.objects.filter(
            courses__in=instructed_courses,
            status='pending'
        ).distinct()
        
        serializer = self.get_serializer(pending_requests, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def history(self, request):
        """Get payment history with filter options for instructor"""
        if request.user.role != 'instructor':
            return Response(
                {'detail': 'Only instructors can view payment history'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        instructed_courses = Course.objects.filter(instructor=request.user).values_list('id', flat=True)
        payment_requests = PaymentRequest.objects.filter(
            courses__in=instructed_courses,
            status__in=['approved', 'rejected']
        ).distinct()
        
        # Filter by status
        status_filter = request.query_params.get('status')
        if status_filter:
            payment_requests = payment_requests.filter(status=status_filter)
        
        # Filter by date range
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        if start_date:
            payment_requests = payment_requests.filter(submitted_at__gte=start_date)
        if end_date:
            payment_requests = payment_requests.filter(submitted_at__lte=end_date)
        
        # Filter by student
        student_id = request.query_params.get('student_id')
        if student_id:
            payment_requests = payment_requests.filter(student_id=student_id)
        
        serializer = self.get_serializer(payment_requests, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def approve(self, request, pk=None):
        """Approve a payment request and create enrollments"""
        payment_request = self.get_object()
        
        # Check if user is instructor of one of the courses
        instructed_courses = Course.objects.filter(instructor=request.user).values_list('id', flat=True)
        if not payment_request.courses.filter(id__in=instructed_courses).exists():
            return Response(
                {'detail': 'You do not have permission to approve this payment'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        if payment_request.status != 'pending':
            return Response(
                {'detail': 'Only pending payment requests can be approved'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            # Create enrollment for each course in the payment request
            for course in payment_request.courses.all():
                enrollment, created = Enrollment.objects.get_or_create(
                    student=payment_request.student,
                    course=course
                )
            
            # Mark payment request as approved
            payment_request.status = 'approved'
            payment_request.processed_at = timezone.now()
            payment_request.processed_by = request.user
            payment_request.save()
            
            # Send notification to student
            Notification.objects.create(
                user=payment_request.student,
                title='Payment Approved',
                message=f'Your payment of ${payment_request.total_amount} has been approved. You now have access to the courses!',
                type='success'
            )
            
            serializer = self.get_serializer(payment_request)
            return Response({
                'detail': 'Payment approved successfully',
                'payment_request': serializer.data
            }, status=status.HTTP_200_OK)
        
        except Exception as e:
            return Response(
                {'detail': f'Error approving payment: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def reject(self, request, pk=None):
        """Reject a payment request"""
        payment_request = self.get_object()
        
        # Check if user is instructor of one of the courses
        instructed_courses = Course.objects.filter(instructor=request.user).values_list('id', flat=True)
        if not payment_request.courses.filter(id__in=instructed_courses).exists():
            return Response(
                {'detail': 'You do not have permission to reject this payment'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        if payment_request.status != 'pending':
            return Response(
                {'detail': 'Only pending payment requests can be rejected'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            serializer = PaymentRequestRejectSerializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            
            rejection_reason = serializer.validated_data.get('rejection_reason', '')
            
            # Mark payment request as rejected
            payment_request.status = 'rejected'
            payment_request.rejection_reason = rejection_reason
            payment_request.processed_at = timezone.now()
            payment_request.processed_by = request.user
            payment_request.save()
            
            # NOTE: Cart items were already deleted when payment was submitted (perform_create line 137-138)
            # No need to delete them again. Student can freely add courses back to cart
            
            # Send notification to student
            message = 'Your payment has been rejected. '
            if rejection_reason:
                message += f'Reason: {rejection_reason}'
            else:
                message += 'Please contact your instructor for more information.'
            
            Notification.objects.create(
                user=payment_request.student,
                title='Payment Rejected',
                message=message,
                type='warning'
            )
            
            response_serializer = self.get_serializer(payment_request)
            return Response({
                'detail': 'Payment rejected successfully',
                'payment_request': response_serializer.data
            }, status=status.HTTP_200_OK)
        
        except Exception as e:
            return Response(
                {'detail': f'Error rejecting payment: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
