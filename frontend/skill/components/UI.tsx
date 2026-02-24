import React from 'react';
import { Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

export const Button: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'accent',
  isLoading?: boolean
}> = ({
  children, variant = 'primary', isLoading, className, disabled, ...props
}) => {
    const isDisabled = isLoading || disabled;

    const baseStyles = "relative px-8 py-3 rounded-2xl font-bold transition-all duration-300 ease-out flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed tracking-tight text-[11px] uppercase tracking-widest h-14 select-none outline-none border-0";

    const variants = {
      primary: "bg-eden-accent text-eden-bg hover:shadow-[0_0_30px_-5px_#007BFF] active:scale-95",
      secondary: "bg-slate-100 border border-slate-200 text-slate-700 hover:border-eden-accent hover:text-eden-accent hover:bg-eden-accent/10 hover:shadow-sm",
      outline: "border border-slate-200 text-slate-500 bg-transparent hover:border-eden-accent hover:text-eden-accent hover:bg-eden-accent/5",
      danger: "bg-red-500/10 border border-red-500/20 text-red-500 hover:bg-red-500 hover:text-white",
      accent: "bg-white text-eden-bg hover:bg-slate-50 shadow-xl"
    };

    return (
      <motion.button
        whileHover={isDisabled ? {} : { scale: 1.05 }}
        whileTap={isDisabled ? {} : { scale: 0.95 }}
        transition={{ type: "spring", stiffness: 400, damping: 20 }}
        className={`${baseStyles} ${variants[variant]} ${className}`}
        disabled={isDisabled}
        {...props}
      >
        <span className="relative z-10 flex items-center gap-2">
          {isLoading ? <Loader2 className="animate-spin w-4 h-4" /> : children}
        </span>

        <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-white/0 via-white/20 to-white/0 opacity-0 hover:opacity-100 transition-opacity pointer-events-none" />
      </motion.button>
    );
  };

export const Card: React.FC<React.HTMLAttributes<HTMLDivElement> & { variant?: 'glass' | 'solid' }> = ({ children, className, variant = 'solid', ...props }) => (
  <div className={`
    ui-card rounded-2xl p-6 transition-all duration-300
    ${variant === 'solid'
      ? 'bg-white border border-slate-200 shadow-soft-lift'
      : 'bg-white/80 backdrop-blur-xl border border-slate-200 shadow-sm'}
    ${className || ''}
  `} {...props}>
    {children}
  </div>
);

export const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement> & { label?: string }> = ({ label, className, ...props }) => (
  <div className="flex flex-col gap-2 mb-4">
    {label && <label className="text-slate-600 text-[10px] font-bold uppercase tracking-[0.2em]">{label}</label>}
    <input
      className={`
        bg-slate-50
        border border-slate-200
        rounded-xl p-3.5 
        text-slate-900
        placeholder:text-slate-400
        focus:border-eden-accent/50 focus:outline-none focus:ring-4 focus:ring-eden-accent/5 
        transition-all duration-200
        ${className}
      `}
      {...props}
    />
  </div>
);
