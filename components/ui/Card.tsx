import { cn } from '@/lib/utils';
import { HTMLAttributes } from 'react';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  hover?: boolean;
}

export default function Card({ className, hover = true, children, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'bg-card border border-border rounded-lg shadow-sm transition-all duration-200',
        hover && 'hover:shadow-md hover:scale-[1.01] cursor-pointer',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
