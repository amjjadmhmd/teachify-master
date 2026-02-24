import React from "react";
import { WishlistItem, Lang, ViewMode } from "../../types";
import { Button } from "../../components/UI";
import { Reveal } from "../../components/Reveal";
import { Heart } from "lucide-react";
import { resolveImageUrl, handleImageError } from "../../utils/imageUtils";

interface WishlistProps {
  items: WishlistItem[];
  onRemove: (courseId: number) => void;
  onAddToCart: (
    courseId: number,
    courseTitle: string,
    price: number,
    thumbnail: string
  ) => void;
  lang: Lang;
  onBack: () => void;
  setView: (view: ViewMode) => void;
}

const Wishlist: React.FC<WishlistProps> = ({
  items,
  onRemove,
  onAddToCart,
  lang,
  setView,
}) => {
  const isEn = lang === "en";

  if (items.length === 0) {
    return (
      <div className="pt-24 sm:pt-28 pb-10 px-4 max-w-7xl mx-auto">
        <Reveal>
          <div className="text-center py-8 sm:py-10">
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
            <div className="bg-white dark:bg-black/80 border border-slate-200 dark:border-white/10 rounded-2xl overflow-hidden shadow-lg hover:-translate-y-1 transition-all duration-300 flex flex-col h-full">
              <div className="relative h-48 overflow-hidden bg-slate-200 dark:bg-slate-700">
                <img
                  src={resolveImageUrl(item.course_thumbnail)}
                  alt={item.course_title}
                  className="w-full h-full object-cover"
                  onError={(e) =>
                    handleImageError(e, undefined, item.course_title)
                  }
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
