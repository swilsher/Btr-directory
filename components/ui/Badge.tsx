import { cn } from '@/lib/utils';
import { HTMLAttributes } from 'react';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info';
}

export default function Badge({ className, variant = 'default', children, ...props }: BadgeProps) {
  const variants = {
    default: 'bg-blue-50 text-primary-blue',
    success: 'bg-green-100 text-green-700',
    warning: 'bg-orange-100 text-orange-700',
    error: 'bg-red-100 text-red-700',
    info: 'bg-primary-blue-light text-primary-blue',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold',
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
