import { createElement, type HTMLAttributes } from 'react';

type CardProps = HTMLAttributes<HTMLElement> & {
  as?: 'article' | 'div' | 'section';
  variant?: 'default' | 'interactive';
};

export function Card({ as = 'div', className = '', variant = 'default', ...props }: CardProps) {
  return createElement(as, {
    ...props,
    className: `ui-card ui-card--${variant}${className ? ` ${className}` : ''}`,
  });
}
