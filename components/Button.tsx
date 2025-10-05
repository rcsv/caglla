'use client'

import React from 'react'

type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'accent'
  | 'outline'
  | 'ghost'
  | 'soft'
  | 'danger'
  | 'disabled'

type ButtonSize = 'sm' | 'md' | 'lg'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  fullWidth?: boolean
}

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ')
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  leftIcon,
  rightIcon,
  fullWidth = false,
  className,
  disabled,
  children,
  ...rest
}) => {
  const variantClass = `btn-${variant}`
  const sizeClass = `btn-${size}`

  return (
    <button
      className={cx('btn-base', sizeClass, variantClass, fullWidth && 'w-full', className)}
      disabled={disabled || variant === 'disabled'}
      {...rest}
    >
      {leftIcon ? <span className="inline-flex items-center">{leftIcon}</span> : null}
      <span className="inline-flex items-center">{children}</span>
      {rightIcon ? <span className="inline-flex items-center">{rightIcon}</span> : null}
    </button>
  )
}

export default Button


