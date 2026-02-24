import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ViewMode, Theme, Lang, User, StudentLearningCourse } from '../types';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import SettingsModal from './SettingsModal';
import AIAssistant from './AIAssistant';
import { useIsMobile } from '../hooks/useIsMobile';

type LandingSectionId = 'home' | 'courses' | 'services' | 'about' | 'contact';

interface LayoutProps {
  children: React.ReactNode;
  view: ViewMode;
  setView: (v: ViewMode) => void;
  onGoBack: () => void;
  canGoBack: boolean;
  user: User | null;
  theme: Theme;
  toggleTheme: () => void;
  lang: Lang;
  toggleLang: () => void;
  cartCount: number;
  isSidebarOpen: boolean;
  setIsSidebarOpen: (o: boolean) => void;
  isSettingsOpen: boolean;
  setIsSettingsOpen: (o: boolean) => void;
  onLogout: () => void;
  onNavigateToStudent: (id: number) => void;
  onUpdateUser: (u: User) => void;
  onNavigateLandingSection?: (sectionId: LandingSectionId) => void;
  studentCourses?: StudentLearningCourse[];
  onOpenStudentCourse?: (courseId: number) => void;
}

const Layout: React.FC<LayoutProps> = ({
  children,
  view,
  setView,
  onGoBack,
  canGoBack,
  user,
  theme,
  toggleTheme,
  lang,
  toggleLang,
  cartCount,
  isSidebarOpen,
  setIsSidebarOpen,
  isSettingsOpen,
  setIsSettingsOpen,
  onLogout,
  onNavigateToStudent,
  onUpdateUser,
  onNavigateLandingSection,
  studentCourses = [],
  onOpenStudentCourse,
}) => {
  const isMobile = useIsMobile();
  const isExamView = view === ViewMode.EXAM_RUNNER;
  const isWorkspace = view === ViewMode.WORKSPACE;
  const isLanding = view === ViewMode.LANDING || view === ViewMode.AUTH || view === ViewMode.JOIN_PLATFORM;
  const showAmbientLayers = !isLanding;
  const roleScopeClass =
    !isLanding && user?.role === 'student'
      ? 'portal-role-student'
      : !isLanding && user?.role === 'instructor'
      ? 'portal-role-instructor'
      : '';

  const showNav = user && !isExamView && !isLanding;
  const isEn = lang === 'en';
  const isAiAssistantEnabled = (import.meta as any)?.env?.VITE_ENABLE_AI_ASSISTANT !== 'false';

  return (
    <div
      className={`min-h-screen font-sans selection:bg-eden-accent selection:text-eden-bg ${roleScopeClass} ${
        !isEn && lang === 'ar' ? 'rtl' : ''
      }`}
    >
      {/* 1. Base Dark Layer */}
      <div className="fixed inset-0 -z-30 bg-eden-bg" />

      {showAmbientLayers && (
        <>
          {/* 2. Organic Grain/Paper Layer */}
          <div className="fixed inset-0 -z-20 paper-grain" />

          {/* 3. Subtle Lighting Layer */}
          <div className="fixed inset-0 -z-15 bg-obsidian-glow" />
        </>
      )}

      {showNav && (
        <>
          <Sidebar
            isOpen={isSidebarOpen}
            onClose={() => setIsSidebarOpen(false)}
            setView={setView}
            currentView={view}
            lang={lang}
            theme={theme}
            user={user}
            onLogout={onLogout}
            studentCourses={studentCourses}
            onOpenStudentCourse={onOpenStudentCourse}
          />
          <Navbar
            toggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
            theme={theme}
            toggleTheme={toggleTheme}
            lang={lang}
            toggleLang={toggleLang}
            setView={setView}
            currentView={view}
            cartCount={cartCount}
            openCart={() => setView(ViewMode.CART)}
            userRole={user.role}
            isMobile={isMobile}
            isSidebarOpen={isSidebarOpen}
            user={user}
            onNavigateToStudent={onNavigateToStudent}
            openSettings={() => setIsSettingsOpen(true)}
            onGoBack={onGoBack}
            canGoBack={canGoBack}
            onNavigateLandingSection={onNavigateLandingSection}
          />
          <SettingsModal
            isOpen={isSettingsOpen}
            onClose={() => setIsSettingsOpen(false)}
            user={user}
            onUpdateUser={onUpdateUser}
            lang={lang}
            toggleLang={toggleLang}
            theme={theme}
            toggleTheme={toggleTheme}
            onLogout={onLogout}
          />
          {isAiAssistantEnabled && user.role === 'student' && !isWorkspace && (
            <AIAssistant currentContext={view} lang={lang} />
          )}
        </>
      )}

      <main className={`relative transition-all duration-300 ${showNav && isSidebarOpen ? 'lg:pl-72' : ''}`}>
        <AnimatePresence mode="wait">
          <motion.div
            key={view}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
};

export default Layout;
