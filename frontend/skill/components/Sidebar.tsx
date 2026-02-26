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
  const isRtl = lang === 'ar';
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
          label: isEn ? 'Dashboard' : '\u0644\u0648\u062d\u0629 \u0627\u0644\u062a\u062d\u0643\u0645',
          icon: LayoutDashboard,
        },
        {
          id: ViewMode.COURSE_EDITOR,
          label: isEn ? 'Course Library' : '\u0645\u0643\u062a\u0628\u0629 \u0627\u0644\u0643\u0648\u0631\u0633\u0627\u062a',
          icon: BookOpen,
        },
        {
          id: ViewMode.INSTRUCTOR_PAYMENTS,
          label: isEn ? 'Payments' : '\u0627\u0644\u062f\u0641\u0639\u0627\u062a',
          icon: CreditCard,
        },
        {
          id: ViewMode.INSTRUCTOR_TASKS,
          label: isEn ? 'Tasks' : '\u0627\u0644\u0645\u0647\u0627\u0645',
          icon: FileText,
        },
        {
          id: ViewMode.INSTRUCTOR_EXAMS,
          label: isEn ? 'Exams' : '\u0627\u0644\u0627\u0645\u062a\u062d\u0627\u0646\u0627\u062a',
          icon: ClipboardList,
        },
        {
          id: ViewMode.INSTRUCTOR_CERTIFICATES,
          label: isEn ? 'Certificates' : '\u0627\u0644\u0634\u0647\u0627\u062f\u0627\u062a',
          icon: Award,
        },
        {
          id: ViewMode.STUDENTS_LIST,
          label: isEn ? 'Student Hub' : '\u0645\u0631\u0643\u0632 \u0627\u0644\u0637\u0644\u0627\u0628',
          icon: Users,
        },
        {
          id: ViewMode.TOP_STUDENTS,
          label: isEn ? 'Top Students' : '\u0623\u0641\u0636\u0644 \u0627\u0644\u0637\u0644\u0627\u0628',
          icon: Trophy,
        },
      ]
    : [
        {
          id: ViewMode.DASHBOARD,
          label: isEn ? 'Dashboard' : '\u0644\u0648\u062d\u0629 \u0627\u0644\u062a\u062d\u0643\u0645',
          icon: LayoutDashboard,
        },
        {
          id: ViewMode.COURSE_PLAYER,
          label: isEn ? 'My Courses' : '\u0643\u0648\u0631\u0633\u0627\u062a\u064a',
          icon: GraduationCap,
        },
        {
          id: ViewMode.EXAM_LIST,
          label: isEn ? 'Assessments' : '\u0627\u0644\u062a\u0642\u064a\u064a\u0645\u0627\u062a',
          icon: ClipboardList,
        },
        {
          id: ViewMode.CERTIFICATES,
          label: isEn ? 'Certificates' : '\u0627\u0644\u0634\u0647\u0627\u062f\u0627\u062a',
          icon: Award,
        },
        {
          id: ViewMode.MARKETPLACE,
          label: isEn ? 'Catalog' : '\u0627\u0644\u0643\u062a\u0627\u0644\u0648\u062c',
          icon: ShoppingBag,
        },
        {
          id: ViewMode.WISHLIST,
          label: isEn ? 'Saved' : '\u0627\u0644\u0645\u062d\u0641\u0648\u0638\u0627\u062a',
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
            className="h-12 w-12 object-contain rounded-full"
          />
          <span className="font-black text-xl text-eden-accent">Geo Top</span>
        </div>
      </div>

      <div className={`flex-1 space-y-6 mt-8 min-h-0 sidebar-scroll ${isRtl ? 'pl-1' : 'pr-1'}`}>
        <div className="space-y-2">
          <p className={`text-[9px] font-black uppercase tracking-[0.3em] mb-4 px-2 ${mainConsoleText}`}>
            {isEn ? 'Main Console' : '\u0644\u0648\u062d\u0629 \u0627\u0644\u062a\u062d\u0643\u0645'}
          </p>
          {menuItems.map((item) => (
            <motion.button
              whileHover={{ x: isRtl ? -5 : 5 }}
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
                  className={`absolute ${isRtl ? 'left-3' : 'right-3'} w-1.5 h-1.5 rounded-full bg-eden-accent shadow-[0_0_10px_#007BFF]`}
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
                {isEn ? 'Learning Shelf' : '\u0645\u0643\u062a\u0628\u0629 \u0627\u0644\u062a\u0639\u0644\u0645'}
              </p>
              <span className={`text-[10px] font-black ${isDark ? 'text-eden-accent' : 'text-blue-600'}`}>
                {learningCourses.length}
              </span>
            </div>

            {learningCourses.length === 0 ? (
              <p className={`text-[10px] leading-5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                {isEn
                  ? 'Approved purchased courses appear here.'
                  : '\u0627\u0644\u0643\u0648\u0631\u0633\u0627\u062a \u0627\u0644\u0645\u0634\u062a\u0631\u0627\u0629 \u0628\u0639\u062f \u0627\u0644\u0645\u0648\u0627\u0641\u0642\u0629 \u0647\u062a\u0638\u0647\u0631 \u0647\u0646\u0627.'}
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
                      className={`w-full rounded-xl border px-3 py-2 ${isRtl ? 'text-right' : 'text-left'} transition-all ${
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
                        {isEn ? 'lessons completed' : '\u062f\u0631\u0648\u0633 \u0645\u0643\u062a\u0645\u0644\u0629'}
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
          whileHover={{ x: isRtl ? -5 : 5 }}
          whileTap={{ scale: 0.98 }}
          onClick={onLogout}
          className={`w-full flex items-center gap-3 px-4 py-4 rounded-2xl text-[11px] font-bold uppercase tracking-widest transition-all ${
            isDark
              ? 'text-red-300 border border-red-400/35 bg-red-500/10 hover:text-red-200 hover:bg-red-500/20'
              : 'text-red-600 border border-red-200 bg-red-50/80 hover:text-red-700 hover:bg-red-100'
          }`}
        >
          <LogOut size={18} /> {isEn ? 'Log Out' : '\u062e\u0631\u0648\u062c \u0622\u0645\u0646'}
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
              initial={{ x: isRtl ? '100%' : '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: isRtl ? '100%' : '-100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className={`fixed top-0 ${isRtl ? 'right-0 border-l' : 'left-0 border-r'} h-full w-72 z-[60] lg:hidden ${sidebarBg} ${sidebarBorder}`}
            >
              {SidebarContent}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {isOpen && (
        <div
          className={`hidden lg:block fixed top-0 ${isRtl ? 'right-0 border-l' : 'left-0 border-r'} h-full w-72 backdrop-blur-xl z-40 ${sidebarBgSoft} ${sidebarBorder}`}
        >
          {SidebarContent}
        </div>
      )}
    </>
  );
};

export default Sidebar;

