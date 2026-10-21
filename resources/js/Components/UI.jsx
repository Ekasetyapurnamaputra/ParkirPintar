import React, { forwardRef, useId, useState } from 'react';
import {
    CheckCircleIcon,
    ExclamationTriangleIcon,
    EyeIcon,
    EyeSlashIcon,
    InformationCircleIcon,
} from '@heroicons/react/24/outline';

/* ------------------------------------------------------------------ *
 * Spinner
 * ------------------------------------------------------------------ */
export function Spinner({ className = 'h-4 w-4' }) {
    return (
        <svg
            className={`animate-spin ${className}`}
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
        >
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l2-2.647z"
            />
        </svg>
    );
}

/* ------------------------------------------------------------------ *
 * BrandMark
 * ------------------------------------------------------------------ */
export function BrandMark({ size = 'md', className = '' }) {
    const sizes = {
        sm: 'h-9 w-9 rounded-xl text-lg',
        md: 'h-11 w-11 rounded-xl text-xl',
        lg: 'h-16 w-16 rounded-2xl text-3xl',
    };

    return (
        <div
            className={`${sizes[size] || sizes.md} flex shrink-0 items-center justify-center bg-gradient-to-tr from-amber-500 via-amber-400 to-yellow-300 font-black text-slate-950 shadow-lg shadow-amber-500/25 ${className}`}
            aria-hidden="true"
        >
            P
        </div>
    );
}

/* ------------------------------------------------------------------ *
 * Alert
 * ------------------------------------------------------------------ */
const ALERT_STYLES = {
    success: {
        wrap: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-200',
        icon: 'text-emerald-400',
        Icon: CheckCircleIcon,
    },
    error: {
        wrap: 'bg-rose-500/10 border-rose-500/30 text-rose-200',
        icon: 'text-rose-400',
        Icon: ExclamationTriangleIcon,
    },
    warning: {
        wrap: 'bg-amber-500/10 border-amber-500/30 text-amber-200',
        icon: 'text-amber-400',
        Icon: ExclamationTriangleIcon,
    },
    info: {
        wrap: 'bg-sky-500/10 border-sky-500/30 text-sky-200',
        icon: 'text-sky-400',
        Icon: InformationCircleIcon,
    },
};

export function Alert({ variant = 'info', title, children, className = '' }) {
    const style = ALERT_STYLES[variant] || ALERT_STYLES.info;
    const { Icon } = style;

    return (
        <div
            role="alert"
            className={`flex items-start gap-3 rounded-xl border px-4 py-3 text-sm ${style.wrap} ${className}`}
        >
            <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${style.icon}`} aria-hidden="true" />
            <div className="min-w-0 flex-1">
                {title && <p className="font-bold">{title}</p>}
                {children && (
                    <div className={title ? 'mt-0.5 leading-relaxed' : 'leading-relaxed'}>{children}</div>
                )}
            </div>
        </div>
    );
}

/* ------------------------------------------------------------------ *
 * TextField
 * ------------------------------------------------------------------ */
export const TextField = forwardRef(function TextField(
    { label, icon: Icon, type = 'text', error, hint, className = '', containerClassName = '', ...props },
    ref
) {
    const id = useId();
    const [revealed, setRevealed] = useState(false);
    const isPassword = type === 'password';

    return (
        <div className={containerClassName}>
            {label && (
                <label htmlFor={id} className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-300">
                    {label}
                </label>
            )}

            <div className="relative">
                {Icon && (
                    <span className="pointer-events-none absolute inset-y-0 left-0 flex w-11 items-center justify-center text-slate-500">
                        <Icon className="h-5 w-5" aria-hidden="true" />
                    </span>
                )}

                <input
                    ref={ref}
                    id={id}
                    type={isPassword && revealed ? 'text' : type}
                    aria-invalid={error ? 'true' : undefined}
                    aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
                    className={`block w-full rounded-xl border bg-slate-900/70 py-3 text-sm text-white placeholder:text-slate-500 transition focus:outline-none focus:ring-2 focus:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-60 ${Icon ? 'pl-11' : 'pl-4'} ${isPassword ? 'pr-11' : 'pr-4'} ${error ? 'border-rose-500/60 focus:border-rose-500 focus:ring-rose-500/40' : 'border-slate-700 focus:border-amber-500 focus:ring-amber-500/30'} ${className}`}
                    {...props}
                />

                {isPassword && (
                    <button
                        type="button"
                        onClick={() => setRevealed((v) => !v)}
                        className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-slate-500 transition hover:text-amber-400 focus:outline-none"
                        aria-label={revealed ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                        tabIndex={-1}
                    >
                        {revealed ? (
                            <EyeSlashIcon className="h-5 w-5" aria-hidden="true" />
                        ) : (
                            <EyeIcon className="h-5 w-5" aria-hidden="true" />
                        )}
                    </button>
                )}
            </div>

            {error ? (
                <p id={`${id}-error`} className="mt-1.5 text-xs font-medium text-rose-400">
                    {error}
                </p>
            ) : hint ? (
                <p id={`${id}-hint`} className="mt-1.5 text-xs text-slate-500">
                    {hint}
                </p>
            ) : null}
        </div>
    );
});

/* ------------------------------------------------------------------ *
 * Button
 * ------------------------------------------------------------------ */
export function Button({
    children,
    loading = false,
    loadingText,
    variant = 'primary',
    className = '',
    type = 'button',
    disabled,
    ...props
}) {
    const variants = {
        primary:
            'bg-gradient-to-r from-amber-500 to-amber-400 text-slate-950 shadow-lg shadow-amber-500/25 hover:from-amber-400 hover:to-amber-300 focus-visible:ring-amber-400',
        secondary:
            'bg-slate-800 text-slate-100 border border-slate-700 hover:bg-slate-700 focus-visible:ring-slate-500',
        ghost:
            'bg-transparent text-slate-300 border border-slate-800 hover:bg-slate-800/60 hover:text-white focus-visible:ring-slate-600',
    };

    return (
        <button
            type={type}
            disabled={disabled || loading}
            className={`inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold transition focus:outline-none focus-visible:ring-2 disabled:cursor-not-allowed disabled:opacity-60 ${variants[variant] || variants.primary} ${className}`}
            {...props}
        >
            {loading && <Spinner />}
            {loading && loadingText ? <span>{loadingText}</span> : children}
        </button>
    );
}

