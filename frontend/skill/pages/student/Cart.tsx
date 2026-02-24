import React, { useState } from "react";
import { Course, Lang, ViewMode } from "../../types";
import { api } from "../../api/client";
import { Button, Card, Input } from "../../components/UI";
import { Reveal } from "../../components/Reveal";
import { ShoppingBag, ArrowLeft, Trash2, Lock, CheckCircle } from "lucide-react";

interface CartProps {
  cart: Course[];
  removeFromCart: (id: number) => void;
  clearCart: () => void;
  lang: Lang;
  refreshDashboard: () => void;
  setView: (v: ViewMode) => void;
}

const CartPage: React.FC<CartProps> = ({ cart, removeFromCart, clearCart, lang, refreshDashboard, setView }) => {
  const isEn = lang === "en";
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const total = cart.reduce((sum, item) => sum + (parseFloat(item.price) || 0), 0).toFixed(2);

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await new Promise((r) => setTimeout(r, 2000));
    try {
      for (const item of cart) {
        await api.courses.enroll(item.id);
      }
      setLoading(false);
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        clearCart();
        refreshDashboard();
        setView(ViewMode.DASHBOARD);
      }, 2500);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className={`min-h-screen flex flex-col items-center justify-center p-6 animate-in zoom-in duration-500 ${!isEn ? "rtl" : ""}`}>
        <div className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center text-white mb-6 shadow-xl shadow-green-500/30">
          <CheckCircle size={48} />
        </div>
        <h2 className="text-4xl font-bold text-slate-900 dark:text-white mb-4">
          {isEn ? "Payment Successful!" : "تم الدفع بنجاح!"}
        </h2>
        <Button onClick={() => setView(ViewMode.DASHBOARD)} className="mt-8 px-8">
          {isEn ? "Go to Dashboard" : "الانتقال للوحة التحكم"}
        </Button>
      </div>
    );
  }

  return (
    <div className={`pt-32 sm:pt-40 pb-10 px-4 max-w-7xl mx-auto min-h-screen ${!isEn ? "rtl" : ""}`}>
      <Reveal width="100%">
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => setView(ViewMode.MARKETPLACE)}
            className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-white/10 transition-colors text-slate-500"
          >
            <ArrowLeft size={24} className={!isEn ? "rotate-180" : ""} />
          </button>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
            {isEn ? "Shopping Cart" : "سلة المشتريات"}
          </h1>
        </div>
      </Reveal>

      {cart.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400">
          <ShoppingBag size={80} className="mb-6 opacity-20" />
          <h3 className="text-2xl font-bold mb-2">{isEn ? "Cart is empty" : "السلة فارغة"}</h3>
          <Button onClick={() => setView(ViewMode.MARKETPLACE)}>
            {isEn ? "Browse Courses" : "تصفح الكورسات"}
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            {cart.map((item, i) => (
              <Reveal key={item.id} delay={i * 0.1} width="100%">
                <Card className="flex flex-col sm:flex-row gap-4 items-center !p-4">
                  <img src={item.thumbnail} alt={item.title} className="w-full sm:w-32 h-32 sm:h-24 object-cover rounded-xl" />
                  <div className="flex-1">
                    <h3 className="font-bold text-slate-900 dark:text-white text-lg">{item.title}</h3>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className="text-xl font-bold text-slate-900 dark:text-white">${item.price}</span>
                    <button onClick={() => removeFromCart(item.id)} className="text-red-500 text-xs flex gap-1">
                      <Trash2 size={14} /> {isEn ? "Remove" : "إزالة"}
                    </button>
                  </div>
                </Card>
              </Reveal>
            ))}
          </div>
          <div className="lg:col-span-1">
            <Reveal delay={0.2} width="100%">
              <Card className="sticky top-40 !p-6 border-primary/20 shadow-primary/5">
                <h3 className="text-xl font-bold mb-6 border-b border-slate-200 dark:border-white/10 pb-4 text-slate-900 dark:text-white">
                  {isEn ? "Summary" : "الملخص"}
                </h3>
                <div className="flex justify-between text-xl font-bold text-slate-900 dark:text-white mb-6">
                  <span>{isEn ? "Total" : "الإجمالي"}</span>
                  <span>${total}</span>
                </div>
                <form onSubmit={handleCheckout} className="space-y-4">
                  <Input
                    label={isEn ? "Card Number" : "رقم البطاقة"}
                    placeholder={isEn ? "0000 0000 0000 0000" : "0000 0000 0000 0000"}
                    required
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <Input label={isEn ? "Expiry" : "تاريخ الانتهاء"} placeholder={isEn ? "MM/YY" : "MM/YY"} required />
                    <Input label={isEn ? "CVC" : "رمز CVC"} placeholder={isEn ? "123" : "123"} required />
                  </div>
                  <Button type="submit" className="w-full mt-4" isLoading={loading}>
                    <Lock size={18} /> {isEn ? `Pay $${total}` : `ادفع $${total}`}
                  </Button>
                </form>
              </Card>
            </Reveal>
          </div>
        </div>
      )}
    </div>
  );
};

export default CartPage;
