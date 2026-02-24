import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  BookOpen,
  ShoppingBag,
  Heart,
  Users,
  LogOut,
  ClipboardList,
  GraduationCap,
  Award,
  Trophy,
  FileText,
  CreditCard,
} from 'lucide-react';
import {
  User,
  Lang,
  Theme,
  ViewMode,
  StudentLearningCourse,
} from '../types';
import { ASSETS } from '../constants/assets';
import { useIsMobile } from '../hooks/useIsMobile';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  setView: (v: ViewMode) => void;
  currentView: ViewMode;
  lang: Lang;
  theme: Theme;
  user: User | null;
  onLogout: () => void;
  studentCourses?: StudentLearningCourse[];
  onOpenStudentCourse?: (courseId: number) => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onClose,
  setView,
  currentView,
  lang,
  theme,
  user,
  onLogout,
  studentCourses = [],
  onOpenStudentCourse,
}) => {
  const isMobile = useIsMobile();
  const isInstructor = user?.role === 'instructor';
  const isEn = lang === 'en';
  const isDark = theme === 'dark';

  const sidebarBg = isDark ? 'bg-[#061427]' : 'bg-[#e9f3ff]';
  const sidebarBgSoft = isDark ? 'bg-[#061427]/95' : 'bg-[#e9f3ff]/95';
  const sidebarBorder = isDark ? 'border-eden-accent/35' : 'border-eden-accent/25';
  const mainConsoleText = isDark ? 'text-slate-500' : 'text-slate-400';
  const menuItemIdleClass = isDark
    ? 'text-slate-300 hover:text-white hover:bg-white/5 border border-transparent'
    : 'text-slate-500 hover:text-slate-800 hover:bg-black/5 border border-transparent';
  const menuItemIconIdleClass = isDark
    ? 'text-slate-500 group-hover:text-slate-300'
    : 'text-slate-400 group-hover:text-slate-600';
  const logoutSectionBorder = isDark ? 'border-white/10' : 'border-slate-200';

  const menuItems = isInstructor
    ? [
        {
          id: ViewMode.DASHBOARD,
          label: isEn ? 'Dashboard' : 'لوحة التحكم',
          icon: LayoutDashboard,
        },
        {
          id: ViewMode.COURSE_EDITOR,
          label: isEn ? 'Course Library' : 'مكتبة الكورسات',
          icon: BookOpen,
        },
        {
          id: ViewMode.INSTRUCTOR_PAYMENTS,
          label: isEn ? 'Payments' : 'الدفعات',
          icon: CreditCard,
        },
        {
          id: ViewMode.INSTRUCTOR_TASKS,
          label: isEn ? 'Tasks' : 'المهام',
          icon: FileText,
        },
        {
          id: ViewMode.INSTRUCTOR_EXAMS,
          label: isEn ? 'Exams' : 'الامتحانات',
          icon: ClipboardList,
        },
        {
          id: ViewMode.INSTRUCTOR_CERTIFICATES,
          label: isEn ? 'Certificates' : 'الشهادات',
          icon: Award,
        },
        {
          id: ViewMode.STUDENTS_LIST,
          label: isEn ? 'Student Hub' : 'مركز الطلاب',
          icon: Users,
        },
        {
          id: ViewMode.TOP_STUDENTS,
          label: isEn ? 'Top Students' : 'أفضل الطلاب',
          icon: Trophy,
        },
      ]
    : [
        {
          id: ViewMode.DASHBOARD,
          label: isEn ? 'Dashboard' : 'لوحة التحكم',
          icon: LayoutDashboard,
        },
        {
          id: ViewMode.COURSE_PLAYER,
          label: isEn ? 'My Courses' : 'كورساتي',
          icon: GraduationCap,
        },
        {
          id: ViewMode.EXAM_LIST,
          label: isEn ? 'Assessments' : 'التقييمات',
          icon: ClipboardList,
        },
        {
          id: ViewMode.CERTIFICATES,
          label: isEn ? 'Certificates' : 'الشهادات',
          icon: Award,
        },
        {
          id: ViewMode.MARKETPLACE,
          label: isEn ? 'Catalog' : 'الكتالوج',
          icon: ShoppingBag,
        },
        {
          id: ViewMode.WISHLIST,
          label: isEn ? 'Saved' : 'المحفوظات',
          icon: Heart,
        },
      ];

  const learningCourses = !isInstructor ? studentCourses : [];

  const handleBrandClick = () => {
    setView(ViewMode.DASHBOARD);
    if (isMobile) onClose();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenCourse = (courseId: number) => {
    if (onOpenStudentCourse) {
      onOpenStudentCourse(courseId);
    } else {
      setView(ViewMode.COURSE_PLAYER);
    }
    if (isMobile) onClose();
  };

  const SidebarContent = (
    <div className={`flex flex-col h-full overflow-hidden pt-0 pb-4 px-6 ${sidebarBg}`}>
      <div className={`-mx-6 px-6 border-b ${sidebarBorder}`}>
        <div
          className="h-20 flex items-center gap-3 px-2 cursor-pointer hover:opacity-80 transition-opacity"
          onClick={handleBrandClick}
        >
          <img
            src={ASSETS.LOGO}
            alt="Geo Top Logo"
            className="h-10 w-10 object-contain rounded-full"
          />
          <span className="font-black text-xl text-eden-accent">GeoTop</span>
        </div>
      </div>

      <div className="flex-1 space-y-6 mt-8 min-h-0 pr-1 sidebar-scroll">
        <div className="space-y-2">
          <p className={`text-[9px] font-black uppercase tracking-[0.3em] mb-4 px-2 ${mainConsoleText}`}>
            {isEn ? 'Main Console' : 'لوحة التحكم'}
          </p>
          {menuItems.map((item) => (
            <motion.button
              whileHover={{ x: 5 }}
              whileTap={{ scale: 0.98 }}
              key={item.id}
              onClick={() => {
                setView(item.id);
                if (isMobile) onClose();
              }}
              className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-[11px] font-bold uppercase tracking-widest transition-all relative group ${
                currentView === item.id
                  ? 'text-eden-accent bg-eden-accent/10 border border-eden-accent/20'
                  : menuItemIdleClass
              }`}
            >
              <item.icon
                size={18}
                className={currentView === item.id ? 'text-eden-accent' : menuItemIconIdleClass}
              />
              {item.label}

              {currentView === item.id && (
                <motion.div
                  layoutId="sidebar-active"
                  className="absolute right-3 w-1.5 h-1.5 rounded-full bg-eden-accent shadow-[0_0_10px_#007BFF]"
                />
              )}
            </motion.button>
          ))}
        </div>

        {!isInstructor && (
          <div
            className={`rounded-2xl border p-3 ${
              isDark ? 'border-white/10 bg-white/5' : 'border-slate-200 bg-white/70'
            }`}
          >
            <div className="mb-3 flex items-center justify-between">
              <p className={`text-[9px] font-black uppercase tracking-[0.24em] ${mainConsoleText}`}>
                {isEn ? 'Learning Shelf' : 'مكتبة التعلم'}
              </p>
              <span className={`text-[10px] font-black ${isDark ? 'text-eden-accent' : 'text-blue-600'}`}>
                {learningCourses.length}
              </span>
            </div>

            {learningCourses.length === 0 ? (
              <p className={`text-[10px] leading-5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                {isEn
                  ? 'Approved purchased courses appear here.'
                  : 'الكورسات المشتراة بعد الموافقة هتظهر هنا.'}
              </p>
            ) : (
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {learningCourses.map((course) => {
                  const safeProgress = Number.isFinite(course.progress)
                    ? Math.min(100, Math.max(0, Math.round(course.progress)))
                    : 0;

                  return (
                    <button
                      key={course.id}
                      onClick={() => handleOpenCourse(course.id)}
                      className={`w-full rounded-xl border px-3 py-2 text-left transition-all ${
                        isDark
                          ? 'border-white/10 bg-black/20 hover:border-eden-accent/40 hover:bg-eden-accent/10'
                          : 'border-slate-200 bg-white hover:border-blue-300 hover:bg-blue-50'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className={`truncate text-[11px] font-bold ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
                          {course.title}
                        </p>
                        <span className={`text-[10px] font-black ${isDark ? 'text-eden-accent' : 'text-blue-700'}`}>
                          {safeProgress}%
                        </span>
                      </div>
                      <div className={`mt-2 h-1.5 w-full rounded-full ${isDark ? 'bg-white/10' : 'bg-slate-200'}`}>
                        <div
                          className="h-full rounded-full bg-eden-accent transition-all"
                          style={{ width: `${safeProgress}%` }}
                        />
                      </div>
                      <p className={`mt-1 text-[9px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                        {course.completed_lessons}/{course.total_lessons}{' '}
                        {isEn ? 'lessons completed' : 'دروس مكتملة'}
                      </p>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      <div className={`shrink-0 pt-4 pb-2 border-t ${logoutSectionBorder}`}>
        <motion.button
          whileHover={{ x: 5 }}
          whileTap={{ scale: 0.98 }}
          onClick={onLogout}
          className={`w-full flex items-center gap-3 px-4 py-4 rounded-2xl text-[11px] font-bold uppercase tracking-widest transition-all ${
            isDark
              ? 'text-red-300 border border-red-400/35 bg-red-500/10 hover:text-red-200 hover:bg-red-500/20'
              : 'text-red-600 border border-red-200 bg-red-50/80 hover:text-red-700 hover:bg-red-100'
          }`}
        >
          <LogOut size={18} /> {isEn ? 'Log Out' : 'خروج امن'}
        </motion.button>
      </div>
    </div>
  );

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/20 backdrop-blur-md z-[55] lg:hidden"
              onClick={onClose}
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className={`fixed top-0 left-0 h-full w-72 border-r z-[60] lg:hidden ${sidebarBg} ${sidebarBorder}`}
            >
              {SidebarContent}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {isOpen && (
        <div
          className={`hidden lg:block fixed top-0 left-0 h-full w-72 backdrop-blur-xl border-r z-40 ${sidebarBgSoft} ${sidebarBorder}`}
        >
          {SidebarContent}
        </div>
      )}
    </>
  );
};

export default Sidebar;
