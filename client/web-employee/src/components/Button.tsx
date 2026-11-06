import { ButtonHTMLAttributes } from 'react';

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost';

const styles: Record<Variant, string> = {
  primary:
    'bg-brand-600 text-white shadow-sm shadow-brand-900/20 hover:bg-brand-700 hover:shadow-md hover:shadow-brand-900/30',
  secondary:
    'bg-white text-slate-700 border border-slate-300 shadow-sm hover:border-slate-400 hover:bg-slate-50',
  danger:
    'bg-rose-600 text-white shadow-sm shadow-rose-900/20 hover:bg-rose-700 hover:shadow-md',
  ghost: 'text-slate-600 hover:bg-slate-100',
};

const spinner: Record<Variant, string> = {
  primary: 'border-white/40 border-t-white',
  danger: 'border-white/40 border-t-white',
  secondary: 'border-slate-300 border-t-slate-500',
  ghost: 'border-slate-300 border-t-slate-500',
};

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  loading?: boolean;
}

const FOCUS =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/60 focus-visible:ring-offset-2';

export default function Button({
  variant = 'primary',
  loading = false,
  disabled,
  className = '',
  children,
  ...rest
}: Props) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all duration-150 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100 disabled:shadow-none ${FOCUS} ${styles[variant]} ${className}`}
      disabled={disabled || loading}
      {...rest}
    >
      {loading && (
        <span
          className={`h-4 w-4 animate-spin rounded-full border-2 ${spinner[variant]}`}
        />
      )}
      {children}
    </button>
  );
}
