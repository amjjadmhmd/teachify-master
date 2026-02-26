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
  onForgotPassword?: () => void;
  onSignUp?: () => void;
  onLoginAttempt?: () => void;
  lang: Lang;
  toggleLang: () => void;
  theme: Theme;
  toggleTheme: () => void;
  isModal?: boolean;
}

const LoginPage: React.FC<LoginProps> = ({
  onLogin,
  onBack,
  onForgotPassword,
  onSignUp,
  onLoginAttempt,
  lang,
  toggleLang,
  theme,
  toggleTheme,
  isModal = false
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isLoadingRef = React.useRef(false);

  const isEn = lang === 'en';
  const isModalCompact = isModal;

  // Track component lifecycle
  React.useEffect(() => {
    console.log('ðŸŸ£ LoginPage MOUNTED');
    return () => {
      console.log('ðŸŸ£ LoginPage UNMOUNTING');
    };
  }, []);

  // Track loading state changes
  React.useEffect(() => {
    console.log('ðŸ“Š Loading state changed to:', loading);
  }, [loading]);

  // Track error state changes
  React.useEffect(() => {
    console.log('ðŸ“Š Error state changed to:', error);
  }, [error]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();

    console.log('ðŸ”µ handleLogin START - isLoadingRef:', isLoadingRef.current);

    // Check ref first - synchronous, not affected by React batching
    if (isLoadingRef.current) {
      console.log('ðŸ”´ Already loading, returning');
      e.preventDefault();
      return;
    }

    // Validation
    if (!email || !password) {
      const validationError = isEn ? 'Please fill in all fields' : 'ÙŠØ±Ø¬Ù‰ Ù…Ù„Ø¡ Ø¬Ù…ÙŠØ¹ Ø§Ù„Ø­Ù‚ÙˆÙ„';
      setError(validationError);
      toast.error(validationError);
      return;
    }

    // Set ref immediately
    console.log('ðŸŸ¡ Setting isLoadingRef = true');
    isLoadingRef.current = true;
    setLoading(true);
    setError(null);

    try {
      console.log('ðŸ“¡ Making API call...');
      const user = await authService.login({ email, password });
      console.log('âœ… Login success:', user);

      if (!user || !user.id) {
        throw new Error('Invalid user data returned from login');
      }

      const successMessage = isEn ? 'Login successful!' : 'ØªÙ… ØªØ³Ø¬ÙŠÙ„ Ø§Ù„Ø¯Ø®ÙˆÙ„ Ø¨Ù†Ø¬Ø§Ø­!';
      toast.success(successMessage);
      onLogin(user);
    } catch (err: any) {
      console.log('âŒ Catch block entered');
      console.log('âŒ Error object:', err);
      console.log('âŒ Error name:', err.name);
      console.log('âŒ Error message:', err.message);

      const errorMessage = err.message || (isEn ? 'Login failed. Please try again.' : 'ÙØ´Ù„ ØªØ³Ø¬ÙŠÙ„ Ø§Ù„Ø¯Ø®ÙˆÙ„. ÙŠØ±Ø¬Ù‰ Ø§Ù„Ù…Ø­Ø§ÙˆÙ„Ø© Ù…Ø±Ø© Ø£Ø®Ø±Ù‰.');
      console.log('Setting error state to:', errorMessage);

      try {
        setError(errorMessage);
        console.log('âœ… setError called');
      } catch (stateErr) {
        console.error('âŒ setError failed:', stateErr);
      }

      try {
        toast.error(errorMessage);
        console.log('âœ… toast.error called');
      } catch (toastErr) {
        console.error('âŒ toast failed:', toastErr);
      }
    } finally {
      console.log('ðŸŸ¢ Finally block - STARTING');
      try {
        isLoadingRef.current = false;
        console.log('âœ… Ref reset');
      } catch (refErr) {
        console.error('âŒ Ref reset failed:', refErr);
      }

      try {
        setLoading(false);
        console.log('âœ… setLoading(false) called');
      } catch (loadErr) {
        console.error('âŒ setLoading failed:', loadErr);
      }
      console.log('ðŸŸ¢ Finally block - DONE');
    }
  };

  return (
    <div
      className={
        isModal
          ? "w-full flex items-center justify-center"
          : "min-h-screen w-full flex items-center justify-center p-4 relative z-10 bg-eden-bg overflow-hidden"
      }
    >
      {!isModal && (
        <>
          {/* Background decorations */}
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-eden-accent/5 blur-[120px] rounded-full" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/5 blur-[120px] rounded-full" />

          {/* Theme and language toggles */}
          <div className="absolute top-6 right-6 flex items-center gap-4 z-10">
            <button
              onClick={toggleLang}
              className="text-[10px] font-black text-slate-500 hover:text-slate-800 transition-colors uppercase tracking-[0.2em]"
            >
              {isEn ? 'Ø§Ù„Ø¹Ø±Ø¨ÙŠØ©' : 'English'}
            </button>
            <button
              onClick={toggleTheme}
              className="p-2.5 bg-slate-100 rounded-xl text-slate-400 hover:text-eden-accent transition-all border border-slate-200"
            >
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>
          </div>
        </>
      )}
      <div className={`relative w-full ${isModalCompact ? "max-w-xl" : "max-w-xl md:max-w-2xl"}`}>
        {!isModal && (
          <button
            type="button"
            onClick={onBack}
            disabled={loading}
            aria-label={isEn ? "Go back" : "Ø§Ù„Ø±Ø¬ÙˆØ¹"}
            className="absolute -top-12 left-0 z-20 inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-300 bg-white/90 text-slate-600 shadow-sm transition-all hover:border-eden-accent hover:text-eden-accent disabled:cursor-not-allowed disabled:opacity-50"
          >
            <ArrowLeft size={16} className={!isEn ? "rotate-180" : ""} />
          </button>
        )}

        <Card className="w-full !p-0 overflow-hidden border-slate-200 bg-white/80 backdrop-blur-3xl shadow-2xl">
          <div className={`${isModalCompact ? "p-4 sm:p-5" : "p-6 sm:p-8 md:p-9"} flex flex-col items-center`}>
          {/* Logo */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className={`${isModalCompact ? "mb-3" : "mb-5"} relative cursor-pointer group`}
            onClick={onBack}
          >
            <div className="absolute inset-0 bg-eden-accent/20 blur-2xl rounded-full group-hover:bg-eden-accent/40 transition-all" />
            <img
              src={ASSETS.LOGO}
              alt="Logo"
              className={`${isModalCompact ? "w-14 h-14" : "w-20 h-20"} object-contain relative z-10 group-hover:rotate-12 transition-transform duration-500`}
            />
          </motion.div>

          {/* Title */}
          <h1 className={`${isModalCompact ? "text-2xl" : "text-2xl md:text-3xl"} font-black text-slate-900 mb-2 tracking-tighter uppercase`}>
            Geo Top
          </h1>
          <p className={`text-[10px] text-slate-500 ${isModalCompact ? "mb-4" : "mb-7"} font-black uppercase tracking-[0.3em] flex items-center gap-2`}>
            <ShieldCheck size={14} className="text-eden-accent" />
            {isEn ? "Authentication Required" : "Ù…Ø·Ù„ÙˆØ¨ Ù…ØµØ§Ø¯Ù‚Ø© Ø§Ù„Ø¯Ø®ÙˆÙ„"}
          </p>

          {/* Error message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full p-3 mb-5 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-500 text-[10px] font-black uppercase text-center tracking-widest flex items-center gap-2 justify-center"
            >
              <AlertCircle size={14} />
              {error}
            </motion.div>
          )}

          {/* Login form */}
          <form onSubmit={handleLogin} className={`w-full ${isModalCompact ? "space-y-2.5" : "space-y-3"}`}>
            <Input
              label={isEn ? "Email Identity" : "Ø§Ù„Ù‡ÙˆÙŠØ© Ø§Ù„Ø¨Ø±ÙŠØ¯ÙŠØ©"}
              placeholder="info@geo-top-group.com"
              value={email}
              type="email"
              onChange={(e) => {
                setEmail(e.target.value);
                setError(null);
              }}
              required
              disabled={loading}
              autoComplete="email"
              compact={isModalCompact}
            />
            <Input
              label={isEn ? "Access Code" : "Ø±Ù…Ø² Ø§Ù„ÙˆØµÙˆÙ„"}
              type="password"
              placeholder="********"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError(null);
              }}
              required
              disabled={loading}
              autoComplete="current-password"
              compact={isModalCompact}
            />

            <div className="flex justify-end">
              <button
                type="button"
                onClick={onForgotPassword}
                disabled={loading}
                className="text-[10px] text-slate-400 hover:text-eden-accent transition-colors uppercase tracking-[0.2em] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isEn ? "Forgot Password?" : "Ù‡Ù„ Ù†Ø³ÙŠØª ÙƒÙ„Ù…Ø© Ø§Ù„Ù…Ø±ÙˆØ±ØŸ"}
              </button>
            </div>

            <Button
              type="submit"
              className={`w-full shadow-glow ${isModalCompact ? "!h-11 mt-3" : "!h-12 mt-5"}`}
              isLoading={loading}
              disabled={loading}
            >
              {loading
                ? (isEn ? "Authorizing..." : "Ø¬Ø§Ø±ÙŠ Ø§Ù„Ù…ØµØ§Ø¯Ù‚Ø©...")
                : (isEn ? "Authorize Session" : "Ù…ØµØ§Ø¯Ù‚Ø© Ø§Ù„Ø¬Ù„Ø³Ø©")
              }
            </Button>
          </form>

          {/* Footer */}
          <div className={`${isModalCompact ? "mt-4 gap-2.5" : "mt-7 gap-4"} flex flex-col items-center`}>
            <p className="text-sm text-slate-400">
              {isEn ? "Don't have an account?" : "Ù„ÙŠØ³ Ù„Ø¯ÙŠÙƒ Ø­Ø³Ø§Ø¨ØŸ"}
              {' '}
              <button
                onClick={onSignUp || onBack}
                className="text-eden-accent font-bold hover:underline"
                disabled={loading}
              >
                {isEn ? 'Sign Up' : 'Ø¥Ù†Ø´Ø§Ø¡ Ø­Ø³Ø§Ø¨'}
              </button>
            </p>

            <button
              onClick={onBack}
              className="text-[10px] font-black text-slate-500 hover:text-eden-accent transition-colors flex items-center gap-2 uppercase tracking-[0.3em] group"
              disabled={loading}
            >
              <ArrowLeft
                size={14}
                className={`${!isEn ? "rotate-180" : ""} group-hover:-translate-x-1 transition-transform`}
              />
              {isEn ? "Back to Mainframe" : "Ø§Ù„Ø¹ÙˆØ¯Ø© Ù„Ù„Ù‚Ø§Ø¦Ù…Ø© Ø§Ù„Ø±Ø¦ÙŠØ³ÙŠØ©"}
            </button>

          </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default LoginPage;

