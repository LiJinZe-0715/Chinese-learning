import type { ComponentProps } from 'react';
export function Button({
  className = '',
  variant = 'default',
  type = 'button',
  ...props
}: ComponentProps<'button'> & { variant?: 'default' | 'outline' | 'ghost' }) {
  return (
    <button
      type={type}
      className={`ui-button ${variant} ${className}`}
      {...props}
    />
  );
}
export function Input({ className = '', ...props }: ComponentProps<'input'>) {
  return <input className={`ui-input ${className}`} {...props} />;
}
