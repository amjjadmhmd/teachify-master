import React, { useState, useEffect, useMemo } from "react";
import { Course, Lang, ViewMode } from "../../types";
import { api } from "../../api/client";
import { Button } from "../../components/UI";
import { Reveal } from "../../components/Reveal";
import { ShoppingBag, Heart, MessageCircle, ArrowLeft, AlertCircle, Search } from "lucide-react";
import { resolveImageUrl, handleImageError } from "../../utils/imageUtils";
import { usePayment } from "../../context/PaymentContext";
import { toast } from "sonner";
import { getStaticCourses } from "../../utils/staticCourses";

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

const inferCategory = (title: string): string => {
  const t = title.toLowerCase();
  if (t.includes("drone") || t.includes("survey") || t.includes("مساح")) return "Surveying";
  if (t.includes("gis") || t.includes("arcgis")) return "GIS";
  if (t.includes("python") || t.includes("geoai") || t.includes("ai")) return "GeoAI";
  if (t.includes("remote") || t.includes("multispectral")) return "Remote Sensing";
  if (t.includes("laser")) return "Laser & Scanning";
  return "Specialized";
};

const Marketplace: React.FC<MarketplaceProps> = ({
  addToCart,
  toggleWishlist,
  wishlistIds,
  lang,
  showJoinButton,
  onJoinClick,
  onBack,
  onEnrolledCourseClick,
}) => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [addingToCart, setAddingToCart] = useState<{ [key: number]: boolean }>({});
  const isEn = lang === "en";

  const { isPendingForCourse, getPendingPaymentForCourse, isLoading: paymentLoading } = usePayment();

  useEffect(() => {
    api.courses
      .list()
      .then((apiCourses) => {
        const staticCourses = getStaticCourses().map((course) => ({
          ...course,
          is_enrolled: true,
        })) as Course[];
        const staticIds = new Set(staticCourses.map((course) => course.id));
        const mergedCourses = [
          ...staticCourses,
          ...apiCourses.filter((course) => !staticIds.has(course.id)),
        ];
        setCourses(mergedCourses);
      })
      .catch((error) => {
        console.error(error);
        setCourses(getStaticCourses() as Course[]);
      });
  }, []);

  const categories = useMemo(() => {
    const unique = new Set<string>(courses.map((c) => inferCategory(c.title || "")));
    return ["all", ...Array.from(unique)];
  }, [courses]);

  const filteredCourses = useMemo(() => {
    return courses.filter((course) => {
      const category = inferCategory(course.title || "");
      const categoryMatch = activeCategory === "all" || category === activeCategory;
      const searchMatch =
        !searchTerm.trim() ||
        course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (course.description || "").toLowerCase().includes(searchTerm.toLowerCase());
      return categoryMatch && searchMatch;
    });
  }, [courses, activeCategory, searchTerm]);

  const handleCourseClick = (course: Course) => {
    if (course.is_enrolled && onEnrolledCourseClick) {
      onEnrolledCourseClick(course);
    }
  };

  const handleAddToCart = async (course: Course) => {
    if (isPendingForCourse(course.id)) {
      const pendingPayment = getPendingPaymentForCourse(course.id);
      toast.warning(
        isEn
          ? `This course has a pending payment from ${new Date(pendingPayment?.submitted_at || new Date()).toLocaleDateString()}.`
          : `هذا الكورس له دفعة معلقة من ${new Date(pendingPayment?.submitted_at || new Date()).toLocaleDateString()}.`,
      );
      return;
    }

    setAddingToCart((prev) => ({ ...prev, [course.id]: true }));
    try {
      await api.payment.addToCart(course.id);
      addToCart(course);
      toast.success(isEn ? "Added to cart" : "تمت الإضافة إلى السلة");
    } catch (err: any) {
      console.error("Failed to add to cart:", err);
      toast.error(err?.response?.data?.detail || (isEn ? "Failed to add course to cart." : "فشلت إضافة الكورس إلى السلة."));
    } finally {
      setAddingToCart((prev) => ({ ...prev, [course.id]: false }));
    }
  };

  return (
    <div className={`pt-28 sm:pt-32 pb-10 px-4 max-w-7xl mx-auto ${!isEn ? "rtl" : ""}`}>
      <Reveal>
        <div className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 mb-8">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
            <div className="flex items-center gap-4">
              {onBack && (
                <button
                  onClick={onBack}
                  className="p-2 rounded-full hover:bg-slate-100 transition-colors text-slate-700"
                >
                  <ArrowLeft size={24} className={!isEn ? "rotate-180" : ""} />
                </button>
              )}
              <div>
                <h1 className="text-3xl font-black text-slate-900">{isEn ? "Course Catalog" : "كتالوج الكورسات"}</h1>
                <p className="text-slate-600 mt-1">
                  {isEn
                    ? "Structured categories and practical geospatial tracks."
                    : "تصنيفات واضحة ومسارات تدريبية عملية في المجال الجيومكاني."}
                </p>
              </div>
            </div>

            {showJoinButton && (
              <Button onClick={onJoinClick} className="!py-2.5 !px-5">
                <MessageCircle size={18} /> {isEn ? "Join Platform" : "انضم للمنصة"}
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="md:col-span-2 relative">
              <Search size={16} className="absolute top-1/2 -translate-y-1/2 left-3 text-slate-400" />
              <input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={isEn ? "Search courses..." : "ابحث عن كورس..."}
                className="w-full h-11 rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-eden-accent/25"
              />
            </div>
            <div className="h-11 rounded-xl border border-slate-200 bg-slate-50 flex items-center px-3 text-sm font-semibold text-slate-700">
              {isEn ? `${filteredCourses.length} courses found` : `تم العثور على ${filteredCourses.length} كورس`}
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mt-4">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setActiveCategory(category)}
                className={`px-3 py-1.5 text-xs font-bold rounded-full border transition-colors ${
                  activeCategory === category
                    ? "bg-eden-accent text-white border-eden-accent"
                    : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
                }`}
              >
                {category === "all" ? (isEn ? "All Categories" : "كل التصنيفات") : category}
              </button>
            ))}
          </div>
        </div>
      </Reveal>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCourses.map((course, i) => {
          const isPending = isPendingForCourse(course.id);
          const category = inferCategory(course.title || "");
          return (
            <Reveal key={course.id} delay={i * 0.05} width="100%">
              <div
                onClick={() => handleCourseClick(course)}
                className={`group bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col h-full ${
                  course.is_enrolled ? "cursor-pointer" : ""
                }`}
              >
                <div className="relative h-48 overflow-hidden bg-slate-100">
                  <img
                    src={resolveImageUrl(course.thumbnail)}
                    alt={course.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    onError={(e) => handleImageError(e, undefined, course.title)}
                  />
                  <div className="absolute top-3 left-3 flex gap-2">
                    <span className="px-2 py-1 rounded-full bg-white/95 text-slate-700 text-[10px] font-bold border border-slate-200">
                      {category}
                    </span>
                    {course.is_enrolled && (
                      <span className="px-2 py-1 rounded-full bg-emerald-600 text-white text-[10px] font-bold">
                        {isEn ? "Enrolled" : "مشترك"}
                      </span>
                    )}
                  </div>
                </div>

                <div className="p-5 flex-1 flex flex-col">
                  <h3 className="text-lg font-bold text-slate-900 mb-2 line-clamp-2">{course.title}</h3>
                  <p className="text-slate-500 text-sm mb-4 line-clamp-2">{course.description}</p>

                  <div className="mt-auto pt-4 border-t border-slate-100">
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-xl font-black text-eden-accent">${course.price}</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleWishlist(course);
                        }}
                        className={`p-2 rounded-full transition-colors ${
                          wishlistIds.includes(course.id)
                            ? "bg-red-500 text-white"
                            : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                        }`}
                        title={isEn ? "Save" : "حفظ"}
                      >
                        <Heart size={16} fill={wishlistIds.includes(course.id) ? "currentColor" : "none"} />
                      </button>
                    </div>

                    {course.is_enrolled ? (
                      <Button
                        onClick={() => handleCourseClick(course)}
                        className="w-full !py-2.5 text-xs"
                      >
                        {isEn ? "Open Course" : "فتح الكورس"}
                      </Button>
                    ) : (
                      <div className="space-y-2">
                        {isPending && (
                          <div className="text-yellow-700 text-xs flex items-center gap-1">
                            <AlertCircle size={14} />
                            <span>{isEn ? "Payment pending approval" : "الدفع معلق بانتظار الموافقة"}</span>
                          </div>
                        )}
                        <Button
                          onClick={() => handleAddToCart(course)}
                          disabled={addingToCart[course.id] || isPending || paymentLoading}
                          isLoading={addingToCart[course.id]}
                          className={`w-full !py-2.5 text-xs ${isPending ? "!bg-yellow-600 hover:!bg-yellow-700" : ""}`}
                        >
                          {addingToCart[course.id]
                            ? isEn
                              ? "Adding..."
                              : "جارٍ الإضافة..."
                            : isPending
                              ? isEn
                                ? "Pending"
                                : "معلق"
                              : isEn
                                ? "Add to Cart"
                                : "أضف للسلة"}
                          {!isPending && !addingToCart[course.id] && <ShoppingBag size={14} className="ml-2" />}
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
