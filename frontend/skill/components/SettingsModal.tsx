
import React, { useState, useRef } from 'react';
import { User, Lang, Theme } from '../types';
import { api } from '../api/client';
import { Card, Button, Input } from './UI';
import { X, LogOut, Sun, Moon, Languages, Camera, User as UserIcon, Shield, Hash, CheckCircle, Upload } from 'lucide-react';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    user: User;
    onUpdateUser: (u: User) => void;
    lang: Lang;
    toggleLang: () => void;
    theme: Theme;
    toggleTheme: () => void;
    onLogout: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ 
    isOpen, onClose, user, onUpdateUser, lang, toggleLang, theme, toggleTheme, onLogout 
}) => {
    const [isUpdating, setIsUpdating] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const isEn = lang === 'en';

    if (!isOpen) return null;

    const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUpdating(true);
        // Create local preview URL
        const previewUrl = URL.createObjectURL(file);
        
        try {
            const updatedUser = await api.auth.updateProfile({ avatar: previewUrl });
            onUpdateUser(updatedUser);
        } catch (err) {
            console.error(err);
        } finally {
            setIsUpdating(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-md animate-in fade-in" onClick={onClose}></div>
            
            <Card className="relative z-10 w-full max-w-lg !p-0 shadow-2xl animate-in zoom-in duration-200 overflow-hidden border-2 border-primary/20">
                {/* Header with User Info */}
                <div className="bg-gradient-to-r from-primary/20 to-emerald-900/40 p-8 flex flex-col items-center text-center border-b border-white/10">
                    <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors">
                        <X size={24} />
                    </button>

                    <div className="relative mb-4">
                        <div className="w-24 h-24 rounded-full border-4 border-primary p-1 bg-white dark:bg-black shadow-xl overflow-hidden">
                            {user.avatar ? (
                                <img src={user.avatar} className="w-full h-full object-cover rounded-full" alt="avatar" />
                            ) : (
                                <div className="w-full h-full rounded-full bg-primary/20 flex items-center justify-center text-primary">
                                    <UserIcon size={40} />
                                </div>
                            )}
                        </div>
                        <button 
                            onClick={() => fileInputRef.current?.click()}
                            className="absolute bottom-0 right-0 bg-primary text-white p-2 rounded-full shadow-lg hover:scale-110 transition-transform border-2 border-white dark:border-slate-800"
                        >
                            <Camera size={16} />
                        </button>
                        <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleAvatarUpload} />
                    </div>

                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{user.username}</h2>
                    <div className="flex items-center gap-4 mt-2">
                        <span className="flex items-center gap-1 text-[10px] font-bold text-slate-500 uppercase tracking-widest bg-white/10 px-2 py-0.5 rounded">
                            <Hash size={10} /> ID: {user.id}
                        </span>
                        <span className="flex items-center gap-1 text-[10px] font-bold text-primary uppercase tracking-widest bg-primary/10 px-2 py-0.5 rounded">
                            <Shield size={10} /> {user.role}
                        </span>
                    </div>
                </div>

                {/* Content Sections */}
                <div className="p-6 space-y-6 bg-white dark:bg-black">
                    
                    {/* Preferences Group */}
                    <div>
                        <h4 className="text-[10px] font-bold text-slate-500 uppercase mb-3 tracking-widest">{isEn ? 'Preferences' : 'التفضيلات'}</h4>
                        <div className="grid grid-cols-2 gap-3">
                            <button 
                                onClick={toggleLang}
                                className="flex items-center justify-between p-4 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl hover:border-primary transition-all group"
                            >
                                <div className="flex items-center gap-3">
                                    <Languages size={18} className="text-slate-400 group-hover:text-primary" />
                                    <span className="text-sm font-bold text-slate-700 dark:text-white">{isEn ? 'Language' : 'اللغة'}</span>
                                </div>
                                <span className="text-xs text-primary font-bold">{lang.toUpperCase()}</span>
                            </button>

                            <button 
                                onClick={toggleTheme}
                                className="flex items-center justify-between p-4 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl hover:border-primary transition-all group"
                            >
                                <div className="flex items-center gap-3">
                                    {theme === 'dark' ? <Sun size={18} className="text-slate-400 group-hover:text-primary" /> : <Moon size={18} className="text-slate-400 group-hover:text-primary" />}
                                    <span className="text-sm font-bold text-slate-700 dark:text-white">{isEn ? 'Theme' : 'المظهر'}</span>
                                </div>
                                <span className="text-xs text-primary font-bold">{theme.toUpperCase()}</span>
                            </button>
                        </div>
                    </div>

                    {/* Account Security Info */}
                    <div className="bg-primary/5 rounded-xl p-4 border border-primary/10 flex items-start gap-3">
                        <CheckCircle size={18} className="text-primary shrink-0 mt-0.5" />
                        <div>
                            <p className="text-xs font-bold text-slate-800 dark:text-white">{isEn ? 'Account Secure' : 'حسابك مؤمن'}</p>
                            <p className="text-[10px] text-slate-500">{isEn ? 'You are using an enterprise-grade neural link.' : 'أنت تستخدم رابطاً عصبياً مشفراً وآمناً.'}</p>
                        </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="pt-4 flex gap-3">
                        <Button variant="outline" className="flex-1" onClick={onClose}>
                            {isEn ? 'Close' : 'إغلاق'}
                        </Button>
                        <Button variant="danger" className="flex-1" onClick={onLogout}>
                            <LogOut size={18} /> {isEn ? 'Logout' : 'خروج'}
                        </Button>
                    </div>
                </div>
            </Card>
        </div>
    );
};

export default SettingsModal;
