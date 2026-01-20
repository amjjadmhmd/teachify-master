/**
 * Payment Notification Listener
 * Listens for payment-related notifications and triggers refreshes
 * Automatically refreshes pending payments when rejection notification arrives
 */

import React, { useEffect } from 'react';
import { usePayment } from '../context/PaymentContext';

interface Notification {
  id?: number;
  type: string;
  title: string;
  message: string;
  is_read?: boolean;
  created_at?: string;
}

interface PaymentNotificationListenerProps {
  notifications?: Notification[];
}

/**
 * Component that listens for payment notifications and refreshes state
 * This is typically placed in App.tsx or Layout component
 */
export const PaymentNotificationListener: React.FC<PaymentNotificationListenerProps> = ({
  notifications = [],
}) => {
  const { refreshPendingPayments } = usePayment();

  /**
   * Watch for payment-related notifications and refresh
   */
  useEffect(() => {
    const paymentNotifications = notifications.filter(
      n =>
        (n.title && n.title.includes('Payment')) ||
        (n.message && n.message.includes('payment'))
    );

    if (paymentNotifications.length > 0) {
      // Check specifically for rejection notifications
      const rejectionNotification = paymentNotifications.find(
        n => n.type === 'warning' && n.title?.includes('Rejected')
      );

      const approvalNotification = paymentNotifications.find(
        n => n.type === 'success' && n.title?.includes('Approved')
      );

      if (rejectionNotification || approvalNotification) {
        // Refresh pending payments after a short delay
        // (to ensure server has processed the update)
        const timer = setTimeout(() => {
          refreshPendingPayments();
          console.log('Payment status refreshed due to notification');
        }, 500);

        return () => clearTimeout(timer);
      }
    }
  }, [notifications, refreshPendingPayments]);

  // This component is invisible - it only manages side effects
  return null;
};

export default PaymentNotificationListener;
