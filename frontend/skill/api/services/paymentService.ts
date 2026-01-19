/**
 * Payment & Cart Service
 * Handles all payment and shopping cart related API calls
 */
import apiClient, { handleApiError } from "../config";

class PaymentService {
  // ==========================================
  // CART OPERATIONS
  // ==========================================

  /**
   * Get all cart items for current user
   * GET /api/courses/cart/
   */
  async getCart(): Promise<any[]> {
    try {
      const response = await apiClient.get("/api/courses/cart/");
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Get cart total and item count
   * GET /api/courses/cart/total/
   */
  async getCartTotal(): Promise<{
    item_count: number;
    total_amount: number;
    items: any[];
  }> {
    try {
      const response = await apiClient.get("/api/courses/cart/total/");
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Add course to cart
   * POST /api/courses/cart/
   */
  async addToCart(courseId: number): Promise<any> {
    try {
      const response = await apiClient.post("/api/courses/cart/", {
        course: courseId,
      });
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Remove course from cart
   * DELETE /api/courses/cart/{id}/
   */
  async removeFromCart(cartItemId: number): Promise<void> {
    try {
      await apiClient.delete(`/api/courses/cart/${cartItemId}/`);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Clear entire cart
   * POST /api/courses/cart/clear-cart/
   */
  async clearCart(): Promise<void> {
    try {
      await apiClient.post("/api/courses/cart/clear-cart/");
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  // ==========================================
  // PAYMENT REQUEST OPERATIONS
  // ==========================================

  /**
   * Submit payment request
   * POST /api/courses/payment-requests/
   */
  async submitPayment(formData: FormData): Promise<any> {
    try {
      const response = await apiClient.post(
        "/api/courses/payment-requests/",
        formData
      );
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Get student's payment history
   * GET /api/courses/payment-requests/my-history/
   */
  async getPaymentHistory(): Promise<any[]> {
    try {
      const response = await apiClient.get(
        "/api/courses/payment-requests/my-history/"
      );
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Get pending payments for instructor
   * GET /api/courses/payment-requests/pending/
   */
  async getPendingPayments(): Promise<any[]> {
    try {
      const response = await apiClient.get(
        "/api/courses/payment-requests/pending/"
      );
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Get payment history for instructor
   * GET /api/courses/payment-requests/history/
   */
  async getPaymentHistoryForInstructor(params?: {
    status?: string;
    start_date?: string;
    end_date?: string;
    student_id?: number;
  }): Promise<any[]> {
    try {
      const response = await apiClient.get(
        "/api/courses/payment-requests/history/",
        { params }
      );
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Approve payment request
   * POST /api/courses/payment-requests/{id}/approve/
   */
  async approvePayment(paymentId: number): Promise<any> {
    try {
      const response = await apiClient.post(
        `/api/courses/payment-requests/${paymentId}/approve/`
      );
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Reject payment request
   * POST /api/courses/payment-requests/{id}/reject/
   */
  async rejectPayment(paymentId: number, reason: string): Promise<any> {
    try {
      const response = await apiClient.post(
        `/api/courses/payment-requests/${paymentId}/reject/`,
        {
          rejection_reason: reason,
        }
      );
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }
}

export default new PaymentService();
