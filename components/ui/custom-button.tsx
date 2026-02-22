import React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cn } from '@/lib/utils';

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  asChild?: boolean;
  children: React.ReactNode;
}

export const CustomButton = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', asChild = false, children, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';

    return (
      <Comp
        className={cn(
          'relative inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden',
          {
            'bg-gold-500 text-navy-950 hover:scale-[1.03] hover:shadow-lg before:content-[""] before:absolute before:inset-y-0 before:-left-1/2 before:w-1/2 before:bg-gradient-to-r before:from-transparent before:via-white/50 before:to-transparent before:skew-x-12 before:opacity-0 hover:before:opacity-100 hover:before:translate-x-[200%] before:transition-all before:duration-700':
              variant === 'primary',
            'bg-white border border-warm-200 text-warm-700 hover:border-navy-900 hover:text-navy-900':
              variant === 'secondary',
            'bg-transparent border border-navy-400 text-navy-200 hover:border-gold-500 hover:text-gold-400':
              variant === 'ghost',
            'px-4 py-2 text-sm': size === 'sm',
            'px-6 py-3 text-base': size === 'md',
            'px-8 py-4 text-base': size === 'lg',
          },
          className
        )}
        ref={ref}
        {...props}
      >
        {children}
      </Comp>
    );
  }
);

CustomButton.displayName = 'CustomButton';
