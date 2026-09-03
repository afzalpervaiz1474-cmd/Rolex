import { useId, type InputHTMLAttributes, type SelectHTMLAttributes, type TextareaHTMLAttributes, type ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '../../lib/utils';

export const fieldClass =
  'w-full rounded-sm border bg-white/[0.03] px-4 text-sm text-ivory placeholder:text-dim outline-none transition-all duration-300 focus:border-gold/60 focus:bg-white/[0.05] focus:ring-1 focus:ring-gold/20 disabled:opacity-50';

interface WrapperProps {
  id: string;
  label?: string;
  error?: string;
  hint?: string;
  required?: boolean;
  children: ReactNode;
  className?: string;
}

function Wrapper({ id, label, error, hint, required, children, className }: WrapperProps) {
  return (
    <div className={cn('flex flex-col gap-2', className)}>
      {label && (
        <label htmlFor={id} className="font-mono text-[0.62rem] uppercase tracking-[0.25em] text-muted">
          {label}
          {required && <span className="ml-1 text-gold">*</span>}
        </label>
      )}
      {children}
      {error ? (
        <p id={`${id}-error`} role="alert" className="text-xs text-danger">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="text-xs text-dim">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  wrapperClassName?: string;
}

export function Input({ label, error, hint, id, className, wrapperClassName, required, ...rest }: InputProps) {
  const auto = useId();
  const inputId = id ?? auto;
  return (
    <Wrapper id={inputId} label={label} error={error} hint={hint} required={required} className={wrapperClassName}>
      <input
        id={inputId}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
        className={cn(fieldClass, 'h-12', error ? 'border-danger/60' : 'border-edge', className)}
        required={required}
        {...rest}
      />
    </Wrapper>
  );
}

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
  wrapperClassName?: string;
}

export function Textarea({ label, error, hint, id, className, wrapperClassName, required, ...rest }: TextareaProps) {
  const auto = useId();
  const inputId = id ?? auto;
  return (
    <Wrapper id={inputId} label={label} error={error} hint={hint} required={required} className={wrapperClassName}>
      <textarea
        id={inputId}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
        className={cn(fieldClass, 'min-h-[120px] py-3 leading-relaxed', error ? 'border-danger/60' : 'border-edge', className)}
        required={required}
        {...rest}
      />
    </Wrapper>
  );
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  hint?: string;
  wrapperClassName?: string;
  options: { value: string; label: string }[];
  placeholder?: string;
}

export function Select({ label, error, hint, id, className, wrapperClassName, options, placeholder, required, ...rest }: SelectProps) {
  const auto = useId();
  const inputId = id ?? auto;
  return (
    <Wrapper id={inputId} label={label} error={error} hint={hint} required={required} className={wrapperClassName}>
      <div className="relative">
        <select
          id={inputId}
          aria-invalid={Boolean(error)}
          className={cn(fieldClass, 'h-12 appearance-none pr-10 [&>option]:bg-surface', error ? 'border-danger/60' : 'border-edge', className)}
          required={required}
          {...rest}
        >
          {placeholder && <option value="">{placeholder}</option>}
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <ChevronDown size={16} className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-muted" aria-hidden="true" />
      </div>
    </Wrapper>
  );
}

interface CheckboxProps extends InputHTMLAttributes<HTMLInputElement> {
  label: ReactNode;
  description?: string;
}

export function Checkbox({ label, description, id, className, ...rest }: CheckboxProps) {
  const auto = useId();
  const inputId = id ?? auto;
  return (
    <label htmlFor={inputId} className={cn('flex cursor-pointer items-start gap-3 text-sm text-muted', className)}>
      <input
        id={inputId}
        type="checkbox"
        className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer appearance-none rounded-[3px] border border-edge-strong bg-white/[0.03] transition checked:border-gold checked:bg-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/50 relative after:absolute after:left-[4px] after:top-[1px] after:hidden after:h-[9px] after:w-[5px] after:rotate-45 after:border-b-2 after:border-r-2 after:border-void checked:after:block"
        {...rest}
      />
      <span>
        <span className="text-ivory">{label}</span>
        {description && <span className="mt-0.5 block text-xs text-dim">{description}</span>}
      </span>
    </label>
  );
}
