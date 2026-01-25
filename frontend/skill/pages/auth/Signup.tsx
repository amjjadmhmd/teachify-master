// File: frontend/skill/pages/auth/Signup.tsx
/**
 * Complete Signup/Registration Page with Backend Integration
 * Supports both Student and Instructor registration
 */
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sun, Moon, ArrowLeft, ShieldCheck, AlertCircle, User, Mail, Lock, 
  Phone, GraduationCap, BookOpen, CheckCircle, Eye, EyeOff 
} from 'lucide-react';
import { Button, Card, Input } from '../../components/UI';
import { Lang, Theme } from '../../types';
import { authService } from '../../api/services';
import { ASSETS } from '../../constants/assets';

interface SignupProps {
  onBack: () => void;
  onSuccess: (email: string) => void;
  lang: Lang;
  toggleLang: () => void;
  theme: Theme;
  toggleTheme: () => void;
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
  instructor_code?: string;
  general?: string;
}

const SignupPage: React.FC<SignupProps> = ({ 
  onBack, 
  onSuccess,
  lang, 
  toggleLang, 
  theme, 
  toggleTheme 
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

  /**
   * Form field validation
   */
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    
    // Email validation
    if (!formData.email) {
      newErrors.email = isEn ? 'Email is required' : 'البريد الإلكتروني مطلوب';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = isEn ? 'Invalid email format' : 'صيغة البريد الإلكتروني غير صحيحة';
    }
    
    // Username validation (optional but recommended)
    if (formData.username && formData.username.length < 3) {
      newErrors.username = isEn ? 'Username must be at least 3 characters' : 'اسم المستخدم يجب أن يكون 3 أحرف على الأقل';
    }
    
    // Password validation
    if (!formData.password) {
      newErrors.password = isEn ? 'Password is required' : 'كلمة المرور مطلوبة';
    } else if (formData.password.length < 8) {
      newErrors.password = isEn ? 'Password must be at least 8 characters' : 'كلمة المرور يجب أن تكون 8 أحرف على الأقل';
    }
    
    // Confirm password validation
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = isEn ? 'Passwords do not match' : 'كلمات المرور غير متطابقة';
    }
    
    // Phone validation (optional)
    if (formData.phone_number && !/^\+?[0-9]{10,15}$/.test(formData.phone_number.replace(/\s/g, ''))) {
      newErrors.phone_number = isEn ? 'Invalid phone number' : 'رقم الهاتف غير صحيح';
    }
    
    // Instructor code validation
    if (formData.role === 'instructor' && !formData.instructor_code) {
      newErrors.instructor_code = isEn 
        ? 'Instructor verification code is required' 
        : 'رمز التحقق من المدرب مطلوب';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Handle input changes
   */
  const handleChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  /**
   * Handle role selection
   */
  const handleRoleChange = (role: 'student' | 'instructor') => {
    setFormData(prev => ({ ...prev, role }));
  };

  /**
   * Handle form submission
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      // Prepare data for API
      const registrationData = {
        email: formData.email,
        username: formData.username || undefined,
        password: formData.password,
        role: formData.role,
        phone_number: formData.phone_number || undefined,
        instructor_code: formData.instructor_code || undefined
      };

      // Call registration service
      await authService.register(registrationData);
      
      // Success - show success message
      setSuccess(true);
      
      // Redirect to email verification after 2 seconds
      setTimeout(() => {
        onSuccess(formData.email); // Pass email to verification page
      }, 2000);
      
    } catch (err: any) {
      console.error('Registration error:', err);
      
      // Parse error message
      if (err.message) {
        setErrors({ general: err.message });
      } else {
        setErrors({ 
          general: isEn 
            ? 'Registration failed. Please try again.' 
            : 'فشل التسجيل. يرجى المحاولة مرة أخرى.' 
        });
      }
    } finally {
      setLoading(false);
    }
  };

  /**
   * Success screen
   */
  if (success) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center p-4 relative z-10 bg-eden-bg">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <div className="w-32 h-32 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-8 border-4 border-emerald-500">
            <CheckCircle size={64} className="text-emerald-500" />
          </div>
          
          <h2 className="text-4xl font-black text-white mb-4 tracking-tighter">
            {isEn ? 'Welcome Aboard!' : 'مرحباً بك!'}
          </h2>
          
          <p className="text-slate-400 mb-2">
            {isEn 
              ? 'Your account has been created successfully.' 
              : 'تم إنشاء حسابك بنجاح.'}
          </p>
          
          <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">
            {isEn ? 'Redirecting to login...' : 'جاري التحويل لتسجيل الدخول...'}
          </p>
        </motion.div>
      </div>
    );
  }

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

        <Card className="w-full max-w-2xl !p-0 overflow-hidden border-white/10 bg-eden-card/40 backdrop-blur-3xl shadow-2xl">
            <div className="p-8 sm:p-12 flex flex-col items-center">
                {/* Logo */}
                <motion.div 
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.5 }}
                  className="mb-8 relative cursor-pointer group"
                  onClick={onBack}
                >
                    <div className="absolute inset-0 bg-eden-accent/20 blur-2xl rounded-full group-hover:bg-eden-accent/40 transition-all" />
                    <img 
                      src={ASSETS.LOGO} 
                      alt="Logo" 
                      className="w-20 h-20 object-contain relative z-10 group-hover:rotate-12 transition-transform duration-500" 
                    />
                </motion.div>
                
                {/* Title */}
                <h1 className="text-3xl font-black text-white mb-2 tracking-tighter uppercase">
                  {isEn ? 'Create Account' : 'إنشاء حساب'}
                </h1>
                <p className="text-[10px] text-slate-500 mb-8 font-black uppercase tracking-[0.3em] flex items-center gap-2">
                    <ShieldCheck size={14} className="text-eden-accent" />
                    {isEn ? "Join Teachify Platform" : "انضم لمنصة تيتشيفاي"}
                </p>

                {/* Role Selection */}
                <div className="w-full mb-8">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3">
                    {isEn ? 'Select Your Role' : 'اختر دورك'}
                  </p>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() => handleRoleChange('student')}
                      className={`p-6 rounded-2xl border-2 transition-all flex flex-col items-center gap-3 ${
                        formData.role === 'student'
                          ? 'border-eden-accent bg-eden-accent/10 text-eden-accent'
                          : 'border-white/10 bg-white/5 text-slate-400 hover:border-white/20'
                      }`}
                    >
                      <GraduationCap size={32} />
                      <span className="font-bold text-sm uppercase tracking-wider">
                        {isEn ? 'Student' : 'طالب'}
                      </span>
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => handleRoleChange('instructor')}
                      className={`p-6 rounded-2xl border-2 transition-all flex flex-col items-center gap-3 ${
                        formData.role === 'instructor'
                          ? 'border-eden-accent bg-eden-accent/10 text-eden-accent'
                          : 'border-white/10 bg-white/5 text-slate-400 hover:border-white/20'
                      }`}
                    >
                      <BookOpen size={32} />
                      <span className="font-bold text-sm uppercase tracking-wider">
                        {isEn ? 'Instructor' : 'مدرب'}
                      </span>
                    </button>
                  </div>
                </div>

                {/* Error message */}
                {errors.general && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }} 
                    animate={{ opacity: 1, y: 0 }} 
                    className="w-full p-4 mb-6 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-500 text-[10px] font-black uppercase text-center tracking-widest flex items-center gap-2 justify-center"
                  >
                    <AlertCircle size={14} />
                    {errors.general}
                  </motion.div>
                )}
                
                {/* Registration form */}
                <form onSubmit={handleSubmit} className="w-full space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Email */}
                      <div className="md:col-span-2">
                        <Input 
                            label={isEn ? "Email Address" : "البريد الإلكتروني"} 
                            placeholder="you@example.com" 
                            value={formData.email} 
                            type="email"
                            onChange={(e) => handleChange('email', e.target.value)} 
                            required
                            disabled={loading}
                        />
                        {errors.email && (
                          <p className="text-red-500 text-[10px] mt-1 font-bold">{errors.email}</p>
                        )}
                      </div>
                      
                      {/* Username */}
                      <div className="md:col-span-2">
                        <Input 
                            label={isEn ? "Username (Optional)" : "اسم المستخدم (اختياري)"} 
                            placeholder={isEn ? "username" : "اسم_المستخدم"} 
                            value={formData.username} 
                            onChange={(e) => handleChange('username', e.target.value)} 
                            disabled={loading}
                        />
                        {errors.username && (
                          <p className="text-red-500 text-[10px] mt-1 font-bold">{errors.username}</p>
                        )}
                      </div>
                      
                      {/* Phone */}
                      <div className="md:col-span-2">
                        <Input 
                            label={isEn ? "Phone Number (Optional)" : "رقم الهاتف (اختياري)"} 
                            placeholder="+20 123 456 7890" 
                            value={formData.phone_number} 
                            type="tel"
                            onChange={(e) => handleChange('phone_number', e.target.value)} 
                            disabled={loading}
                        />
                        {errors.phone_number && (
                          <p className="text-red-500 text-[10px] mt-1 font-bold">{errors.phone_number}</p>
                        )}
                      </div>

                      {/* Instructor Code (Only for Instructors) */}
                      {formData.role === 'instructor' && (
                        <div className="md:col-span-2">
                          <Input 
                              label={isEn ? "Instructor Verification Code" : "رمز التحقق من المدرب"} 
                              placeholder={isEn ? "Enter verification code" : "أدخل رمز التحقق"} 
                              value={formData.instructor_code} 
                              type="password"
                              onChange={(e) => handleChange('instructor_code', e.target.value)} 
                              required={formData.role === 'instructor'}
                              disabled={loading}
                          />
                          {errors.instructor_code && (
                            <p className="text-red-500 text-[10px] mt-1 font-bold">{errors.instructor_code}</p>
                          )}
                          <p className="text-slate-500 text-[10px] mt-2 font-semibold">
                            {isEn 
                              ? "Contact an administrator if you don't have a code" 
                              : "تواصل مع المسؤول إذا لم تكن لديك رمز"}
                          </p>
                        </div>
                      )}
                      
                      {/* Password */}
                      <div className="relative">
                        <Input 
                            label={isEn ? "Password" : "كلمة المرور"} 
                            type={showPassword ? "text" : "password"}
                            placeholder="••••••••" 
                            value={formData.password} 
                            onChange={(e) => handleChange('password', e.target.value)} 
                            required
                            disabled={loading}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-9 text-slate-400 hover:text-white"
                        >
                          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                        {errors.password && (
                          <p className="text-red-500 text-[10px] mt-1 font-bold">{errors.password}</p>
                        )}
                      </div>
                      
                      {/* Confirm Password */}
                      <div className="relative">
                        <Input 
                            label={isEn ? "Confirm Password" : "تأكيد كلمة المرور"} 
                            type={showConfirmPassword ? "text" : "password"}
                            placeholder="••••••••" 
                            value={formData.confirmPassword} 
                            onChange={(e) => handleChange('confirmPassword', e.target.value)} 
                            required
                            disabled={loading}
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-9 text-slate-400 hover:text-white"
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
                      className="w-full mt-8 shadow-glow !h-16" 
                      isLoading={loading}
                      disabled={loading}
                    >
                        {isEn ? "Create Account" : "إنشاء الحساب"}
                    </Button>
                </form>

                {/* Footer */}
                <div className="mt-8 flex flex-col items-center gap-4">
                    <p className="text-sm text-slate-400">
                      {isEn ? 'Already have an account?' : 'لديك حساب بالفعل؟'}
                      {' '}
                      <button 
                        onClick={onSuccess}
                        className="text-eden-accent font-bold hover:underline"
                        disabled={loading}
                      >
                        {isEn ? 'Sign In' : 'تسجيل الدخول'}
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
                        {isEn ? "Back to Home" : "العودة للرئيسية"}
                    </button>
                </div>
            </div>
        </Card>
    </div>
  );
};

export default SignupPage;