import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { Sun, Moon, ArrowLeft, ShieldCheck, AlertCircle } from 'lucide-react';
import { Button, Card, Input } from '../../components/UI';
import { User, Lang, Theme } from '../../types';
import { authService } from '../../api/services';
import { ASSETS } from '../../constants/assets';

interface LoginProps {
  onLogin: (u: User) => void;
  onBack: () => void;
  onLoginAttempt?: () => void;
  lang: Lang;
  toggleLang: () => void;
  theme: Theme;
  toggleTheme: () => void;
}

const LoginPage: React.FC<LoginProps> = ({ 
  onLogin, 
  onBack, 
  onLoginAttempt,
  lang, 
  toggleLang, 
  theme, 
  toggleTheme 
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isLoadingRef = React.useRef(false);
  
  const isEn = lang === 'en';

  // Track component lifecycle
  React.useEffect(() => {
    console.log('🟣 LoginPage MOUNTED');
    return () => {
      console.log('🟣 LoginPage UNMOUNTING');
    };
  }, []);

  // Track loading state changes
  React.useEffect(() => {
    console.log('📊 Loading state changed to:', loading);
  }, [loading]);

  // Track error state changes
  React.useEffect(() => {
    console.log('📊 Error state changed to:', error);
  }, [error]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    console.log('🔵 handleLogin START - isLoadingRef:', isLoadingRef.current);
    
    // Check ref first - synchronous, not affected by React batching
    if (isLoadingRef.current) {
      console.log('🔴 Already loading, returning');
      e.preventDefault();
      return;
    }
    
    // Validation
    if (!email || !password) {
      const validationError = isEn ? 'Please fill in all fields' : 'يرجى ملء جميع الحقول';
      setError(validationError);
      toast.error(validationError);
      return;
    }

    // Set ref immediately
    console.log('🟡 Setting isLoadingRef = true');
    isLoadingRef.current = true;
    setLoading(true);
    setError(null);

    try {
      console.log('📡 Making API call...');
      const user = await authService.login({ email, password });
      console.log('✅ Login success:', user);
      
      if (!user || !user.id) {
        throw new Error('Invalid user data returned from login');
      }
      
      const successMessage = isEn ? 'Login successful!' : 'تم تسجيل الدخول بنجاح!';
      toast.success(successMessage);
      onLogin(user);
    } catch (err: any) {
      console.log('❌ Catch block entered');
      console.log('❌ Error object:', err);
      console.log('❌ Error name:', err.name);
      console.log('❌ Error message:', err.message);
      
      const errorMessage = err.message || (isEn ? 'Login failed. Please try again.' : 'فشل تسجيل الدخول. يرجى المحاولة مرة أخرى.');
      console.log('Setting error state to:', errorMessage);
      
      try {
        setError(errorMessage);
        console.log('✅ setError called');
      } catch (stateErr) {
        console.error('❌ setError failed:', stateErr);
      }
      
      try {
        toast.error(errorMessage);
        console.log('✅ toast.error called');
      } catch (toastErr) {
        console.error('❌ toast failed:', toastErr);
      }
    } finally {
      console.log('🟢 Finally block - STARTING');
      try {
        isLoadingRef.current = false;
        console.log('✅ Ref reset');
      } catch (refErr) {
        console.error('❌ Ref reset failed:', refErr);
      }
      
      try {
        setLoading(false);
        console.log('✅ setLoading(false) called');
      } catch (loadErr) {
        console.error('❌ setLoading failed:', loadErr);
      }
      console.log('🟢 Finally block - DONE');
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 relative z-10 bg-eden-bg overflow-hidden">
        {/* Background decorations */}
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-eden-accent/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/10 blur-[120px] rounded-full" />

        {/* Theme and language toggles */}
        <div className="absolute top-6 right-6 flex items-center gap-4 z-10">
            <button 
              onClick={toggleLang} 
              className="text-[10px] font-black text-slate-500 hover:text-white transition-colors uppercase tracking-[0.2em]"
            >
                {isEn ? 'العربية' : 'English'}
            </button>
            <button 
              onClick={toggleTheme} 
              className="p-2.5 bg-white/5 rounded-xl text-slate-400 hover:text-eden-accent transition-all border border-white/5"
            >
                {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>
        </div>

        <Card className="w-full max-w-md !p-0 overflow-hidden border-white/10 bg-eden-card/40 backdrop-blur-3xl shadow-2xl">
            <div className="p-8 sm:p-14 flex flex-col items-center">
                {/* Logo */}
                <motion.div 
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.5 }}
                  className="mb-10 relative cursor-pointer group"
                  onClick={onBack}
                >
                    <div className="absolute inset-0 bg-eden-accent/20 blur-2xl rounded-full group-hover:bg-eden-accent/40 transition-all" />
                    <img 
                      src={ASSETS.LOGO} 
                      alt="Logo" 
                      className="w-24 h-24 object-contain relative z-10 group-hover:rotate-12 transition-transform duration-500" 
                    />
                </motion.div>
                
                {/* Title */}
                <h1 className="text-3xl font-black text-white mb-2 tracking-tighter uppercase">
                  Teachify
                </h1>
                <p className="text-[10px] text-slate-500 mb-12 font-black uppercase tracking-[0.3em] flex items-center gap-2">
                    <ShieldCheck size={14} className="text-eden-accent" />
                    {isEn ? "Authentication Required" : "مطلوب مصادقة الدخول"}
                </p>

                {/* Error message */}
                {error && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }} 
                    animate={{ opacity: 1, y: 0 }} 
                    className="w-full p-4 mb-8 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-500 text-[10px] font-black uppercase text-center tracking-widest flex items-center gap-2 justify-center"
                  >
                    <AlertCircle size={14} />
                    {error}
                  </motion.div>
                )}
                
                {/* Login form */}
                <form onSubmit={handleLogin} className="w-full space-y-4">
                    <Input 
                        label={isEn ? "Email Identity" : "الهوية البريدية"} 
                        placeholder="pilot@teachify.io" 
                        value={email} 
                        type="email"
                        onChange={(e) => {
                          setEmail(e.target.value);
                          setError(null);
                        }} 
                        required
                        disabled={loading}
                        autoComplete="email"
                    />
                    <Input 
                        label={isEn ? "Access Code" : "رمز الوصول"} 
                        type="password" 
                        placeholder="••••••••" 
                        value={password} 
                        onChange={(e) => {
                          setPassword(e.target.value);
                          setError(null);
                        }} 
                        required
                        disabled={loading}
                        autoComplete="current-password"
                    />
                    
                    <Button 
                      type="submit" 
                      className="w-full mt-8 shadow-glow !h-16" 
                      isLoading={loading}
                      disabled={loading}
                    >
                        {loading 
                          ? (isEn ? "Authorizing..." : "جاري المصادقة...")
                          : (isEn ? "Authorize Session" : "مصادقة الجلسة")
                        }
                    </Button>
                </form>

                {/* Footer */}
                <div className="mt-12 flex flex-col items-center gap-6">
                    <button 
                      onClick={onBack} 
                      className="text-[10px] font-black text-slate-500 hover:text-eden-accent transition-colors flex items-center gap-2 uppercase tracking-[0.3em] group"
                      disabled={loading}
                    >
                        <ArrowLeft 
                          size={14} 
                          className={`${!isEn ? "rotate-180" : ""} group-hover:-translate-x-1 transition-transform`} 
                        />
                        {isEn ? "Back to Mainframe" : "العودة للقائمة الرئيسية"}
                    </button>
                    
                    <p className="text-[9px] text-slate-600 font-bold uppercase tracking-widest opacity-50">
                        &copy; 2024 Teachify Neural Systems
                    </p>
                </div>
            </div>
        </Card>
    </div>
  );
};

export default LoginPage;
