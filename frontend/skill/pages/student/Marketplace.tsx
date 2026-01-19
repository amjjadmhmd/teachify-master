import React, { useState, useEffect } from "react";
import { Course, Lang, ViewMode } from "../../types";
import { api } from "../../api/client";
import { Button } from "../../components/UI";
import { Reveal } from "../../components/Reveal";
import { ShoppingBag, Heart, MessageCircle, ArrowLeft } from "lucide-react";
import { resolveImageUrl, handleImageError } from "../../utils/imageUtils";

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

  // Track payment request status for each course
  const [paymentRequestStatus, setPaymentRequestStatus] = useState<{[key: number]: 'pending' | 'approved' | 'rejected'}>({});
  // Fallback: Track which courses are in cart (for before payment submission)
  const [cartCourseIds, setCartCourseIds] = useState<number[]>([]);

  useEffect(() => {
    api.courses.list().then(setCourses).catch(console.error);
    
    // Fetch payment requests and cart items on mount
    fetchPaymentStatus();
  }, []);

  const fetchPaymentStatus = async () => {
    try {
      // Try to use the main endpoint which filters by student automatically
      // GET /api/courses/payment-requests/ returns only student's own requests
      const apiClient = (await import('../../api/config')).default;
      const response = await apiClient.get('/api/courses/payment-requests/');
      const paymentRequests = Array.isArray(response.data) ? response.data : response.data?.results || [];
      
      console.log('Payment Requests Raw:', paymentRequests);
      
      // Build map of course -> payment status
      const statusMap: {[key: number]: 'pending' | 'approved' | 'rejected'} = {};
      
      console.log('Payment Requests Array:', paymentRequests);
      
      // Sort by submitted date (newest first) for better UX
      const sortedRequests = [...paymentRequests].sort((a, b) => {
        const dateA = new Date(a.submitted_at).getTime();
        const dateB = new Date(b.submitted_at).getTime();
        return dateB - dateA; // Newest first
      });

      sortedRequests.forEach((request: any) => {
        console.log('Processing request:', request.id, 'Status:', request.status, 'Courses:', request.courses, 'Date:', request.submitted_at);
        // Only consider non-approved requests (approved means already enrolled)
        if (request.status === 'pending' || request.status === 'rejected') {
          const courses = request.courses || [];
          console.log('Adding to status map - courses:', courses);
          courses.forEach((courseId: number) => {
            // Smart priority: 
            // 1. PENDING always takes priority (most actionable)
            // 2. REJECTED only if no pending exists
            // 3. Use newest request for that course
            if (!statusMap[courseId]) {
              // First time seeing this course
              statusMap[courseId] = request.status;
              console.log(`Mapped course ${courseId} -> ${request.status} (first time)`);
            } else if (request.status === 'pending' && statusMap[courseId] !== 'pending') {
              // Found a pending, replace rejected
              statusMap[courseId] = request.status;
              console.log(`Mapped course ${courseId} -> ${request.status} (prioritized pending)`);
            }
            // If current is rejected and we already have pending, skip
            // This ensures pending is always shown
          });
        }
      });
      
      console.log('Final Status Map:', statusMap);
      setPaymentRequestStatus(statusMap);
      
      // Also fetch cart items as fallback (for courses added but not yet submitted)
      fetchCartItems();
    } catch (err) {
      console.error('Failed to fetch payment status:', err);
      // Fallback to cart items only
      fetchCartItems();
    }
  };

  const fetchCartItems = async () => {
    try {
      const cartItems = await api.payment.getCart();
      const courseIds = cartItems.map((item: any) => item.course);
      setCartCourseIds(courseIds);
    } catch (err) {
      console.error('Failed to fetch cart items:', err);
    }
  };

  // Expose refresh method for external calls (e.g., when payment is rejected)
  const refreshCart = async () => {
    await fetchPaymentStatus();
  };

  // Call parent callback when status is refreshed
  useEffect(() => {
    if (onRefreshCart) {
      onRefreshCart();
    }
  }, [paymentRequestStatus, cartCourseIds, onRefreshCart]);

  // Handle clicking on an enrolled course to open CoursePlayer
  const handleCourseClick = (course: Course) => {
    if (course.is_enrolled && onEnrolledCourseClick) {
      onEnrolledCourseClick(course);
    }
  };

  // Handle add to cart with loading state
  const handleAddToCart = async (course: Course) => {
    setAddingToCart(prev => ({ ...prev, [course.id]: true }));
    try {
      await api.payment.addToCart(course.id);
      addToCart(course);
      
      // Fetch fresh cart state from backend to ensure sync
      await fetchCartItems();
    } catch (err) {
      console.error('Failed to add to cart:', err);
      alert('Failed to add course to cart. Please try again.');
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
          const isPending = paymentRequestStatus[course.id] === 'pending' || cartCourseIds.includes(course.id);
          const paymentStatus = paymentRequestStatus[course.id];
          console.log(`Course ${course.id}: is_enrolled=${course.is_enrolled}, paymentStatus=${paymentStatus}, isPending=${isPending}`);
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
                   {(paymentRequestStatus[course.id] === 'pending' || !course.is_enrolled) && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!paymentRequestStatus[course.id]) {
                            handleAddToCart(course);
                          }
                        }}
                        disabled={addingToCart[course.id] || paymentRequestStatus[course.id] === 'pending' || cartCourseIds.includes(course.id)}
                        title={paymentRequestStatus[course.id] === 'pending' ? (isEn ? "Payment pending - awaiting approval" : "الدفع قيد الانتظار - في انتظار الموافقة") : cartCourseIds.includes(course.id) ? (isEn ? "Payment pending - awaiting approval" : "الدفع قيد الانتظار - في انتظار الموافقة") : ""}
                        className={`p-2 rounded-full transition-all ${
                          addingToCart[course.id]
                            ? 'bg-blue-500 text-white scale-110'
                            : paymentRequestStatus[course.id] === 'pending' || cartCourseIds.includes(course.id)
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
                   {(paymentRequestStatus[course.id] === 'pending' || !course.is_enrolled) && (
                     <Button
                       onClick={() => {
                         if (!paymentRequestStatus[course.id]) {
                           handleAddToCart(course);
                         }
                       }}
                       disabled={addingToCart[course.id] || paymentRequestStatus[course.id] === 'pending' || cartCourseIds.includes(course.id)}
                       isLoading={addingToCart[course.id]}
                       className={`!py-2 !px-4 text-xs transition-colors ${
                         paymentRequestStatus[course.id] === 'pending' || cartCourseIds.includes(course.id) ? '!bg-yellow-600 hover:!bg-yellow-700' : ''
                       }`}
                     >
                       {addingToCart[course.id]
                         ? (isEn ? "Adding..." : "جاري الإضافة...")
                         : paymentRequestStatus[course.id] === 'pending' || cartCourseIds.includes(course.id)
                         ? (isEn ? "⏳ Pending" : "⏳ قيد الانتظار")
                         : (isEn ? "Add to Cart" : "أضف للسلة")}
                     </Button>
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
