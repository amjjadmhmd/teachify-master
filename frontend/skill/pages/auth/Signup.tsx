// File: frontend/skill/pages/auth/Signup.tsx
/**
 * Complete Signup/Registration Page with Backend Integration
 * Supports student and instructor self-registration
 */
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Sun, Moon, ArrowLeft, ShieldCheck, AlertCircle, CheckCircle, Eye, EyeOff
} from 'lucide-react';
import { Button, Card, Input } from '../../components/UI';
import { Lang, Theme } from '../../types';
import { authService } from '../../api/services';
import { ASSETS } from '../../constants/assets';

interface SignupProps {
  onBack: () => void;
  onSuccess: (payload: { email: string; verificationRequired: boolean }) => void;
  onSignIn?: () => void;
  lang: Lang;
  toggleLang: () => void;
  theme: Theme;
  toggleTheme: () => void;
  isModal?: boolean;
}

interface FormData {
  email: string;
  username: string;
  password: string;
  confirmPassword: string;
  phone_number: string;
  role: 'student' | 'instructor';
  instructor_code: string;
}

interface FormErrors {
  email?: string;
  username?: string;
  password?: string;
  confirmPassword?: string;
  phone_number?: string;
  role?: string;
  instructor_code?: string;
  general?: string;
}

const SignupPage: React.FC<SignupProps> = ({
  onBack,
  onSuccess,
  onSignIn,
  lang,
  toggleLang,
  theme,
  toggleTheme,
  isModal = false
}) => {
  const [formData, setFormData] = useState<FormData>({
    email: '',
    username: '',
    password: '',
    confirmPassword: '',
    phone_number: '',
    role: 'student',
    instructor_code: ''
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const isEn = lang === 'en';
  const passwordToggleTopClass = isModal ? 'top-8' : 'top-9';

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.email) {
      newErrors.email = isEn ? 'Email is required' : 'Ø§Ù„Ø¨Ø±ÙŠØ¯ Ø§Ù„Ø¥Ù„ÙƒØªØ±ÙˆÙ†ÙŠ Ù…Ø·Ù„ÙˆØ¨';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = isEn ? 'Invalid email format' : 'ØµÙŠØºØ© Ø§Ù„Ø¨Ø±ÙŠØ¯ Ø§Ù„Ø¥Ù„ÙƒØªØ±ÙˆÙ†ÙŠ ØºÙŠØ± ØµØ­ÙŠØ­Ø©';
    }

    if (formData.username && formData.username.length < 3) {
      newErrors.username = isEn ? 'Username must be at least 3 characters' : 'Ø§Ø³Ù… Ø§Ù„Ù…Ø³ØªØ®Ø¯Ù… ÙŠØ¬Ø¨ Ø£Ù† ÙŠÙƒÙˆÙ† 3 Ø£Ø­Ø±Ù Ø¹Ù„Ù‰ Ø§Ù„Ø£Ù‚Ù„';
    }

    if (!formData.password) {
      newErrors.password = isEn ? 'Password is required' : 'ÙƒÙ„Ù…Ø© Ø§Ù„Ù…Ø±ÙˆØ± Ù…Ø·Ù„ÙˆØ¨Ø©';
    } else if (formData.password.length < 8) {
      newErrors.password = isEn ? 'Password must be at least 8 characters' : 'ÙƒÙ„Ù…Ø© Ø§Ù„Ù…Ø±ÙˆØ± ÙŠØ¬Ø¨ Ø£Ù† ØªÙƒÙˆÙ† 8 Ø£Ø­Ø±Ù Ø¹Ù„Ù‰ Ø§Ù„Ø£Ù‚Ù„';
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = isEn ? 'Passwords do not match' : 'ÙƒÙ„Ù…Ø§Øª Ø§Ù„Ù…Ø±ÙˆØ± ØºÙŠØ± Ù…ØªØ·Ø§Ø¨Ù‚Ø©';
    }

    if (formData.phone_number && !/^\+?[0-9]{10,15}$/.test(formData.phone_number.replace(/\s/g, ''))) {
      newErrors.phone_number = isEn ? 'Invalid phone number' : 'Ø±Ù‚Ù… Ø§Ù„Ù‡Ø§ØªÙ ØºÙŠØ± ØµØ­ÙŠØ­';
    }


    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    setErrors({});

    try {
      const registrationData = {
        email: formData.email,
        username: formData.username || undefined,
        password: formData.password,
        role: formData.role,
        phone_number: formData.phone_number || undefined,
        instructor_code:
          formData.role === 'instructor' && formData.instructor_code.trim()
            ? formData.instructor_code.trim()
            : undefined,
      };

      const result = await authService.register(registrationData);
      const verificationRequired = Boolean(result.verification_required);
      setSuccess(true);
      setTimeout(() => {
        onSuccess({ email: formData.email, verificationRequired });
      }, 2000);

    } catch (err: any) {
      console.error('Registration error:', err);
      if (err.message) {
        setErrors({ general: err.message });
      } else {
        setErrors({
          general: isEn
            ? 'Registration failed. Please try again.'
            : 'ÙØ´Ù„ Ø§Ù„ØªØ³Ø¬ÙŠÙ„. ÙŠØ±Ø¬Ù‰ Ø§Ù„Ù…Ø­Ø§ÙˆÙ„Ø© Ù…Ø±Ø© Ø£Ø®Ø±Ù‰.'
        });
      }
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div
        className={
          isModal
            ? "w-full flex items-center justify-center p-4"
            : "min-h-screen w-full flex items-center justify-center p-4 relative z-10 bg-eden-bg"
        }
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <div className="w-32 h-32 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-8 border-4 border-emerald-500/20">
            <CheckCircle size={64} className="text-emerald-500" />
          </div>

          <h2 className="text-4xl font-black text-slate-900 mb-4 tracking-tighter">
            {isEn ? 'Welcome Aboard!' : 'Ù…Ø±Ø­Ø¨Ø§Ù‹ Ø¨Ùƒ!'}
          </h2>

          <p className="text-slate-600 mb-2">
            {isEn
              ? 'Your account has been created successfully.'
              : 'ØªÙ… Ø¥Ù†Ø´Ø§Ø¡ Ø­Ø³Ø§Ø¨Ùƒ Ø¨Ù†Ø¬Ø§Ø­.'}
          </p>

          <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">
            {isEn ? 'Redirecting to login...' : 'Ø¬Ø§Ø±ÙŠ Ø§Ù„ØªØ­ÙˆÙŠÙ„ Ù„ØªØ³Ø¬ÙŠÙ„ Ø§Ù„Ø¯Ø®ÙˆÙ„...'}
          </p>
        </motion.div>
      </div>
    );
  }

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
              className="text-[10px] font-black text-slate-500 hover:text-slate-900 transition-colors uppercase tracking-[0.2em]"
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
      <Card className={`w-full ${isModal ? "max-w-none" : "max-w-4xl"} !p-0 overflow-hidden border-2 border-eden-accent/70 bg-white/80 backdrop-blur-3xl shadow-[0_0_0_1px_rgba(34,211,238,0.45),0_0_26px_rgba(34,211,238,0.34),0_0_70px_-24px_rgba(34,211,238,0.9)]`}>
        <div className={`${isModal ? "p-3 sm:p-4" : "p-4 sm:p-5 md:p-6"} flex flex-col items-center`}>
          {/* Logo */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className={`${isModal ? "mb-1.5" : "mb-3"} relative cursor-pointer group`}
            onClick={onBack}
          >
            <div className="absolute inset-0 bg-eden-accent/20 blur-2xl rounded-full group-hover:bg-eden-accent/40 transition-all" />
            <img
              src={ASSETS.LOGO}
              alt="Logo"
              className={`${isModal ? "w-10 h-10 sm:w-11 sm:h-11" : "w-16 h-16"} object-contain relative z-10 group-hover:rotate-12 transition-transform duration-500`}
            />
          </motion.div>

          {/* Title */}
          <h1 className={`${isModal ? "text-xl sm:text-2xl" : "text-2xl sm:text-3xl"} font-black text-slate-900 mb-1 tracking-tighter uppercase`}>
            {isEn ? 'Create Account' : 'Ø¥Ù†Ø´Ø§Ø¡ Ø­Ø³Ø§Ø¨'}
          </h1>
          <p className={`text-[10px] text-slate-500 ${isModal ? "mb-2" : "mb-3"} font-black uppercase tracking-[0.3em] flex items-center gap-2`}>
            <ShieldCheck size={14} className="text-eden-accent" />
            {isEn ? "Join Geo Top Platform" : "Ø§Ù†Ø¶Ù… Ù„Ù…Ù†ØµØ© Ø¬ÙŠÙˆ ØªÙˆØ¨"}
          </p>

          {/* Error message */}
          {errors.general && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full p-2.5 mb-3 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-500 text-[10px] font-black uppercase text-center tracking-widest flex items-center gap-2 justify-center"
            >
              <AlertCircle size={14} />
              {errors.general}
            </motion.div>
          )}

          {/* Registration form */}
          <form onSubmit={handleSubmit} className={`w-full ${isModal ? "space-y-1.5" : "space-y-2"}`}>
            <div className={`rounded-2xl border border-slate-200 bg-slate-50 ${isModal ? "p-2.5" : "p-3"}`}>
              <p className={`text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ${isModal ? "mb-1.5" : "mb-2"}`}>
                {isEn ? 'Account Type' : 'نوع الحساب'}
              </p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleChange('role', 'student')}
                  disabled={loading}
                  className={`rounded-xl border px-3 ${isModal ? "py-1.5" : "py-2"} text-xs font-bold transition ${
                    formData.role === 'student'
                      ? 'border-eden-accent bg-eden-accent/10 text-eden-accent'
                      : 'border-slate-300 bg-white text-slate-600 hover:border-slate-400'
                  }`}
                >
                  {isEn ? 'Student' : 'طالب'}
                </button>
                <button
                  type="button"
                  onClick={() => handleChange('role', 'instructor')}
                  disabled={loading}
                  className={`rounded-xl border px-3 ${isModal ? "py-1.5" : "py-2"} text-xs font-bold transition ${
                    formData.role === 'instructor'
                      ? 'border-eden-accent bg-eden-accent/10 text-eden-accent'
                      : 'border-slate-300 bg-white text-slate-600 hover:border-slate-400'
                  }`}
                >
                  {isEn ? 'Instructor' : 'مدرب'}
                </button>
              </div>
              {formData.role === 'instructor' && (
                <div className={`${isModal ? "mt-2" : "mt-3"}`}>
                  <Input
                    label={isEn ? 'Instructor Code (Optional)' : 'كود المدرب (اختياري)'}
                    placeholder={isEn ? 'Enter instructor code if available' : 'ادخل كود المدرب إن وجد'}
                    value={formData.instructor_code}
                    onChange={(e) => handleChange('instructor_code', e.target.value)}
                    disabled={loading}
                    compact={isModal}
                  />
                </div>
              )}
            </div>
            <div className={`grid grid-cols-1 gap-2 ${isModal ? "md:grid-cols-6" : "md:grid-cols-2"}`}>
              {/* Email */}
              <div className={isModal ? "md:col-span-2" : "md:col-span-1"}>
                <Input
                  label={isEn ? "Email Address" : "Ø§Ù„Ø¨Ø±ÙŠØ¯ Ø§Ù„Ø¥Ù„ÙƒØªØ±ÙˆÙ†ÙŠ"}
                  placeholder="user@geo-top-group.com"
                  value={formData.email}
                  type="email"
                  onChange={(e) => handleChange('email', e.target.value)}
                  required
                  disabled={loading}
                  compact={isModal}
                />
                {errors.email && (
                  <p className="text-red-500 text-[10px] mt-1 font-bold">{errors.email}</p>
                )}
              </div>

              {/* Username */}
              <div className={isModal ? "md:col-span-2" : "md:col-span-1"}>
                <Input
                  label={isEn ? "Username (Optional)" : "Ø§Ø³Ù… Ø§Ù„Ù…Ø³ØªØ®Ø¯Ù… (Ø§Ø®ØªÙŠØ§Ø±ÙŠ)"}
                  placeholder={isEn ? "username" : "Ø§Ø³Ù…_Ø§Ù„Ù…Ø³ØªØ®Ø¯Ù…"}
                  value={formData.username}
                  onChange={(e) => handleChange('username', e.target.value)}
                  disabled={loading}
                  compact={isModal}
                />
                {errors.username && (
                  <p className="text-red-500 text-[10px] mt-1 font-bold">{errors.username}</p>
                )}
              </div>

              {/* Phone */}
              <div className={isModal ? "md:col-span-2" : "md:col-span-2"}>
                <Input
                  label={isEn ? "Phone Number (Optional)" : "Ø±Ù‚Ù… Ø§Ù„Ù‡Ø§ØªÙ (Ø§Ø®ØªÙŠØ§Ø±ÙŠ)"}
                  placeholder="+20 123 456 7890"
                  value={formData.phone_number}
                  type="tel"
                  onChange={(e) => handleChange('phone_number', e.target.value)}
                  disabled={loading}
                  compact={isModal}
                />
                {errors.phone_number && (
                  <p className="text-red-500 text-[10px] mt-1 font-bold">{errors.phone_number}</p>
                )}
              </div>

              {/* Password */}
              <div className={`relative ${isModal ? "md:col-span-3" : ""}`}>
                <Input
                  label={isEn ? "Password" : "ÙƒÙ„Ù…Ø© Ø§Ù„Ù…Ø±ÙˆØ±"}
                  type={showPassword ? "text" : "password"}
                  placeholder="********"
                  value={formData.password}
                  onChange={(e) => handleChange('password', e.target.value)}
                  required
                  disabled={loading}
                  compact={isModal}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className={`absolute right-3 ${passwordToggleTopClass} text-slate-400 hover:text-slate-800`}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
                {errors.password && (
                  <p className="text-red-500 text-[10px] mt-1 font-bold">{errors.password}</p>
                )}
              </div>

              {/* Confirm Password */}
              <div className={`relative ${isModal ? "md:col-span-3" : ""}`}>
                <Input
                  label={isEn ? "Confirm Password" : "ØªØ£ÙƒÙŠØ¯ ÙƒÙ„Ù…Ø© Ø§Ù„Ù…Ø±ÙˆØ±"}
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="********"
                  value={formData.confirmPassword}
                  onChange={(e) => handleChange('confirmPassword', e.target.value)}
                  required
                  disabled={loading}
                  compact={isModal}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className={`absolute right-3 ${passwordToggleTopClass} text-slate-400 hover:text-slate-800`}
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
                {errors.confirmPassword && (
                  <p className="text-red-500 text-[10px] mt-1 font-bold">{errors.confirmPassword}</p>
                )}
              </div>
            </div>

            <Button
              type="submit"
              className={`w-full shadow-glow ${isModal ? "!h-10 mt-2" : "!h-11 mt-3"}`}
              isLoading={loading}
              disabled={loading}
            >
              {isEn ? "Create Account" : "Ø¥Ù†Ø´Ø§Ø¡ Ø§Ù„Ø­Ø³Ø§Ø¨"}
            </Button>
          </form>

          {/* Footer */}
          <div className={`${isModal ? "mt-2" : "mt-3"} flex flex-col items-center gap-2`}>
            <p className="text-sm text-slate-400">
              {isEn ? 'Already have an account?' : 'Ù„Ø¯ÙŠÙƒ Ø­Ø³Ø§Ø¨ Ø¨Ø§Ù„ÙØ¹Ù„ØŸ'}
              {' '}
              <button
                onClick={onSignIn || onBack}
                className="text-eden-accent font-bold hover:underline"
                disabled={loading}
              >
                {isEn ? 'Sign In' : 'ØªØ³Ø¬ÙŠÙ„ Ø§Ù„Ø¯Ø®ÙˆÙ„'}
              </button>
            </p>

            {!isModal && (
              <button
                onClick={onBack}
                className="text-[10px] font-black text-slate-500 hover:text-eden-accent transition-colors flex items-center gap-2 uppercase tracking-[0.3em] group"
                disabled={loading}
              >
                <ArrowLeft
                  size={14}
                  className={`${!isEn ? "rotate-180" : ""} group-hover:-translate-x-1 transition-transform`}
                />
                {isEn ? "Back to Home" : "Ø§Ù„Ø¹ÙˆØ¯Ø© Ù„Ù„Ø±Ø¦ÙŠØ³ÙŠØ©"}
              </button>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
};

export default SignupPage;

