import { cn } from '@/lib/utils';
import { ButtonHTMLAttributes, forwardRef } from 'react';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', children, ...props }, ref) => {
    const baseStyles = 'inline-flex items-center justify-center font-semibold transition-all duration-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed';

    const variants = {
      primary: 'bg-primary-blue text-white hover:bg-primary-blue-hover hover:shadow-md hover:scale-[1.02]',
      secondary: 'bg-white text-primary-blue border-2 border-primary-blue hover:bg-primary-blue-hover hover:border-primary-blue-hover hover:text-white',
      outline: 'bg-transparent text-text-primary border border-border hover:bg-gray-50',
    };
    
    const sizes = {
      sm: 'px-4 py-2 text-sm',
      md: 'px-6 py-3 text-base',
      lg: 'px-8 py-4 text-lg',
    };

    return (
      <button
        ref={ref}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';

export default Button;
