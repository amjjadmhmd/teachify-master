
import React from 'react';
import { Button, Card } from '../components/UI';
import { Lang, Theme } from '../types';
import { MessageCircle, ArrowLeft, CheckCircle, Shield, Globe } from 'lucide-react';
import { Reveal } from '../components/Reveal';

interface JoinPlatformProps {
  onBack: () => void;
  lang: Lang;
  theme: Theme;
}

const JoinPlatform: React.FC<JoinPlatformProps> = ({ onBack, lang, theme }) => {
  const isEn = lang === 'en';
  
  // ---------------------------------------------------------
  // ⚠️ REPLACE THIS NUMBER WITH THE FOUNDER'S WHATSAPP NUMBER
  // Format: CountryCode + Number (e.g., 201xxxxxxxxx)
  const WHATSAPP_NUMBER = "201000000000"; 
  // ---------------------------------------------------------

  const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(isEn ? "Hello, I am interested in joining WhiteLab as an instructor/partner." : "مرحباً، أنا مهتم بالانضمام لمنصة WhiteLab كمحاضر/شريك.")}`;

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 relative z-10 pt-20">
       <Card className="w-full max-w-2xl !p-0 overflow-hidden flex flex-col md:flex-row shadow-2xl animate-in zoom-in duration-300 border-0">
          
          {/* Left Side: Visual / Info */}
          <div className="bg-gradient-to-br from-primary to-emerald-800 p-8 flex flex-col justify-between text-white md:w-1/2">
             <div>
               <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center mb-6">
                 <Globe size={24} />
               </div>
               <p className="text-white/90 text-sm leading-relaxed font-medium">
                 {isEn 
                   ? "WhiteLab is an invite-only platform for top-tier instructors. We ensure quality and deliver results for our global community of engineers."
                   : "وايت لاب هي منصة حصرية للمدربين المحترفين. نحن نضمن الجودة ونحقق النتائج لمجتمعنا العالمي من المهندسين."}
               </p>
             </div>

             <div className="mt-8 space-y-3">
               <div className="flex items-center gap-2 text-sm font-medium"><CheckCircle size={16} className="text-emerald-300"/> {isEn ? "Global Reach" : "وصول عالمي"}</div>
               <div className="flex items-center gap-2 text-sm font-medium"><CheckCircle size={16} className="text-emerald-300"/> {isEn ? "High Revenue Share" : "نسبة أرباح عالية"}</div>
               <div className="flex items-center gap-2 text-sm font-medium"><CheckCircle size={16} className="text-emerald-300"/> {isEn ? "Marketing Support" : "دعم تسويقي كامل"}</div>
             </div>
          </div>

          {/* Right Side: Action */}
          <div className="p-8 bg-white dark:bg-black flex flex-col justify-center items-center text-center md:w-1/2">
             <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center text-green-600 dark:text-green-400 mb-4 animate-pulse">
                <MessageCircle size={32} />
             </div>
             
             <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
               {isEn ? "Contact the Founder" : "تواصل مع المؤسس"}
             </h3>
             <p className="text-slate-500 dark:text-slate-400 text-sm mb-8">
               {isEn 
                 ? "Chat directly via WhatsApp to discuss your application and onboarding."
                 : "تحدث مباشرة عبر واتساب لمناقشة طلب انضمامك والبدء."}
             </p>

             <a 
               href={whatsappUrl} 
               target="_blank" 
               rel="noopener noreferrer"
               className="w-full"
             >
               <Button className="w-full bg-[#25D366] hover:bg-[#128C7E] shadow-lg shadow-green-500/30 border-none text-white">
                  <MessageCircle size={20} /> {isEn ? "Chat on WhatsApp" : "تواصل عبر واتساب"}
               </Button>
             </a>

             <button onClick={onBack} className="mt-6 flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
                <ArrowLeft size={14} className={!isEn ? "rotate-180" : ""} /> {isEn ? "Back to Home" : "العودة للرئيسية"}
             </button>
          </div>

       </Card>
    </div>
  );
};

export default JoinPlatform;
