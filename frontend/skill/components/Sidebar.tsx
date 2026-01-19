import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, BookOpen, ShoppingBag, Heart, Users, ShoppingCart, 
  LogOut, X, Medal, ClipboardList, GraduationCap, Sparkles, Award, Trophy, FileText, CreditCard
} from 'lucide-react';
import { User, Lang, ViewMode } from '../types';
import { ASSETS } from '../constants/assets';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  setView: (v: ViewMode) => void;
  currentView: ViewMode;
  lang: Lang;
  user: User | null;
  onLogout: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  isOpen, onClose, setView, currentView, lang, user, onLogout 
}) => {
  const isInstructor = user?.role === 'instructor';
  const isEn = lang === 'en';

  const menuItems = isInstructor ? [
    { id: ViewMode.DASHBOARD, label: isEn ? 'Dashboard' : 'لوحة التحكم', icon: LayoutDashboard },
    { id: ViewMode.COURSE_EDITOR, label: isEn ? 'Course Library' : 'مكتبة الكورسات', icon: BookOpen },
    { id: ViewMode.INSTRUCTOR_PAYMENTS, label: isEn ? 'Payments' : 'الدفعات', icon: CreditCard },
    { id: ViewMode.INSTRUCTOR_TASKS, label: isEn ? 'Tasks' : 'المهام', icon: FileText },
    { id: ViewMode.INSTRUCTOR_EXAMS, label: isEn ? 'Exams' : 'الامتحانات', icon: ClipboardList },
    { id: ViewMode.INSTRUCTOR_CERTIFICATES, label: isEn ? 'Certificates' : 'الشهادات', icon: Award },
    { id: ViewMode.STUDENTS_LIST, label: isEn ? 'Student Hub' : 'مركز الطلاب', icon: Users },
    { id: ViewMode.TOP_STUDENTS, label: isEn ? 'Top Students' : 'أفضل الطلاب', icon: Trophy },
  ] : [
    { id: ViewMode.DASHBOARD, label: isEn ? 'Dashboard' : 'لوحة التحكم', icon: LayoutDashboard },
    { id: ViewMode.WORKSPACE, label: isEn ? 'AI Workspace' : 'مساحة الذكاء', icon: Sparkles },
    { id: ViewMode.EXAM_LIST, label: isEn ? 'Assessments' : 'التقييمات', icon: ClipboardList },
    { id: ViewMode.CERTIFICATES, label: isEn ? 'Certificates' : 'الشهادات', icon: Award },
    { id: ViewMode.MARKETPLACE, label: isEn ? 'Catalog' : 'الكتالوج', icon: ShoppingBag },
    { id: ViewMode.WISHLIST, label: isEn ? 'Saved' : 'المحفوظات', icon: Heart },
  ];

  const handleBrandClick = () => {
    setView(ViewMode.DASHBOARD);
    onClose();
    // Professional touch: scroll main content area to top if needed
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const SidebarContent = (
    <div className="flex flex-col h-full py-8 px-6">
       {/* Branding */}
       <div 
         className="flex items-center gap-4 mb-12 px-2 cursor-pointer hover:opacity-80 active:scale-95 transition-all group" 
         onClick={handleBrandClick}
       >
          <img src={ASSETS.LOGO} alt="Logo" className="h-10 w-10 object-contain group-hover:rotate-12 transition-transform" />
          <span className="font-bold text-xl text-white tracking-tighter">Teachify</span>
       </div>

       {/* Navigation */}
       <div className="flex-1 space-y-2">
         <p className="text-[9px] font-black text-slate-600 uppercase tracking-[0.3em] mb-4 px-2">
           {isEn ? "Main Console" : "لوحة التحكم"}
         </p>
         {menuItems.map(item => (
           <motion.button 
            whileHover={{ x: 5 }}
            whileTap={{ scale: 0.98 }}
            key={item.id}
            onClick={() => { setView(item.id); onClose(); }}
            className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-[11px] font-bold uppercase tracking-widest transition-all relative group ${
              currentView === item.id 
              ? 'text-eden-accent bg-eden-accent/10 border border-eden-accent/20' 
              : 'text-slate-500 hover:text-slate-200 hover:bg-white/5 border border-transparent'
            }`}
           >
             <item.icon size={18} className={currentView === item.id ? "text-eden-accent" : "text-slate-500 group-hover:text-slate-300"} /> 
             {item.label}
             
             {currentView === item.id && (
               <motion.div 
                 layoutId="sidebar-active"
                 className="absolute right-3 w-1.5 h-1.5 rounded-full bg-eden-accent shadow-[0_0_10px_#22d3ee]"
               />
             )}
           </motion.button>
         ))}
       </div>

       {/* Secondary Actions / Profile Preview Area */}
       <div className="mt-auto pt-6 border-t border-white/5">
          <motion.button 
            whileHover={{ x: 5 }}
            whileTap={{ scale: 0.98 }}
            onClick={onLogout} 
            className="w-full flex items-center gap-3 px-4 py-4 rounded-2xl text-[11px] font-bold uppercase tracking-widest text-red-500/70 hover:text-red-500 hover:bg-red-500/5 transition-all"
          >
             <LogOut size={18} /> {isEn ? 'De-Authorize' : 'خروج آمن'}
          </motion.button>
       </div>
    </div>
  );

  return (
    <>
      {/* Mobile Drawer */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-md z-[55] lg:hidden" 
              onClick={onClose}
            />
            <motion.div 
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed top-0 left-0 h-full w-72 bg-eden-bg border-r border-white/10 z-[60] lg:hidden"
            >
              {SidebarContent}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Desktop Persistent Sidebar */}
      <div className="hidden lg:block fixed top-0 left-0 h-full w-72 bg-eden-bg/40 backdrop-blur-xl border-r border-white/5 z-40">
        {SidebarContent}
      </div>
    </>
  );
};

export default Sidebar;