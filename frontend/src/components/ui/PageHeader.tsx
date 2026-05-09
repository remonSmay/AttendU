import type { ReactNode } from 'react'

interface PageHeaderProps {
  eyebrow?: string
  title: string
  description?: string
  actions?: ReactNode
}

export default function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: PageHeaderProps) {
  return (
    <div className="ui-page-header">
      <div className="ui-page-header__copy">
        {eyebrow ? <p className="ui-page-header__eyebrow">{eyebrow}</p> : null}
        <h2 className="ui-page-header__title">{title}</h2>
        {description ? <p className="ui-page-header__description">{description}</p> : null}
      </div>
      {actions}
    </div>
  )
}
