
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell, ShoppingCart, Menu, Settings, User as UserIcon, Search, HelpCircle, Heart, Check
} from 'lucide-react';
import { Theme, Lang, ViewMode, Notification, User } from '../types';
import { api } from '../api/client';
import { Button, Card } from './UI';

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
  user?: User | null;
  onNavigateToStudent?: (studentId: number) => void;
  openSettings: () => void;
}

const Navbar: React.FC<NavbarProps> = ({
  toggleSidebar, lang, setView, currentView, cartCount, openCart, userRole, isMobile, user, openSettings
}) => {
  const isEn = lang === 'en';
  const isInstructor = userRole === 'instructor';

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifs, setShowNotifs] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;
    const fetchNotifications = async () => {
      try {
        console.log('Fetching notifications for user:', user.id);
        const token = localStorage.getItem('token');
        console.log('Token exists:', !!token);
        const data = await api.notifications.list(user.id);
        console.log('Notifications:', data);
        setNotifications(data);
      } catch (e) {
        console.error('Failed to fetch notifications:', e);
      }
    };
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 10000);
    return () => clearInterval(interval);
  }, [user]);

  const unreadCount = notifications?.filter(n => !n.is_read)?.length || 0;

  const handleNotificationClick = async (notifId: number, isRead: boolean) => {
    if (!isRead) {
      try {
        await api.notifications.markRead(notifId);
        setNotifications(prev =>
          prev.map(n => n.id === notifId ? { ...n, is_read: true } : n)
        );
      } catch (e) {
        console.error('Failed to mark notification as read:', e);
      }
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await api.notifications.markAllRead();
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    } catch (e) {
      console.error('Failed to mark all as read:', e);
    }
  };

  return (
    <nav className="fixed top-0 left-0 lg:left-72 right-0 h-20 bg-white/80 backdrop-blur-md border-b border-slate-200 z-30 flex items-center justify-between px-6 lg:px-10">
      {/* Search Bar / Context Info */}
      <div className="flex items-center gap-4">
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={toggleSidebar}
          className="lg:hidden p-2.5 bg-slate-100 rounded-xl text-slate-700"
        >
          <Menu size={20} />
        </motion.button>

        <div className="hidden sm:flex items-center gap-3 px-4 py-2.5 bg-slate-100 border border-transparent rounded-2xl w-64 lg:w-80 group hover:border-slate-300 transition-all">
          <Search size={16} className="text-slate-400 group-hover:text-eden-accent transition-colors" />
          <input
            type="text"
            placeholder={isEn ? "Global Neural Search..." : "بحث عالمي..."}
            className="bg-transparent border-none text-[11px] font-bold text-slate-800 placeholder:text-slate-400 focus:outline-none w-full"
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Notifications */}
        <div className="relative" ref={notifRef}>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowNotifs(!showNotifs)}
            className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-slate-400 hover:text-slate-800 transition-all relative"
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span className="absolute top-3 right-3 w-2 h-2 bg-eden-accent rounded-full shadow-[0_0_10px_#007BFF]"></span>
            )}
          </motion.button>

          <AnimatePresence>
            {showNotifs && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className={`absolute top-full mt-4 ${isEn ? 'right-0' : 'left-0'} w-80 bg-white border border-slate-200 rounded-2xl shadow-2xl z-50 overflow-hidden backdrop-blur-2xl`}
              >
                <div className="p-5 border-b border-slate-100 flex justify-between items-center">
                  <div className="font-black text-[10px] uppercase tracking-widest text-slate-500">{isEn ? 'Intelligence Feed' : 'تغذية الذكاء'}</div>
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllAsRead}
                      className="px-2 py-1 rounded text-[10px] font-bold uppercase tracking-widest text-eden-accent hover:bg-eden-accent/10 transition-colors"
                    >
                      {isEn ? 'Mark all' : 'تحديد الكل'}
                    </button>
                  )}
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {notifications && notifications.length > 0 ? (
                    notifications.map(notif => (
                      <div
                        key={notif.id}
                        onClick={() => handleNotificationClick(notif.id, notif.is_read)}
                        className={`p-5 border-b border-slate-100 cursor-pointer hover:bg-slate-50 transition-colors flex justify-between items-start gap-3 ${!notif.is_read ? 'bg-eden-accent/5' : ''}`}
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-slate-800">{notif.title}</p>
                          <p className="text-[10px] text-slate-500 mt-1 line-clamp-2">{notif.message}</p>
                        </div>
                        {!notif.is_read && (
                          <Check size={14} className="text-eden-accent flex-shrink-0 mt-1" />
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="p-10 text-center text-[10px] font-bold uppercase tracking-widest text-slate-400">{isEn ? 'Clean slate' : 'لا يوجد جديد'}</div>
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
              className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-slate-400 hover:text-red-500 transition-all"
            >
              <Heart size={18} />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={openCart}
              className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-slate-400 hover:text-slate-800 transition-all relative"
            >
              <ShoppingCart size={18} />
              {cartCount > 0 && <span className="absolute -top-1 -right-1 w-5 h-5 bg-eden-accent text-white text-[10px] rounded-full flex items-center justify-center font-black shadow-glow">{cartCount}</span>}
            </motion.button>
          </>
        )}

        <div className="h-8 w-px bg-slate-200 mx-2"></div>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={openSettings}
          className="flex items-center gap-3 p-1.5 pr-4 bg-slate-50 rounded-2xl border border-slate-200 hover:border-eden-accent/50 transition-all"
        >
          <div className="w-8 h-8 rounded-xl bg-eden-accent/10 flex items-center justify-center overflow-hidden">
            {user?.avatar ? <img src={user.avatar} className="w-full h-full object-cover" /> : <UserIcon size={16} className="text-eden-accent" />}
          </div>
          <div className="hidden md:block text-left">
            <p className="text-[10px] font-black text-slate-800 leading-none uppercase tracking-widest">{user?.username || 'Pilot'}</p>
            <p className="text-[8px] text-slate-500 font-bold uppercase tracking-widest mt-1">{userRole}</p>
          </div>
        </motion.button>
      </div>
    </nav>
  );
};

export default Navbar;
