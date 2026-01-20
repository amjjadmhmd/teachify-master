import React, { useState, useRef } from 'react';
import { Lang, ViewMode } from '../../types';
import { api } from '../../api/client';
import apiClient from '../../api/config';
import { Button, Card, Input } from '../../components/UI';
import { Reveal } from '../../components/Reveal';
import { ArrowLeft, Upload, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { usePayment } from '../../context/PaymentContext';

interface CartItem {
  id: number;
  course: number;
  course_title: string;
  course_price: string;
  course_thumbnail?: string;
  added_at: string;
}

interface PaymentSubmissionProps {
  cartItems: CartItem[];
  totalAmount: number;
  lang: Lang;
  setView: (v: ViewMode) => void;
  refreshCart: () => void;
}

const PaymentSubmission: React.FC<PaymentSubmissionProps> = ({
  cartItems,
  totalAmount,
  lang,
  setView,
  refreshCart
}) => {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { isPendingForCourse } = usePayment();
  const isEn = lang === 'en';

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('Image size must be less than 5MB');
        return;
      }

      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('Please upload a valid image file');
        return;
      }

      setImage(file);
      setError('');

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!image) {
      setError('Please upload payment proof image');
      return;
    }

    if (cartItems.length === 0) {
      setError('Cart is empty');
      return;
    }

    // ✨ NEW: Check if any course has pending payment before submitting
    const pendingCourses = cartItems.filter(item => isPendingForCourse(item.course));
    
    if (pendingCourses.length > 0) {
      const courseNames = pendingCourses.map(c => c.course_title).join(', ');
      toast.info(
        isEn 
          ? `You have submitted payment successfully for: ${courseNames}. It's pending from instructor approval.`
          : `تم إرسال الدفع بنجاح للـ: ${courseNames}. قيد الانتظار من معتمد الكورس.`,
        { duration: 5000 }
      );
      return; // Stop form submission
    }

    setLoading(true);

    try {
      const formData = new FormData();
      // Append each course ID separately for proper array handling
      cartItems.forEach(item => {
        formData.append('courses', item.course.toString());
      });
      formData.append('total_amount', totalAmount.toString());
      formData.append('payment_proof_image', image);

      const response = await apiClient.post('/api/courses/payment-requests/', formData);

      setSuccess(true);
      
      // ✨ NEW: Show success toast with course names
      const courseNames = cartItems.map(c => c.course_title).join(', ');
      toast.success(
        isEn
          ? `Payment submitted successfully for: ${courseNames}. It's pending from instructor approval.`
          : `تم إرسال الدفع بنجاح للـ: ${courseNames}. قيد الانتظار من معتمد الكورس.`
      );

      setTimeout(() => {
        setSuccess(false);
        refreshCart();
        setView(ViewMode.DASHBOARD);
      }, 3000);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to submit payment request');
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 animate-in zoom-in duration-500">
        <div className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center text-white mb-6 shadow-xl shadow-green-500/30">
          <CheckCircle size={48} />
        </div>
        <h2 className="text-4xl font-bold text-slate-900 dark:text-white mb-4 text-center">Payment Submitted!</h2>
        <p className="text-lg text-slate-600 dark:text-slate-400 mb-6 text-center max-w-md">
          Your payment proof has been submitted. Please wait for instructor approval.
        </p>
        <Button onClick={() => setView(ViewMode.DASHBOARD)} className="mt-8 px-8">
          Go to Dashboard
        </Button>
      </div>
    );
  }

  return (
    <div className="pt-32 sm:pt-40 pb-10 px-4 max-w-4xl mx-auto min-h-screen relative">
      {/* Submitting Overlay */}
      {loading && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-800 rounded-xl p-8 text-center shadow-2xl">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-slate-200 border-t-primary mx-auto mb-4"></div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
              Submitting Payment
            </h3>
            <p className="text-slate-600 dark:text-slate-400 text-sm">
              Please wait, do not refresh or close this window
            </p>
          </div>
        </div>
      )}

      <Reveal width="100%">
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => setView(ViewMode.MARKETPLACE)}
            className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-white/10 transition-colors text-slate-500"
          >
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Payment Submission</h1>
        </div>
      </Reveal>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Form */}
        <div className="lg:col-span-2">
          <Reveal delay={0.1} width="100%">
            <Card className="!p-6 space-y-6">
              {/* Instructions */}
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <div className="flex gap-3">
                  <AlertCircle size={20} className="text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-blue-900 dark:text-blue-200 mb-1">Payment Instructions</h3>
                    <p className="text-sm text-blue-800 dark:text-blue-300">
                      Contact your instructor to get the wallet number for payment. After making the payment, upload the proof image below.
                    </p>
                  </div>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex gap-3">
                  <AlertCircle size={20} className="text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-800 dark:text-red-300">{error}</p>
                </div>
              )}

              {/* Image Upload */}
              <div>
                <label className="block text-sm font-semibold text-slate-900 dark:text-white mb-3">
                  Payment Proof Image *
                </label>
                <div
                  className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                    loading
                      ? 'border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800/50 cursor-not-allowed opacity-50'
                      : 'border-slate-300 dark:border-slate-600 cursor-pointer hover:border-primary hover:bg-primary/5'
                  }`}
                  onClick={() => !loading && fileInputRef.current?.click()}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    disabled={loading}
                    className="hidden"
                  />

                  {imagePreview ? (
                    <div>
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="w-full max-h-64 object-contain mx-auto mb-4 rounded-lg"
                      />
                      <p className="text-sm text-slate-600 dark:text-slate-400">Click to change image</p>
                    </div>
                  ) : (
                    <div>
                      <Upload size={40} className="mx-auto mb-2 text-slate-400" />
                      <p className="text-slate-900 dark:text-white font-medium mb-1">
                        Click to upload or drag and drop
                      </p>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        PNG, JPG, GIF up to 5MB
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                onClick={handleSubmit}
                disabled={!image || cartItems.length === 0 || loading}
                isLoading={loading}
                className="w-full"
              >
                {loading ? 'Submitting Payment...' : 'Submit Payment Request'}
              </Button>
            </Card>
          </Reveal>
        </div>

        {/* Summary Sidebar */}
         <div className="lg:col-span-1">
           <Reveal delay={0.2} width="100%">
             <Card className={`sticky top-40 !p-6 border-primary/20 shadow-primary/5 space-y-6 ${
               loading ? 'opacity-50 pointer-events-none' : ''
             }`}>
              <div>
                <h3 className="text-xl font-bold mb-4 border-b border-slate-200 dark:border-white/10 pb-4 text-slate-900 dark:text-white">
                  Summary
                </h3>

                {/* Course List */}
                <div className="space-y-3 mb-6">
                  {cartItems.map((item) => (
                    <div key={item.id} className="text-sm">
                      <p className="font-medium text-slate-900 dark:text-white truncate">
                        {item.course_title}
                      </p>
                      <p className="text-slate-600 dark:text-slate-400">${item.course_price}</p>
                    </div>
                  ))}
                </div>

                {/* Divider */}
                <div className="border-t border-slate-200 dark:border-white/10 pt-4 space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600 dark:text-slate-400">Subtotal</span>
                    <span className="font-medium text-slate-900 dark:text-white">${totalAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold text-slate-900 dark:text-white">
                    <span>Total</span>
                    <span>${totalAmount.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Status Badge */}
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3 flex gap-2">
                <Clock size={18} className="text-yellow-600 dark:text-yellow-400 flex-shrink-0" />
                <div className="text-sm">
                  <p className="font-medium text-yellow-900 dark:text-yellow-200">Pending Review</p>
                  <p className="text-xs text-yellow-800 dark:text-yellow-300">Awaiting instructor approval</p>
                </div>
              </div>
            </Card>
          </Reveal>
        </div>
      </div>
    </div>
  );
};

export default PaymentSubmission;
