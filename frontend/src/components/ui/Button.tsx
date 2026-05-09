import type { ButtonHTMLAttributes, ReactNode } from 'react'

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'
type ButtonSize = 'sm' | 'md' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  fullWidth?: boolean
  loading?: boolean
  leadingIcon?: ReactNode
}

const sizeClassMap: Record<ButtonSize, string> = {
  sm: 'ui-button--sm',
  md: '',
  lg: 'ui-button--lg',
}

export default function Button({
  type = 'button',
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  loading = false,
  leadingIcon,
  className = '',
  disabled,
  children,
  ...props
}: ButtonProps) {
  const classes = [
    'ui-button',
    `ui-button--${variant}`,
    sizeClassMap[size],
    fullWidth ? 'ui-button--full' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <button type={type} className={classes} disabled={disabled || loading} {...props}>
      {loading ? <span className="ui-button__spinner" aria-hidden="true" /> : leadingIcon ? <span className="ui-button-icon" aria-hidden="true">{leadingIcon}</span> : null}
      <span>{children}</span>
    </button>
  )
}
