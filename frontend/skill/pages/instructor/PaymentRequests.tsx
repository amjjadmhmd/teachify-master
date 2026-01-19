import React, { useState, useEffect } from 'react';
import { Lang } from '../../types';
import apiClient from '../../api/config';
import { Card, Button, Input } from '../../components/UI';
import { Reveal } from '../../components/Reveal';
import {
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  AlertCircle,
  CreditCard,
  Filter,
} from 'lucide-react';

interface PaymentRequest {
  id: number;
  student: number;
  student_email: string;
  courses: number[];
  course_titles: string[];
  total_amount: string;
  payment_proof_image: string;
  payment_proof_url: string;
  status: 'pending' | 'approved' | 'rejected';
  rejection_reason?: string;
  submitted_at: string;
  processed_at?: string;
  processed_by_email?: string;
}

interface PaymentRequestsProps {
  lang: Lang;
}

const PaymentRequests: React.FC<PaymentRequestsProps> = ({ lang }) => {
  const [activeTab, setActiveTab] = useState<'pending' | 'history'>('pending');
  const [pendingPayments, setPendingPayments] = useState<PaymentRequest[]>([]);
  const [historyPayments, setHistoryPayments] = useState<PaymentRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedPayment, setSelectedPayment] = useState<PaymentRequest | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [processing, setProcessing] = useState(false);

  // History filters
  const [filterStatus, setFilterStatus] = useState<'all' | 'approved' | 'rejected'>('all');
  const [filterStudent, setFilterStudent] = useState('');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');

  useEffect(() => {
    if (activeTab === 'pending') {
      fetchPendingPayments();
    } else {
      fetchPaymentHistory();
    }
  }, [activeTab, filterStatus, filterStudent, filterStartDate, filterEndDate]);

  const fetchPendingPayments = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/api/courses/payment-requests/pending/');
      setPendingPayments(response.data);
    } catch (err) {
      console.error('Failed to fetch pending payments:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPaymentHistory = async () => {
    try {
      setLoading(true);
      let url = '/api/courses/payment-requests/history/';
      const params = new URLSearchParams();

      if (filterStatus !== 'all') params.append('status', filterStatus);
      if (filterStudent) params.append('student_id', filterStudent);
      if (filterStartDate) params.append('start_date', filterStartDate);
      if (filterEndDate) params.append('end_date', filterEndDate);

      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      const response = await apiClient.get(url);
      setHistoryPayments(response.data);
    } catch (err) {
      console.error('Failed to fetch payment history:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (payment: PaymentRequest) => {
    if (!window.confirm(`Approve payment of $${payment.total_amount} from ${payment.student_email}?`)) {
      return;
    }

    setProcessing(true);
    try {
      await apiClient.post(`/api/courses/payment-requests/${payment.id}/approve/`);
      alert('Payment approved successfully');
      fetchPendingPayments();
    } catch (err: any) {
      alert('Failed to approve payment: ' + (err.response?.data?.detail || 'Unknown error'));
    } finally {
      setProcessing(false);
    }
  };

  const handleRejectClick = (payment: PaymentRequest) => {
    setSelectedPayment(payment);
    setRejectionReason('');
    setShowRejectModal(true);
  };

  const handleReject = async () => {
    if (!selectedPayment) return;

    setProcessing(true);
    try {
      await apiClient.post(`/api/courses/payment-requests/${selectedPayment.id}/reject/`, {
        rejection_reason: rejectionReason,
      });
      alert('Payment rejected successfully');
      setShowRejectModal(false);
      setSelectedPayment(null);
      setRejectionReason('');
      fetchPendingPayments();
    } catch (err: any) {
      alert('Failed to reject payment: ' + (err.response?.data?.detail || 'Unknown error'));
    } finally {
      setProcessing(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderPaymentCard = (payment: PaymentRequest, showActions = false) => (
    <Card key={payment.id} className="p-6 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <CreditCard size={24} className="text-primary" />
          <div>
            <p className="font-semibold text-slate-900 dark:text-white">
              {payment.student_email}
            </p>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Request #{payment.id}
            </p>
          </div>
        </div>
        <p className="text-2xl font-bold text-slate-900 dark:text-white">
          ${parseFloat(payment.total_amount).toFixed(2)}
        </p>
      </div>

      {/* Courses */}
      <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
        <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">Courses</p>
        <ul className="space-y-1">
          {payment.course_titles.map((title, i) => (
            <li key={i} className="text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-primary rounded-full"></span>
              {title}
            </li>
          ))}
        </ul>
      </div>

      {/* Date and Image */}
      <div className="border-t border-slate-200 dark:border-slate-700 pt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
          <Clock size={16} />
          {formatDate(payment.submitted_at)}
        </div>
        <button
          onClick={() => setSelectedImage(payment.payment_proof_url)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors text-slate-900 dark:text-white"
        >
          <Eye size={16} />
          View Proof
        </button>
      </div>

      {/* Actions */}
      {showActions && (
        <div className="border-t border-slate-200 dark:border-slate-700 pt-4 flex gap-2">
          <Button
            onClick={() => handleApprove(payment)}
            isLoading={processing}
            className="flex-1 bg-green-600 hover:bg-green-700"
          >
            <CheckCircle size={18} /> Approve
          </Button>
          <Button
            onClick={() => handleRejectClick(payment)}
            isLoading={processing}
            className="flex-1 bg-red-600 hover:bg-red-700"
          >
            <XCircle size={18} /> Reject
          </Button>
        </div>
      )}

      {/* Rejection Reason (in history) */}
      {payment.status === 'rejected' && payment.rejection_reason && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
          <p className="text-sm text-red-900 dark:text-red-200 font-medium mb-1">
            Rejection Reason
          </p>
          <p className="text-sm text-red-800 dark:text-red-300">
            {payment.rejection_reason}
          </p>
        </div>
      )}

      {/* Processed info */}
      {payment.processed_at && (
        <div className="text-xs text-slate-600 dark:text-slate-400 flex items-center gap-2">
          <span className="w-2 h-2 bg-slate-400 rounded-full"></span>
          Processed on {formatDate(payment.processed_at)} by {payment.processed_by_email}
        </div>
      )}
    </Card>
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <Reveal width="100%">
          <div className="flex items-center gap-3 mb-8">
            <CreditCard size={32} className="text-primary" />
            <div>
              <h1 className="text-4xl font-bold text-slate-900 dark:text-white">Payment Requests</h1>
              <p className="text-slate-600 dark:text-slate-400">Manage student payment submissions</p>
            </div>
          </div>
        </Reveal>

        {/* Tabs */}
        <Reveal delay={0.1} width="100%">
          <div className="flex gap-2 mb-8 border-b border-slate-200 dark:border-slate-800">
            <button
              onClick={() => setActiveTab('pending')}
              className={`px-6 py-3 font-medium border-b-2 transition-colors ${
                activeTab === 'pending'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Clock size={18} className="inline mr-2" />
              Pending Requests
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`px-6 py-3 font-medium border-b-2 transition-colors ${
                activeTab === 'history'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <CheckCircle size={18} className="inline mr-2" />
              Payment History
            </button>
          </div>
        </Reveal>

        {/* Content */}
        {activeTab === 'pending' ? (
          <>
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              </div>
            ) : pendingPayments.length === 0 ? (
              <Reveal delay={0.2} width="100%">
                <Card className="text-center py-12">
                  <AlertCircle size={48} className="mx-auto mb-4 text-slate-400" />
                  <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
                    No pending payments
                  </h3>
                  <p className="text-slate-600 dark:text-slate-400">
                    All payment requests have been processed
                  </p>
                </Card>
              </Reveal>
            ) : (
              <div className="space-y-4">
                {pendingPayments.map((payment, index) => (
                  <Reveal key={payment.id} delay={index * 0.05} width="100%">
                    {renderPaymentCard(payment, true)}
                  </Reveal>
                ))}
              </div>
            )}
          </>
        ) : (
          <>
            {/* History Filters */}
            <Reveal delay={0.2} width="100%">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value as any)}
                  className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                >
                  <option value="all">All Status</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
                <input
                  type="text"
                  placeholder="Filter by student email"
                  value={filterStudent}
                  onChange={(e) => setFilterStudent(e.target.value)}
                  className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
                <input
                  type="date"
                  value={filterStartDate}
                  onChange={(e) => setFilterStartDate(e.target.value)}
                  className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
                <input
                  type="date"
                  value={filterEndDate}
                  onChange={(e) => setFilterEndDate(e.target.value)}
                  className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>
            </Reveal>

            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              </div>
            ) : historyPayments.length === 0 ? (
              <Reveal delay={0.3} width="100%">
                <Card className="text-center py-12">
                  <AlertCircle size={48} className="mx-auto mb-4 text-slate-400" />
                  <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
                    No payment history
                  </h3>
                  <p className="text-slate-600 dark:text-slate-400">
                    No processed payments match your filters
                  </p>
                </Card>
              </Reveal>
            ) : (
              <div className="space-y-4">
                {historyPayments.map((payment, index) => (
                  <Reveal key={payment.id} delay={index * 0.05} width="100%">
                    {renderPaymentCard(payment, false)}
                  </Reveal>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Image Modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50"
          onClick={() => setSelectedImage(null)}
        >
          <div className="max-w-2xl max-h-screen overflow-auto" onClick={e => e.stopPropagation()}>
            <img
              src={selectedImage}
              alt="Payment Proof"
              className="w-full h-auto rounded-lg"
            />
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute top-4 right-4 p-2 bg-white dark:bg-slate-800 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Rejection Modal */}
      {showRejectModal && selectedPayment && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md p-6 space-y-4">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
              Reject Payment Request
            </h2>
            <p className="text-slate-600 dark:text-slate-400">
              Payment of ${selectedPayment.total_amount} from {selectedPayment.student_email}
            </p>

            <textarea
              placeholder="Optional: Explain the rejection reason"
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400"
              rows={4}
            />

            <div className="flex gap-3">
              <Button
                onClick={() => setShowRejectModal(false)}
                className="flex-1 bg-slate-600 hover:bg-slate-700"
              >
                Cancel
              </Button>
              <Button
                onClick={handleReject}
                isLoading={processing}
                className="flex-1 bg-red-600 hover:bg-red-700"
              >
                Reject Payment
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default PaymentRequests;
