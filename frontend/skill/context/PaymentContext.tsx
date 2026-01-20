/**
 * Payment Context - Manages pending payments across the application
 * Provides auto-refresh when payment notifications arrive
 * Prevents adding courses with pending payments to cart
 */

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { api } from '../api/client';
import { useAuth } from './AuthContext';

interface Course {
  id: number;
  title?: string;
  price?: string;
}

interface PendingPayment {
  id: number;
  courses: number[]; // Backend returns course IDs as array of numbers
  course_titles?: string[]; // Backend provides course titles separately
  status: 'pending' | 'approved' | 'rejected';
  total_amount: number;
  submitted_at: string;
}

interface PaymentContextType {
  pendingPayments: PendingPayment[];
  isLoading: boolean;
  error: string | null;
  refreshPendingPayments: () => Promise<void>;
  isPendingForCourse: (courseId: number) => boolean;
  getPendingPaymentForCourse: (courseId: number) => PendingPayment | null;
}

const PaymentContext = createContext<PaymentContextType | undefined>(undefined);

export const PaymentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [pendingPayments, setPendingPayments] = useState<PendingPayment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  /**
   * Load pending payments from API
   */
  const loadPendingPayments = useCallback(async () => {
    if (!user || user.role !== 'student') {
      setPendingPayments([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await api.payment.getPaymentHistory();
      console.log('📊 Payment History Response:', response);
      const pending = (response || []).filter((p: PendingPayment) => p.status === 'pending');
      console.log('⏳ Pending Payments Filtered:', pending);
      setPendingPayments(pending);
    } catch (err) {
      console.error('Failed to load pending payments:', err);
      setError('Failed to load payment status');
      setPendingPayments([]);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  /**
   * Initial load on component mount
   */
  useEffect(() => {
    if (user?.role === 'student') {
      loadPendingPayments();
    }
  }, [user, loadPendingPayments]);

  /**
   * Refresh pending payments (called when notification arrives)
   */
  const refreshPendingPayments = useCallback(async () => {
    await loadPendingPayments();
  }, [loadPendingPayments]);

  /**
   * Check if course has a pending payment
   */
  const isPendingForCourse = useCallback(
    (courseId: number): boolean => {
      const result = pendingPayments.some(payment =>
        Array.isArray(payment.courses) && payment.courses.includes(courseId)
      );
      console.log(`🔍 isPendingForCourse(${courseId}): ${result}`, {
        courseId,
        pendingPayments,
      });
      return result;
    },
    [pendingPayments]
  );

  /**
   * Get pending payment for a specific course
   */
  const getPendingPaymentForCourse = useCallback(
    (courseId: number): PendingPayment | null => {
      return (
        pendingPayments.find(payment =>
          Array.isArray(payment.courses) && payment.courses.includes(courseId)
        ) || null
      );
    },
    [pendingPayments]
  );

  const value: PaymentContextType = {
    pendingPayments,
    isLoading,
    error,
    refreshPendingPayments,
    isPendingForCourse,
    getPendingPaymentForCourse,
  };

  return (
    <PaymentContext.Provider value={value}>
      {children}
    </PaymentContext.Provider>
  );
};

/**
 * Hook to use payment context
 */
export const usePayment = (): PaymentContextType => {
  const context = useContext(PaymentContext);
  if (context === undefined) {
    throw new Error('usePayment must be used within PaymentProvider');
  }
  return context;
};

export default PaymentContext;
