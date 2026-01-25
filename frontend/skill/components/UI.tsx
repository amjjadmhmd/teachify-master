
import React from 'react';
import { Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

export const Button: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement> & { 
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'accent', 
  isLoading?: boolean 
}> = ({ 
  children, variant = 'primary', isLoading, className,disabled, ...props 
}) => {
  const isDisabled = isLoading || disabled;

  // استخدام rounded-2xl (16px) لمظهر أكثر عصرية وتناسقاً
  const baseStyles = "relative px-8 py-3 rounded-2xl font-bold transition-all duration-300 ease-out flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed tracking-tight text-[11px] uppercase tracking-widest h-14 select-none outline-none border-0";
  
  const variants = {
    // توهج ناعم ودائري بالكامل (Perfectly Circular Glow)
    primary: "bg-eden-accent text-eden-bg hover:shadow-[0_0_30px_-5px_#22d3ee] active:scale-95",
    secondary: "bg-white/5 border border-white/10 text-white hover:bg-white/10 hover:shadow-[0_0_20px_-10px_rgba(255,255,255,0.3)]",
    outline: "border border-white/10 text-slate-400 bg-transparent hover:border-eden-accent hover:text-eden-accent hover:bg-eden-accent/5",
    danger: "bg-red-500/10 border border-red-500/20 text-red-500 hover:bg-red-500 hover:text-white",
    accent: "bg-white text-eden-bg hover:bg-slate-100 shadow-xl"
  };

  return (
    // <motion.button 
    //   whileHover={{ scale: 1.05 }}
    //   whileTap={{ scale: 0.95 }}
    //   transition={{ type: "spring", stiffness: 400, damping: 20 }}
    //   className={`${baseStyles} ${variants[variant]} ${className}`}
    //   disabled={isLoading || props.disabled}
    //   {...(props as any)}
    // >
    //   <span className="relative z-10 flex items-center gap-2">
    //     {isLoading ? <Loader2 className="animate-spin w-4 h-4" /> : children}
    //   </span>
      
    //   {/* طبقة لمعان داخلية تتبع الانحناءات بدقة */}
    //   <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-white/0 via-white/5 to-white/0 opacity-0 hover:opacity-100 transition-opacity pointer-events-none" />
    // </motion.button>
    <motion.button 
      whileHover={isDisabled ? {} : { scale: 1.05 }}  // ✅ منع animation عند disabled
      whileTap={isDisabled ? {} : { scale: 0.95 }}    // ✅ منع animation عند disabled
      transition={{ type: "spring", stiffness: 400, damping: 20 }}
      className={`${baseStyles} ${variants[variant]} ${className}`}
      disabled={isDisabled}  // ✅ استخدام المتغير المدمج
      {...props}  // ✅ تمرير بقية props بدون disabled
    >
      <span className="relative z-10 flex items-center gap-2">
        {isLoading ? <Loader2 className="animate-spin w-4 h-4" /> : children}
      </span>
      
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-white/0 via-white/5 to-white/0 opacity-0 hover:opacity-100 transition-opacity pointer-events-none" />
    </motion.button>
  );
};
// ✅ Extract disabled from props to avoid duplicate

export const Card: React.FC<React.HTMLAttributes<HTMLDivElement> & { variant?: 'glass' | 'solid' }> = ({ children, className, variant = 'solid', ...props }) => (
  <div className={`
    rounded-2xl p-6 transition-all duration-300
    ${variant === 'solid' 
      ? 'bg-eden-card border border-white/5 shadow-soft-lift' 
      : 'bg-eden-card/40 backdrop-blur-xl border border-white/5 shadow-sm'}
    ${className || ''}
  `} {...props}>
    {children}
  </div>
);

export const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement> & { label?: string }> = ({ label, className, ...props }) => (
  <div className="flex flex-col gap-2 mb-4">
    {label && <label className="text-slate-500 text-[10px] font-bold uppercase tracking-[0.2em]">{label}</label>}
    <input 
      className={`
        bg-white/5
        border border-white/5
        rounded-xl p-3.5 
        text-white
        placeholder:text-slate-600
        focus:border-eden-accent/50 focus:outline-none focus:ring-4 focus:ring-eden-accent/5 
        transition-all duration-200
        ${className}
      `}
      {...props}
    />
  </div>
);
