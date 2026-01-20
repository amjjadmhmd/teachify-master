import React, { useState } from 'react';
import { Course, Lang, ViewMode } from '../../types';
import { api } from '../../api/client';
import { Button, Card, Input } from '../../components/UI';
import { Reveal } from '../../components/Reveal';
import { ShoppingBag, ArrowLeft, Trash2, CreditCard, Lock, CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { usePayment } from '../../context/PaymentContext';

interface CartPaymentProps {
  cart: Course[];
  removeFromCart: (id: number) => void;
  clearCart: () => void;
  lang: Lang;
  refreshDashboard: () => void;
  setView: (v: ViewMode) => void;
}

const CartPayment: React.FC<CartPaymentProps> = ({ 
  cart, 
  removeFromCart, 
  clearCart, 
  lang, 
  refreshDashboard, 
  setView 
}) => {
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'manual'>('card');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const { isPendingForCourse } = usePayment();
  const isEn = lang === 'en';

  const total = cart.reduce((sum, item) => sum + (parseFloat(item.price) || 0), 0).toFixed(2);

  const handleCardPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // ✨ NEW: Check if any course has pending payment
    console.log('🛒 Cart Items:', cart);
    const pendingCourses = cart.filter(item => {
      const isPending = isPendingForCourse(item.id);
      console.log(`Checking course ${item.id} (${item.title}): isPending=${isPending}`);
      return isPending;
    });
    console.log('⏳ Pending Courses Found:', pendingCourses);
    
    if (pendingCourses.length > 0) {
      const courseNames = pendingCourses.map(c => c.title).join(', ');
      console.log('🔔 Showing toast for pending courses:', courseNames);
      toast.info(
        isEn 
          ? `You have submitted payment successfully for: ${courseNames}. It's pending from instructor approval.`
          : `تم إرسال الدفع بنجاح للـ: ${courseNames}. قيد الانتظار من معتمد الكورس.`,
        { duration: 5000 }
      );
      return; // Stop payment
    }

    setLoading(true);
    
    try {
      // Simulate card payment processing
      await new Promise(r => setTimeout(r, 2000));
      
      // Enroll in courses directly
      for (const item of cart) {
        await api.courses.enroll(item.id);
      }
      
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        clearCart();
        refreshDashboard();
        setView(ViewMode.DASHBOARD);
      }, 2500);
    } catch (err) {
      setError('Payment failed. Please try again.');
      setLoading(false);
    }
  };

  const handleManualPayment = () => {
    // ✨ NEW: Check if any course has pending payment before navigating
    console.log('🔵 handleManualPayment() called');
    console.log('🛒 Cart items in manual payment:', cart);
    console.log('Cart item IDs:', cart.map(c => c.id));
    
    const pendingCourses = cart.filter(item => {
      const isPending = isPendingForCourse(item.id);
      console.log(`  → Checking course ${item.id}: isPending=${isPending}`);
      return isPending;
    });
    
    console.log('⏳ Pending courses after filter:', pendingCourses);
    
    if (pendingCourses.length > 0) {
      const courseNames = pendingCourses.map(c => c.title).join(', ');
      console.log('🔔 About to show toast for:', courseNames);
      toast.info(
        isEn 
          ? `You have submitted payment successfully for: ${courseNames}. It's pending from instructor approval.`
          : `تم إرسال الدفع بنجاح للـ: ${courseNames}. قيد الانتظار من معتمد الكورس.`,
        { duration: 5000 }
      );
      console.log('✅ Toast should be visible now');
      return; // Stop navigation to payment submission
    }

    console.log('➡️ No pending courses, navigating to payment submission');
    // This would navigate to the payment submission page
    // The view would be changed in the parent component
    setView(ViewMode.PAYMENT_SUBMISSION);
  };

  if (success) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 animate-in zoom-in duration-500">
        <div className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center text-white mb-6 shadow-xl shadow-green-500/30">
          <CheckCircle size={48} />
        </div>
        <h2 className="text-4xl font-bold text-slate-900 dark:text-white mb-4">Payment Successful!</h2>
        <p className="text-lg text-slate-600 dark:text-slate-400 mb-8">You now have access to your courses.</p>
        <Button onClick={() => setView(ViewMode.DASHBOARD)} className="mt-8 px-8">
          Go to Dashboard
        </Button>
      </div>
    );
  }

  return (
    <div className="pt-32 sm:pt-40 pb-10 px-4 max-w-7xl mx-auto min-h-screen">
      <Reveal width="100%">
        <div className="flex items-center gap-4 mb-8">
          <button 
            onClick={() => setView(ViewMode.MARKETPLACE)} 
            className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-white/10 transition-colors text-slate-500"
          >
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Shopping Cart</h1>
        </div>
      </Reveal>

      {cart.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400">
          <ShoppingBag size={80} className="mb-6 opacity-20" />
          <h3 className="text-2xl font-bold mb-2">Cart is empty</h3>
          <Button onClick={() => setView(ViewMode.MARKETPLACE)}>Browse Courses</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className={`lg:col-span-2 space-y-4 ${loading ? 'opacity-50 pointer-events-none' : ''}`}>
            {cart.map((item, i) => (
              <Reveal key={item.id} delay={i * 0.1} width="100%">
                <Card className="flex flex-col sm:flex-row gap-4 items-center !p-4">
                  <img 
                    src={item.thumbnail} 
                    alt={item.title} 
                    className="w-full sm:w-32 h-32 sm:h-24 object-cover rounded-xl" 
                  />
                  <div className="flex-1">
                    <h3 className="font-bold text-slate-900 dark:text-white text-lg">{item.title}</h3>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className="text-xl font-bold text-slate-900 dark:text-white">${item.price}</span>
                    <button 
                      onClick={() => removeFromCart(item.id)}
                      disabled={loading}
                      className="text-red-500 text-xs flex gap-1 hover:text-red-600 disabled:opacity-50"
                    >
                      <Trash2 size={14} /> Remove
                    </button>
                  </div>
                </Card>
              </Reveal>
            ))}
          </div>

          {/* Payment Method Selection */}
          <div className="lg:col-span-1">
            <Reveal delay={0.2} width="100%">
              <Card className={`sticky top-40 !p-6 border-primary/20 shadow-primary/5 space-y-6 ${
                loading ? 'opacity-50 pointer-events-none' : ''
              }`}>
                <div>
                  <h3 className="text-xl font-bold mb-6 border-b border-slate-200 dark:border-white/10 pb-4 text-slate-900 dark:text-white">
                    Summary
                  </h3>
                  <div className="flex justify-between text-xl font-bold text-slate-900 dark:text-white mb-6">
                    <span>Total</span>
                    <span>${total}</span>
                  </div>
                </div>

                {error && (
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 flex gap-2">
                    <AlertCircle size={18} className="text-red-600 dark:text-red-400 flex-shrink-0" />
                    <p className="text-sm text-red-800 dark:text-red-300">{error}</p>
                  </div>
                )}

                {/* Payment Method Selector */}
                <div className="space-y-3">
                  <label className="block text-sm font-semibold text-slate-900 dark:text-white mb-3">
                    Payment Method
                  </label>

                  {/* Card Payment Option */}
                  <label className="flex items-start gap-3 p-3 border border-slate-200 dark:border-slate-700 rounded-lg cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <input
                      type="radio"
                      name="payment"
                      value="card"
                      checked={paymentMethod === 'card'}
                      onChange={() => setPaymentMethod('card')}
                      className="mt-1"
                    />
                    <div>
                      <p className="font-medium text-slate-900 dark:text-white">Card Payment</p>
                      <p className="text-xs text-slate-600 dark:text-slate-400">Instant enrollment</p>
                    </div>
                  </label>

                  {/* Manual Payment Option */}
                  <label className="flex items-start gap-3 p-3 border border-slate-200 dark:border-slate-700 rounded-lg cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <input
                      type="radio"
                      name="payment"
                      value="manual"
                      checked={paymentMethod === 'manual'}
                      onChange={() => setPaymentMethod('manual')}
                      className="mt-1"
                    />
                    <div>
                      <p className="font-medium text-slate-900 dark:text-white">Manual Payment</p>
                      <p className="text-xs text-slate-600 dark:text-slate-400">Pending instructor approval</p>
                    </div>
                  </label>
                </div>

                {/* Payment Form */}
                <form onSubmit={handleCardPayment} className="space-y-4">
                  {paymentMethod === 'card' ? (
                    <>
                      <Input 
                        label="Card Number" 
                        placeholder="0000 0000 0000 0000" 
                        required 
                      />
                      <div className="grid grid-cols-2 gap-4">
                        <Input 
                          label="Expiry" 
                          placeholder="MM/YY" 
                          required 
                        />
                        <Input 
                          label="CVC" 
                          placeholder="123" 
                          required 
                        />
                      </div>
                      <Button 
                        type="submit" 
                        className="w-full mt-4" 
                        isLoading={loading}
                      >
                        <Lock size={18} /> Pay ${total}
                      </Button>
                    </>
                  ) : (
                    <Button 
                      type="button" 
                      onClick={handleManualPayment}
                      className="w-full mt-4 bg-yellow-600 hover:bg-yellow-700"
                    >
                      <CreditCard size={18} /> Continue to Payment
                    </Button>
                  )}
                </form>

                {paymentMethod === 'manual' && (
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                    <p className="text-xs text-blue-800 dark:text-blue-300">
                      You'll be able to upload your payment proof on the next page
                    </p>
                  </div>
                )}
              </Card>
            </Reveal>
          </div>
        </div>
      )}
    </div>
  );
};

export default CartPayment;
