import type { HTMLAttributes } from 'react';

type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  variant?: 'success' | 'neutral' | 'warning';
};

export function Badge({ className = '', variant = 'neutral', ...props }: BadgeProps) {
  return (
    <span
      {...props}
      className={`ui-badge ui-badge--${variant}${className ? ` ${className}` : ''}`}
    />
  );
}
