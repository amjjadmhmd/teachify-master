import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell, ShoppingCart, Menu, User as UserIcon, Heart, Check, Sun, Moon
} from 'lucide-react';
import { Theme, Lang, ViewMode, Notification, User } from '../types';
import { api } from '../api/client';
import { ASSETS } from '../constants/assets';

type LandingSectionId =
  | 'home'
  | 'courses'
  | 'services'
  | 'projects'
  | 'blog'
  | 'about'
  | 'contact';

interface NavbarProps {
  toggleSidebar: () => void;
  theme: Theme;
  toggleTheme: () => void;
  lang: Lang;
  toggleLang: () => void;
  setView: (v: ViewMode) => void;
  currentView: ViewMode;
  cartCount: number;
  openCart: () => void;
  userRole?: string;
  isMobile: boolean;
  isSidebarOpen: boolean;
  user?: User | null;
  onNavigateToStudent?: (studentId: number) => void;
  openSettings: () => void;
  onGoBack: () => void;
  canGoBack: boolean;
  onNavigateLandingSection?: (sectionId: LandingSectionId) => void;
}

const Navbar: React.FC<NavbarProps> = ({
  toggleSidebar,
  theme,
  toggleTheme,
  lang,
  setView,
  currentView,
  cartCount,
  openCart,
  userRole,
  user,
  isSidebarOpen,
  openSettings,
  onNavigateLandingSection
}) => {
  const isEn = lang === 'en';
  const isRtl = lang === 'ar';
  const isInstructor = userRole === 'instructor';
  const showPortalSections = userRole === 'student' || userRole === 'instructor';
  const menuButtonClass =
    theme === 'dark'
      ? 'p-2.5 rounded-xl border border-cyan-300/40 bg-slate-900/80 text-cyan-300 shadow-[0_0_18px_rgba(34,211,238,0.2)] transition-all hover:border-cyan-200 hover:text-white'
      : 'p-2.5 rounded-xl border border-eden-accent/35 bg-white text-slate-700 shadow-sm transition-all hover:border-eden-accent hover:text-eden-accent';
  
  const landingNavItems: { id: LandingSectionId; label: string }[] = isEn
    ? [
        { id: 'home', label: 'Home' },
        { id: 'services', label: 'Services' },
        { id: 'courses', label: 'Courses' },
        { id: 'projects', label: 'Projects' },
        { id: 'blog', label: 'Blog' },
        { id: 'about', label: 'About Us' },
        { id: 'contact', label: 'Contact Us' },
      ]
    : [
        { id: 'home', label: '\u0627\u0644\u0631\u0626\u064a\u0633\u064a\u0629' },
        { id: 'services', label: '\u0627\u0644\u062e\u062f\u0645\u0627\u062a' },
        { id: 'courses', label: '\u0627\u0644\u0643\u0648\u0631\u0633\u0627\u062a' },
        { id: 'projects', label: '\u0627\u0644\u0645\u0634\u0627\u0631\u064a\u0639' },
        { id: 'blog', label: '\u0627\u0644\u0628\u0644\u0648\u062c' },
        { id: 'about', label: '\u0645\u0646 \u0646\u062d\u0646' },
        { id: 'contact', label: '\u062a\u0648\u0627\u0635\u0644 \u0645\u0639\u0646\u0627' },
      ];

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifs, setShowNotifs] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const navRailRef = useRef<HTMLDivElement | null>(null);
  const navItemRefs = useRef<Record<LandingSectionId, HTMLButtonElement | null>>({
    home: null,
    courses: null,
    services: null,
    projects: null,
    blog: null,
    about: null,
    contact: null,
  });
  
  const navLogoPrevXRef = useRef<number | null>(null);
  const navLogoRotateRef = useRef(0);
  const [selectedLandingItem, setSelectedLandingItem] = useState<LandingSectionId>('home');
  const [hoveredLandingItem, setHoveredLandingItem] = useState<LandingSectionId | null>(null);
  const [navLogoX, setNavLogoX] = useState(0);
  const [navLogoRotate, setNavLogoRotate] = useState(0);
  const [navLogoReady, setNavLogoReady] = useState(false);
  const activeLandingItem: LandingSectionId = hoveredLandingItem ?? selectedLandingItem;

  useEffect(() => {
    if (!user) return;
    const fetchNotifications = async () => {
      try {
        const data = await api.notifications.list(user.id);
        setNotifications(data);
      } catch (e) {
        console.error('Failed to fetch notifications:', e);
      }
    };
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 10000);
    return () => clearInterval(interval);
  }, [user]);

  useEffect(() => {
    if (currentView === ViewMode.MARKETPLACE) {
      setSelectedLandingItem('courses');
    } else if (currentView === ViewMode.CONTACT) {
      setSelectedLandingItem('contact');
    } else if (currentView === ViewMode.DASHBOARD || currentView === ViewMode.LANDING) {
      setSelectedLandingItem('home');
    }
  }, [currentView]);

  const setNavButtonRef = useCallback(
    (sectionId: LandingSectionId) =>
      (node: HTMLButtonElement | null) => {
        navItemRefs.current[sectionId] = node;
      },
    []
  );

  const syncRollingLogo = useCallback(() => {
    const rail = navRailRef.current;
    const targetButton = navItemRefs.current[activeLandingItem];
    if (!rail || !targetButton) return;

    const railRect = rail.getBoundingClientRect();
    const buttonRect = targetButton.getBoundingClientRect();
    const logoSize = 24; // ØµØºØ±Ù†Ø§ Ø­Ø¬Ù… Ø§Ù„Ù„ÙˆØ¬Ùˆ Ù‚Ù„ÙŠÙ„Ø§Ù‹ Ù„ÙŠØªÙ†Ø§Ø³Ø¨ Ù…Ø¹ Ø§Ù„Ø§Ø±ØªÙØ§Ø¹
    const nextX = buttonRect.left - railRect.left + buttonRect.width / 2 - logoSize / 2;

    const previousX = navLogoPrevXRef.current;
    if (previousX !== null) {
      const deltaX = nextX - previousX;
      const nextRotation = navLogoRotateRef.current + deltaX * 1.25;
      navLogoRotateRef.current = nextRotation;
      setNavLogoRotate(nextRotation);
    }

    navLogoPrevXRef.current = nextX;
    setNavLogoX(nextX);
    setNavLogoReady(true);
  }, [activeLandingItem]);

  useLayoutEffect(() => {
    const frame = window.requestAnimationFrame(syncRollingLogo);
    return () => window.cancelAnimationFrame(frame);
  }, [syncRollingLogo, isEn]);

  useEffect(() => {
    const handleResize = () => window.requestAnimationFrame(syncRollingLogo);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [syncRollingLogo]);

  const unreadCount = notifications?.filter(n => !n.is_read)?.length || 0;

  const handleNotificationClick = async (notifId: number, isRead: boolean) => {
    if (!isRead) {
      try {
        await api.notifications.markRead(notifId);
        setNotifications(prev =>
          prev.map(n => n.id === notifId ? { ...n, is_read: true } : n)
        );
      } catch (e) { console.error(e); }
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await api.notifications.markAllRead();
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    } catch (e) { console.error(e); }
  };

  const handleLandingNavClick = (sectionId: LandingSectionId) => {
    setSelectedLandingItem(sectionId);
    if (onNavigateLandingSection) {
      onNavigateLandingSection(sectionId);
    } else {
      setView(ViewMode.LANDING);
    }
  };

  return (
    <nav className={`fixed top-0 left-0 right-0 h-20 bg-white/80 backdrop-blur-md border-b border-eden-accent/25 z-30 flex items-center justify-between px-6 lg:px-10 ${
      isSidebarOpen ? (isRtl ? 'lg:right-72' : 'lg:left-72') : (isRtl ? 'lg:right-0' : 'lg:left-0')
    }`}>
      
      <div className="flex items-center gap-3 lg:min-w-[6rem]">
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={toggleSidebar}
          className={menuButtonClass}
        >
          <Menu size={18} />
        </motion.button>
      </div>

      {showPortalSections && (
        <div
          ref={navRailRef}
          // ØªÙ… ØªÙ‚Ù„ÙŠÙ„ Ø§Ù„Ù…Ø³Ø§ÙØ§Øª Ø§Ù„Ø³ÙÙ„ÙŠØ© pb-8 -> pb-4
          className="relative hidden lg:flex items-end gap-6 pb-4"
          onMouseLeave={() => setHoveredLandingItem(null)}
        >
          {landingNavItems.map((item) => {
            const isActive = selectedLandingItem === item.id;
            return (
              <button
                key={item.id}
                ref={setNavButtonRef(item.id)}
                type="button"
                onClick={() => handleLandingNavClick(item.id)}
                onMouseEnter={() => setHoveredLandingItem(item.id)}
                // ØªÙ… ØªØµØºÙŠØ± Ø§Ù„Ø®Ø· Ù…Ù† text-sm Ø¥Ù„Ù‰ text-xs
                className={`relative border-0 pb-1 text-xs font-bold leading-none whitespace-nowrap transition-colors after:content-[''] after:absolute after:-bottom-1 after:left-0 after:h-0.5 after:rounded-full after:bg-eden-accent after:transition-all ${
                  isActive
                    ? 'text-eden-accent after:w-full'
                    : 'text-slate-600 hover:text-eden-accent after:w-0 hover:after:w-full'
                }`}
              >
                {item.label}
              </button>
            );
          })}

          <motion.button
            type="button"
            aria-label={isEn ? 'Navigation anchor logo' : '\u0645\u0624\u0634\u0631 \u0627\u0644\u062a\u0646\u0642\u0644'}
            onMouseEnter={() => setHoveredLandingItem(null)}
            // ØªØ¹Ø¯ÙŠÙ„ Ø§Ù„Ø­Ø¬Ù… h-7 -> h-6 ÙˆØ§Ù„Ù…ÙˆØ¶Ø¹ bottom Ù„ÙŠØªÙ†Ø§Ø³Ø¨ Ù…Ø¹ Ø§Ù„Ø§Ø±ØªÙØ§Ø¹ Ø§Ù„Ø¬Ø¯ÙŠØ¯
            className="absolute bottom-[-10px] z-20 h-6 w-6 rounded-full border-0 bg-transparent p-0 overflow-hidden"
            style={{ left: 0 }}
            animate={{
              x: navLogoX,
              rotate: navLogoRotate,
              opacity: navLogoReady ? 1 : 0,
              scale: navLogoReady ? 1 : 0.84,
            }}
            transition={{
              x: { type: 'spring', stiffness: 140, damping: 30, mass: 1.05 },
              rotate: { type: 'spring', stiffness: 95, damping: 24, mass: 0.98 },
              opacity: { duration: 0.16 },
              scale: { duration: 0.18 },
            }}
          >
            <img
              src={ASSETS.LOGO}
              alt=""
              aria-hidden="true"
              className="h-full w-full rounded-full object-cover drop-shadow-[0_8px_12px_rgba(0,123,255,0.3)]"
            />
          </motion.button>
        </div>
      )}

      <div className="flex items-center justify-end gap-2 lg:min-w-[22rem]">
        {/* Notifications */}
        <div className="relative" ref={notifRef}>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowNotifs(!showNotifs)}
            // ØªÙ‚Ù„ÙŠÙ„ Ø§Ù„Ù€ padding p-3 -> p-2
            className="p-2 bg-slate-50 rounded-xl border border-slate-200 text-slate-400 hover:text-slate-800 transition-all relative"
          >
            <Bell size={16} />
            {unreadCount > 0 && (
              <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-eden-accent rounded-full shadow-[0_0_8px_#007BFF]"></span>
            )}
          </motion.button>

          <AnimatePresence>
            {showNotifs && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.95 }}
                className={`absolute top-full mt-3 ${isEn ? 'right-0' : 'left-0'} w-72 bg-white border border-slate-200 rounded-xl shadow-2xl z-50 overflow-hidden backdrop-blur-2xl`}
              >
                <div className="p-4 border-b border-slate-100 flex justify-between items-center">
                  <div className="font-black text-[9px] uppercase tracking-widest text-slate-500">{isEn ? 'Intelligence Feed' : '\u062a\u063a\u0630\u064a\u0629 \u0627\u0644\u0630\u0643\u0627\u0621'}</div>
                  {unreadCount > 0 && (
                    <button onClick={handleMarkAllAsRead} className="text-[9px] font-bold text-eden-accent uppercase">{isEn ? 'Mark all' : '\u062a\u062d\u062f\u064a\u062f \u0627\u0644\u0643\u0644'}</button>
                  )}
                </div>
                <div className="max-h-64 overflow-y-auto">
                  {notifications.length > 0 ? (
                    notifications.map(notif => (
                      <div key={notif.id} onClick={() => handleNotificationClick(notif.id, notif.is_read)} className={`p-4 border-b border-slate-100 cursor-pointer hover:bg-slate-50 transition-colors flex justify-between gap-3 ${!notif.is_read ? 'bg-eden-accent/5' : ''}`}>
                        <div className="flex-1 min-w-0">
                          <p className="text-[11px] font-bold text-slate-800">{notif.title}</p>
                          <p className="text-[9px] text-slate-500 mt-0.5 line-clamp-2">{notif.message}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-8 text-center text-[9px] font-bold text-slate-400 uppercase">{isEn ? 'Clean slate' : '\u0644\u0627 \u064a\u0648\u062c\u062f \u062c\u062f\u064a\u062f'}</div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {!isInstructor && (
          <>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setView(ViewMode.WISHLIST)}
              className="p-2 bg-slate-50 rounded-xl border border-slate-200 text-slate-400 hover:text-red-500 transition-all"
            >
              <Heart size={16} />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={openCart}
              className="p-2 bg-slate-50 rounded-xl border border-slate-200 text-slate-400 hover:text-slate-800 transition-all relative"
            >
              <ShoppingCart size={16} />
              {cartCount > 0 && <span className="absolute -top-1 -right-1 w-4 h-4 bg-eden-accent text-white text-[9px] rounded-full flex items-center justify-center font-black">{cartCount}</span>}
            </motion.button>
          </>
        )}

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={toggleTheme}
          className="p-2 bg-slate-50 rounded-xl border border-slate-200 text-slate-400 hover:text-slate-800 transition-all"
        >
          {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
        </motion.button>

        <div className="h-6 w-px bg-eden-accent/20 mx-1"></div>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={openSettings}
          className="flex items-center gap-2.5 p-1 pr-3 bg-slate-50 rounded-xl border border-slate-200 hover:border-eden-accent/40 transition-all"
        >
          <div className="w-7 h-7 rounded-lg bg-eden-accent/10 flex items-center justify-center overflow-hidden">
            {user?.avatar ? <img src={user.avatar} className="w-full h-full object-cover" /> : <UserIcon size={14} className="text-eden-accent" />}
          </div>
          <div className={`hidden md:block ${isRtl ? 'text-right' : 'text-left'}`}>
            <p className="text-[9px] font-black text-slate-800 leading-none uppercase tracking-widest">{user?.username || 'Pilot'}</p>
            <p className="text-[7px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">{userRole}</p>
          </div>
        </motion.button>
      </div>
    </nav>
  );
};

export default Navbar;

