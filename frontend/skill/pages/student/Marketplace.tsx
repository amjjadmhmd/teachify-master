import React, { useState, useEffect } from "react";
import { Course, Lang, ViewMode } from "../../types";
import { api } from "../../api/client";
import { Button } from "../../components/UI";
import { Reveal } from "../../components/Reveal";
import { ShoppingBag, Heart, MessageCircle, ArrowLeft, AlertCircle } from "lucide-react";
import { resolveImageUrl, handleImageError } from "../../utils/imageUtils";
import { usePayment } from "../../context/PaymentContext";
import { toast } from "sonner";

interface MarketplaceProps {
  addToCart: (c: Course) => void;
  toggleWishlist: (c: Course) => void;
  wishlistIds: number[];
  lang: Lang;
  showJoinButton?: boolean;
  onJoinClick?: () => void;
  onBack?: () => void;
  setView?: (view: ViewMode) => void;
  onEnrolledCourseClick?: (course: Course) => void;
  onRefreshCart?: () => void;
}

const Marketplace: React.FC<MarketplaceProps> = ({
  addToCart,
  toggleWishlist,
  wishlistIds,
  lang,
  showJoinButton,
  onJoinClick,
  onBack,
  setView,
  onEnrolledCourseClick,
  onRefreshCart,
}) => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [addingToCart, setAddingToCart] = useState<{[key: number]: boolean}>({});
  const isEn = lang === "en";

  // ✨ NEW: Use PaymentContext to check for pending payments
  const { isPendingForCourse, getPendingPaymentForCourse, isLoading: paymentLoading } = usePayment();

  useEffect(() => {
    api.courses.list().then(setCourses).catch(console.error);
  }, []);

  // Handle clicking on an enrolled course to open CoursePlayer
  const handleCourseClick = (course: Course) => {
    if (course.is_enrolled && onEnrolledCourseClick) {
      onEnrolledCourseClick(course);
    }
  };

  // Handle add to cart with payment check
  const handleAddToCart = async (course: Course) => {
    // ✨ Check if course has pending payment using PaymentContext
    if (isPendingForCourse(course.id)) {
      const pendingPayment = getPendingPaymentForCourse(course.id);
      toast.warning(
        `This course has a pending payment submitted on ${new Date(
          pendingPayment?.submitted_at || new Date()
        ).toLocaleDateString()}. Please check your Payment History for status.`
      );
      return;
    }

    setAddingToCart(prev => ({ ...prev, [course.id]: true }));
    try {
      await api.payment.addToCart(course.id);
      addToCart(course);
      toast.success('Added to cart');
    } catch (err: any) {
      console.error('Failed to add to cart:', err);
      toast.error(
        err?.response?.data?.detail || 'Failed to add course to cart. Please try again.'
      );
    } finally {
      setAddingToCart(prev => ({ ...prev, [course.id]: false }));
    }
  };

  return (
    <div className="pt-32 sm:pt-40 pb-10 px-4 max-w-7xl mx-auto">
      <Reveal>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div className="flex items-center gap-4">
            {onBack && (
              <button
                onClick={onBack}
                className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-white/10 transition-colors text-slate-700 dark:text-white"
              >
                <ArrowLeft size={24} className={!isEn ? "rotate-180" : ""} />
              </button>
            )}
            <h1 className="text-3xl font-display font-bold text-slate-900 dark:text-white">
              {isEn ? "Explore Courses" : "تصفح الكورسات"}
            </h1>
          </div>

          {showJoinButton && (
            <Button onClick={onJoinClick} className="!py-2.5 !px-5 shadow-neon">
              <MessageCircle size={18} />{" "}
              {isEn ? "Join Platform" : "انضم للمنصة"}
            </Button>
          )}
        </div>
      </Reveal>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {courses.map((course, i) => {
          const isPending = isPendingForCourse(course.id);
          return (
          <Reveal key={course.id} delay={i * 0.1} width="100%">
            <div
              onClick={() => handleCourseClick(course)}
              className={`group bg-white dark:bg-[#0F383D]/60 border border-slate-200 dark:border-white/10 rounded-2xl overflow-hidden shadow-lg hover:-translate-y-1 transition-all duration-300 flex flex-col h-full ${
                course.is_enrolled ? "cursor-pointer" : ""
              }`}
            >
              <div className="relative h-48 overflow-hidden bg-slate-200 dark:bg-slate-700">
                <img
                  src={resolveImageUrl(course.thumbnail)}
                  alt={course.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  onError={(e) => handleImageError(e, undefined, course.title)}
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                   {(!course.is_enrolled) && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAddToCart(course);
                        }}
                        disabled={addingToCart[course.id] || isPending}
                        title={isPending ? (isEn ? "Payment pending - awaiting approval" : "الدفع قيد الانتظار - في انتظار الموافقة") : ""}
                        className={`p-2 rounded-full transition-all ${
                          addingToCart[course.id]
                            ? 'bg-blue-500 text-white scale-110'
                            : isPending
                            ? 'bg-yellow-600 text-white cursor-not-allowed'
                            : 'bg-white text-slate-900 hover:scale-110'
                        }`}
                      >
                        <ShoppingBag size={20} />
                      </button>
                    )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleWishlist(course);
                    }}
                    className={`p-2 rounded-full hover:scale-110 transition-transform ${
                      wishlistIds.includes(course.id)
                        ? "bg-red-500 text-white"
                        : "bg-white text-slate-900"
                    }`}
                  >
                    <Heart
                      size={20}
                      fill={
                        wishlistIds.includes(course.id)
                          ? "currentColor"
                          : "none"
                      }
                    />
                  </button>
                </div>
              </div>
              <div className="p-5 flex-1 flex flex-col">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                  {course.title}
                </h3>
                <p className="text-slate-500 text-sm mb-4 line-clamp-2">
                  {course.description}
                </p>
                <div className="mt-auto flex justify-between items-center pt-4 border-t border-slate-100 dark:border-white/10">
                  <span className="text-2xl font-bold text-primary">
                    ${course.price}
                  </span>
                  {!course.is_enrolled && (
                    <div className="flex items-center gap-2">
                      {isPendingForCourse(course.id) && (
                        <div className="text-yellow-600 dark:text-yellow-500 text-xs flex items-center gap-1">
                          <AlertCircle size={16} />
                          <span>{isEn ? "Payment Pending" : "دفع قيد الانتظار"}</span>
                        </div>
                      )}
                      <Button
                        onClick={() => handleAddToCart(course)}
                        disabled={
                          addingToCart[course.id] ||
                          isPendingForCourse(course.id) ||
                          paymentLoading
                        }
                        isLoading={addingToCart[course.id]}
                        className={`!py-2 !px-4 text-xs transition-colors ${
                          isPendingForCourse(course.id) ? '!bg-yellow-600 hover:!bg-yellow-700' : ''
                        }`}
                      >
                        {addingToCart[course.id]
                          ? (isEn ? "Adding..." : "جاري الإضافة...")
                          : isPendingForCourse(course.id)
                          ? (isEn ? "⏳ Pending" : "⏳ قيد الانتظار")
                          : (isEn ? "Add to Cart" : "أضف للسلة")}
                      </Button>
                    </div>
                  )}
                </div>
              </div>
              </div>
              </Reveal>
              );
              })}
              </div>
    </div>
  );
};

export default Marketplace;
