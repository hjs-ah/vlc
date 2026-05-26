import styles from './Button.module.css'

const variants = {
  ink:     styles.ink,
  blue:    styles.blue,
  orange:  styles.orange,
  outline: styles.outline,
  ghost:   styles.ghost,
  danger:  styles.danger,
}

const sizes = {
  sm: styles.sm,
  md: styles.md,
  lg: styles.lg,
}

export default function Button({
  children,
  variant = 'ink',
  size = 'md',
  className = '',
  ...props
}) {
  return (
    <button
      className={[styles.btn, variants[variant], sizes[size], className].filter(Boolean).join(' ')}
      {...props}
    >
      {children}
    </button>
  )
}
