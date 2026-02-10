import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ViewMode, Theme, Lang, User } from '../types';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import SettingsModal from './SettingsModal';
import AIAssistant from './AIAssistant';
import StarField from './StarField';
import { useIsMobile } from '../hooks/useIsMobile';

interface LayoutProps {
  children: React.ReactNode;
  view: ViewMode;
  setView: (v: ViewMode) => void;
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
}

const Layout: React.FC<LayoutProps> = ({
  children,
  view,
  setView,
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
}) => {
  const isMobile = useIsMobile();
  const isExamView = view === ViewMode.EXAM_RUNNER;
  const isWorkspace = view === ViewMode.WORKSPACE;
  const isLanding = view === ViewMode.LANDING || view === ViewMode.AUTH || view === ViewMode.JOIN_PLATFORM;

  const showNav = user && !isExamView && !isLanding;
  const isEn = lang === 'en';

  return (
    <div className={`min-h-screen font-sans selection:bg-eden-accent selection:text-eden-bg ${!isEn && lang === 'ar' ? 'rtl' : ''}`}>
      {/* 1. Base Dark Layer */}
      <div className="fixed inset-0 -z-30 bg-eden-bg" />

      {/* 2. Organic Grain/Paper Layer */}
      <div className="fixed inset-0 -z-20 paper-grain" />

      {/* 3. Subtle Lighting Layer */}
      <div className="fixed inset-0 -z-15 bg-obsidian-glow" />

      {/* 4. Dot Grid Layer (Legacy) */}
      <div className="fixed inset-0 -z-10 bg-eden-dots opacity-40" />

      <StarField theme={theme === 'dark' ? 'dark' : 'light'} />

      {showNav && (
        <>
          <Sidebar
            isOpen={isSidebarOpen}
            onClose={() => setIsSidebarOpen(false)}
            setView={setView}
            currentView={view}
            lang={lang}
            user={user}
            onLogout={onLogout}
          />
          <Navbar
            toggleSidebar={() => setIsSidebarOpen(true)}
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
            user={user}
            onNavigateToStudent={onNavigateToStudent}
            openSettings={() => setIsSettingsOpen(true)}
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
          {user.role === 'student' && !isWorkspace && <AIAssistant currentContext={view} lang={lang} />}
        </>
      )}

      <main className={`relative z-0 transition-all duration-300 ${showNav ? 'lg:pl-72' : ''}`}>
        <AnimatePresence mode="wait">
          <motion.div
            key={view}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
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