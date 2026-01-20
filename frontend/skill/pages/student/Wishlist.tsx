import React from "react";
import { WishlistItem, Lang, ViewMode } from "../../types";
import { Button } from "../../components/UI";
import { Reveal } from "../../components/Reveal";
import { Heart, ShoppingBag, ArrowLeft } from "lucide-react";
import { resolveImageUrl, handleImageError } from "../../utils/imageUtils";

interface WishlistProps {
  items: WishlistItem[];
  onRemove: (courseId: number) => void;
  onAddToCart: (courseId: number, courseTitle: string, price: number, thumbnail: string) => void;
  lang: Lang;
  onBack: () => void;
  setView: (view: ViewMode) => void;
}

const Wishlist: React.FC<WishlistProps> = ({
  items,
  onRemove,
  onAddToCart,
  lang,
  onBack,
  setView,
}) => {
  const isEn = lang === "en";

  if (items.length === 0) {
    return (
      <div className="pt-32 sm:pt-40 pb-10 px-4 max-w-7xl mx-auto">
        <Reveal>
          <button
            onClick={onBack}
            className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-white/10 transition-colors text-slate-700 dark:text-white mb-8"
          >
            <ArrowLeft size={24} className={!isEn ? "rotate-180" : ""} />
          </button>
        </Reveal>
        <Reveal>
          <div className="text-center py-20">
            <Heart size={64} className="mx-auto mb-4 text-slate-300" />
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
              {isEn ? "Your Wishlist is Empty" : "قائمتك المفضلة فارغة"}
            </h2>
            <p className="text-slate-600 dark:text-slate-400 mb-8">
              {isEn
                ? "Start adding courses to your wishlist!"
                : "ابدأ بإضافة كورسات إلى قائمتك المفضلة!"}
            </p>
            <Button onClick={() => setView(ViewMode.MARKETPLACE)}>
              {isEn ? "Explore Courses" : "تصفح الكورسات"}
            </Button>
          </div>
        </Reveal>
      </div>
    );
  }

  return (
    <div className="pt-32 sm:pt-40 pb-10 px-4 max-w-7xl mx-auto">
      <Reveal>
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={onBack}
            className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-white/10 transition-colors text-slate-700 dark:text-white"
          >
            <ArrowLeft size={24} className={!isEn ? "rotate-180" : ""} />
          </button>
          <h1 className="text-3xl font-display font-bold text-slate-900 dark:text-white">
            {isEn ? "My Wishlist" : "قائمتي المفضلة"}
          </h1>
          <span className="ml-auto text-lg text-slate-600 dark:text-slate-400">
            {items.length} {isEn ? "items" : "عنصر"}
          </span>
        </div>
      </Reveal>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {items.map((item, i) => (
          <Reveal key={item.id} delay={i * 0.1} width="100%">
            <div className="bg-white dark:bg-[#0F383D]/60 border border-slate-200 dark:border-white/10 rounded-2xl overflow-hidden shadow-lg hover:-translate-y-1 transition-all duration-300 flex flex-col h-full">
              <div className="relative h-48 overflow-hidden bg-slate-200 dark:bg-slate-700">
                <img
                  src={resolveImageUrl(item.course_thumbnail)}
                  alt={item.course_title}
                  className="w-full h-full object-cover"
                  onError={(e) => handleImageError(e, undefined, item.course_title)}
                />
              </div>
              <div className="p-5 flex-1 flex flex-col">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                  {item.course_title}
                </h3>
                <div className="mt-auto flex justify-between items-center pt-4 border-t border-slate-100 dark:border-white/10">
                  <span className="text-2xl font-bold text-primary">
                    ${item.course_price}
                  </span>
                  <div className="flex gap-2">
                    {/* <button
                      onClick={() =>
                        onAddToCart(
                          item.course,
                          item.course_title,
                          item.course_price,
                          item.course_thumbnail
                        )
                      }
                      className="bg-primary text-white p-2 rounded-full hover:scale-110 transition-transform"
                      title={isEn ? "Add to Cart" : "أضف للسلة"}
                    >
                      <ShoppingBag size={20} />
                    </button> */}
                    <button
                      onClick={() => onRemove(item.course)}
                      className="bg-red-500 text-white p-2 rounded-full hover:scale-110 transition-transform"
                      title={isEn ? "Remove from Wishlist" : "إزالة من المفضلة"}
                    >
                      <Heart size={20} fill="currentColor" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </Reveal>
        ))}
      </div>
    </div>
  );
};

export default Wishlist;
