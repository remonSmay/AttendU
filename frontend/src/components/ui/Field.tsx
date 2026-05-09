import type { ReactNode } from 'react'

interface FieldProps {
  label: string
  htmlFor?: string
  hint?: string
  error?: string | null
  span?: 1 | 2
  children: ReactNode
}

export default function Field({
  label,
  htmlFor,
  hint,
  error,
  span = 1,
  children,
}: FieldProps) {
  const fieldClassName = `ui-field${span === 2 ? ' ui-field--span-2' : ''}`
  const controlClassName = `ui-control${error ? ' ui-control--error' : ''}`

  return (
    <div className={fieldClassName}>
      <div className="ui-field__header">
        <label htmlFor={htmlFor} className="ui-field__label">
          {label}
        </label>
        {hint ? <p className="ui-field__hint">{hint}</p> : null}
      </div>
      <div className={controlClassName}>{children}</div>
      {error ? <p className="ui-field__error">{error}</p> : null}
    </div>
  )
}
