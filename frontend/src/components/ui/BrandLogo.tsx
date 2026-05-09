import { useState } from 'react'

interface BrandLogoProps {
  title?: string
  subtitle?: string
  centered?: boolean
  large?: boolean
}

export default function BrandLogo({
  title = 'Attendu',
  subtitle,
  centered = false,
  large = false,
}: BrandLogoProps) {
  const [logoUnavailable, setLogoUnavailable] = useState(false)

  return (
    <div className={`ui-brand${centered ? ' ui-brand--centered' : ''}`}>
      {logoUnavailable ? (
        <div className="ui-brand-fallback" aria-label="Attendu logo fallback">
          ATTENDU
        </div>
      ) : (
        <img
          className={`ui-brand-logo${large ? ' ui-brand-logo--large' : ''}`}
          src="/attendu-logo.png"
          alt="Attendu logo"
          onError={() => setLogoUnavailable(true)}
        />
      )}

      {(title || subtitle) && (
        <div className="ui-brand-copy">
          {title ? <p className="ui-brand-title">{title}</p> : null}
          {subtitle ? <p className="ui-brand-subtitle">{subtitle}</p> : null}
        </div>
      )}
    </div>
  )
}
