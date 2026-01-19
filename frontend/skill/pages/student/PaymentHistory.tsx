import React, { useState, useEffect } from 'react';
import { Lang } from '../../types';
import { api } from '../../api/client';
import { Card } from '../../components/UI';
import { Reveal } from '../../components/Reveal';
import {
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  Download,
  Calendar,
  DollarSign,
  AlertCircle,
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
  processed_by?: number;
  processed_by_email?: string;
}

interface PaymentHistoryProps {
  lang: Lang;
}

const PaymentHistory: React.FC<PaymentHistoryProps> = ({ lang }) => {
  const [payments, setPayments] = useState<PaymentRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const response = await api.get('/courses/payment-requests/my-history/');
      setPayments(response.data);
    } catch (err) {
      console.error('Failed to fetch payment history:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredPayments = payments.filter(
    payment => filterStatus === 'all' || payment.status === filterStatus
  );

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock size={20} className="text-yellow-500" />;
      case 'approved':
        return <CheckCircle size={20} className="text-green-500" />;
      case 'rejected':
        return <XCircle size={20} className="text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800';
      case 'approved':
        return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800';
      case 'rejected':
        return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800';
      default:
        return '';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Pending Review';
      case 'approved':
        return 'Approved';
      case 'rejected':
        return 'Rejected';
      default:
        return status;
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

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <Reveal width="100%">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-2">Payment History</h1>
            <p className="text-slate-600 dark:text-slate-400">
              View all your payment submissions and their status
            </p>
          </div>
        </Reveal>

        {/* Filter Buttons */}
        <Reveal delay={0.1} width="100%">
          <div className="flex flex-wrap gap-3 mb-8">
            {(['all', 'pending', 'approved', 'rejected'] as const).map((status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filterStatus === status
                    ? 'bg-primary text-white'
                    : 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>
        </Reveal>

        {/* Payment List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          </div>
        ) : filteredPayments.length === 0 ? (
          <Reveal delay={0.2} width="100%">
            <Card className="text-center py-12">
              <AlertCircle size={48} className="mx-auto mb-4 text-slate-400" />
              <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
                No payment requests found
              </h3>
              <p className="text-slate-600 dark:text-slate-400">
                {filterStatus === 'all'
                  ? 'You haven\'t submitted any payments yet'
                  : `No ${filterStatus} payments found`}
              </p>
            </Card>
          </Reveal>
        ) : (
          <div className="space-y-4">
            {filteredPayments.map((payment, index) => (
              <Reveal key={payment.id} delay={index * 0.05} width="100%">
                <Card className={`p-6 border ${getStatusColor(payment.status)}`}>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {/* Status and ID */}
                    <div className="col-span-1">
                      <div className="flex items-center gap-2 mb-2">
                        {getStatusIcon(payment.status)}
                        <span className="font-semibold text-slate-900 dark:text-white">
                          {getStatusText(payment.status)}
                        </span>
                      </div>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        Request #{payment.id}
                      </p>
                    </div>

                    {/* Amount */}
                    <div className="col-span-1">
                      <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Amount</p>
                      <p className="text-2xl font-bold text-slate-900 dark:text-white">
                        ${parseFloat(payment.total_amount).toFixed(2)}
                      </p>
                    </div>

                    {/* Dates */}
                    <div className="col-span-1">
                      <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Submitted</p>
                      <p className="font-medium text-slate-900 dark:text-white text-sm">
                        {formatDate(payment.submitted_at)}
                      </p>
                      {payment.processed_at && (
                        <>
                          <p className="text-sm text-slate-600 dark:text-slate-400 mt-2 mb-1">
                            Processed
                          </p>
                          <p className="font-medium text-slate-900 dark:text-white text-sm">
                            {formatDate(payment.processed_at)}
                          </p>
                        </>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="col-span-1 flex items-center justify-end gap-2">
                      <button
                        onClick={() => setSelectedImage(payment.payment_proof_url)}
                        className="p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors text-slate-600 dark:text-slate-400"
                        title="View payment proof"
                      >
                        <Eye size={20} />
                      </button>
                      <a
                        href={payment.payment_proof_url}
                        download
                        className="p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors text-slate-600 dark:text-slate-400"
                        title="Download payment proof"
                      >
                        <Download size={20} />
                      </a>
                    </div>
                  </div>

                  {/* Courses and Rejection Reason */}
                  <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-600">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
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

                      {payment.status === 'rejected' && payment.rejection_reason && (
                        <div className="bg-red-100 dark:bg-red-900/30 p-3 rounded-lg">
                          <p className="text-sm text-red-900 dark:text-red-200 font-medium mb-1">
                            Rejection Reason
                          </p>
                          <p className="text-sm text-red-800 dark:text-red-300">
                            {payment.rejection_reason}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              </Reveal>
            ))}
          </div>
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
    </div>
  );
};

export default PaymentHistory;
