import type { ButtonHTMLAttributes } from 'react';
import './Button.css';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Visual emphasis */
  variant?: 'primary' | 'secondary' | 'ghost';
}

export function Button({ variant = 'primary', className = '', ...props }: ButtonProps) {
  return <button className={`ds-button ds-button--${variant} ${className}`.trim()} {...props} />;
}
