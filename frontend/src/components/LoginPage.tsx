import { useState, useEffect, useRef, type FormEvent } from 'react'
import { Link } from 'react-router-dom'

import BrandLogo from './ui/BrandLogo'
import Button from './ui/Button'
import Field from './ui/Field'
import ThemeToggle from './ui/ThemeToggle'
import './LoginPage.css'

// ─── EyeBall sub-component ────────────────────────────────────
interface EyeBallProps {
  size?: number
  pupilSize?: number
  maxDistance?: number
  eyeColor?: string
  pupilColor?: string
  isBlinking?: boolean
  forceLookX?: number
  forceLookY?: number
}

function EyeBall({
  size = 20,
  pupilSize = 8,
  maxDistance = 5,
  eyeColor = 'white',
  pupilColor = '#0d1829',
  isBlinking = false,
  forceLookX,
  forceLookY,
}: EyeBallProps) {
  const [mouse, setMouse] = useState({ x: 0, y: 0 })
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const h = (e: MouseEvent) => setMouse({ x: e.clientX, y: e.clientY })
    window.addEventListener('mousemove', h)
    return () => window.removeEventListener('mousemove', h)
  }, [])

  const getPos = () => {
    if (forceLookX !== undefined && forceLookY !== undefined) return { x: forceLookX, y: forceLookY }
    if (!ref.current) return { x: 0, y: 0 }
    const r = ref.current.getBoundingClientRect()
    const dx = mouse.x - (r.left + r.width / 2)
    const dy = mouse.y - (r.top + r.height / 2)
    const dist = Math.min(Math.sqrt(dx ** 2 + dy ** 2), maxDistance)
    const angle = Math.atan2(dy, dx)
    return { x: Math.cos(angle) * dist, y: Math.sin(angle) * dist }
  }

  const { x, y } = getPos()

  return (
    <div
      ref={ref}
      style={{
        width: `${size}px`,
        height: isBlinking ? '2px' : `${size}px`,
        backgroundColor: eyeColor,
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        transition: 'height 0.12s ease',
        flexShrink: 0,
      }}
    >
      {!isBlinking && (
        <div
          style={{
            width: `${pupilSize}px`,
            height: `${pupilSize}px`,
            backgroundColor: pupilColor,
            borderRadius: '50%',
            transform: `translate(${x}px, ${y}px)`,
            transition: 'transform 0.1s ease-out',
          }}
        />
      )}
    </div>
  )
}

// ─── Pupil sub-component ─────────────────────────────────────
interface PupilProps {
  size?: number
  maxDistance?: number
  pupilColor?: string
  forceLookX?: number
  forceLookY?: number
}

function Pupil({ size = 12, maxDistance = 5, pupilColor = '#0d1829', forceLookX, forceLookY }: PupilProps) {
  const [mouse, setMouse] = useState({ x: 0, y: 0 })
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const h = (e: MouseEvent) => setMouse({ x: e.clientX, y: e.clientY })
    window.addEventListener('mousemove', h)
    return () => window.removeEventListener('mousemove', h)
  }, [])

  const getPos = () => {
    if (forceLookX !== undefined && forceLookY !== undefined) return { x: forceLookX, y: forceLookY }
    if (!ref.current) return { x: 0, y: 0 }
    const r = ref.current.getBoundingClientRect()
    const dx = mouse.x - (r.left + r.width / 2)
    const dy = mouse.y - (r.top + r.height / 2)
    const dist = Math.min(Math.sqrt(dx ** 2 + dy ** 2), maxDistance)
    const angle = Math.atan2(dy, dx)
    return { x: Math.cos(angle) * dist, y: Math.sin(angle) * dist }
  }

  const { x, y } = getPos()

  return (
    <div
      ref={ref}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        backgroundColor: pupilColor,
        borderRadius: '50%',
        transform: `translate(${x}px, ${y}px)`,
        transition: 'transform 0.1s ease-out',
        flexShrink: 0,
      }}
    />
  )
}

// ─── Main Login Page ──────────────────────────────────────────
interface LoginPageProps {
  onLogin: (email: string, password: string) => Promise<void>
  isLoading: boolean
  error: string | null
  onClearError: () => void
}

interface FormErrors {
  email?: string
  password?: string
}

const validateEmail = (email: string): boolean => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)

export default function LoginPage({ onLogin, isLoading, error, onClearError }: LoginPageProps) {
  // Form state
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [formErrors, setFormErrors] = useState<FormErrors>({})

  // Character animation state
  const [mouseX, setMouseX] = useState(0)
  const [mouseY, setMouseY] = useState(0)
  const [isPurpleBlinking, setIsPurpleBlinking] = useState(false)
  const [isBlackBlinking, setIsBlackBlinking] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const [isLookingAtEachOther, setIsLookingAtEachOther] = useState(false)
  const [isPurplePeeking, setIsPurplePeeking] = useState(false)

  const purpleRef = useRef<HTMLDivElement>(null)
  const blackRef = useRef<HTMLDivElement>(null)
  const yellowRef = useRef<HTMLDivElement>(null)
  const orangeRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const h = (e: MouseEvent) => { setMouseX(e.clientX); setMouseY(e.clientY) }
    window.addEventListener('mousemove', h)
    return () => window.removeEventListener('mousemove', h)
  }, [])

  // Staggered random blinking
  useEffect(() => {
    const sched = () => {
      const t = setTimeout(() => {
        setIsPurpleBlinking(true)
        setTimeout(() => { setIsPurpleBlinking(false); sched() }, 150)
      }, Math.random() * 4000 + 3000)
      return t
    }
    const t = sched()
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    const sched = () => {
      const t = setTimeout(() => {
        setIsBlackBlinking(true)
        setTimeout(() => { setIsBlackBlinking(false); sched() }, 150)
      }, Math.random() * 4000 + 3500)
      return t
    }
    const t = sched()
    return () => clearTimeout(t)
  }, [])

  // Look at each other briefly when user starts typing
  useEffect(() => {
    if (isTyping) {
      setIsLookingAtEachOther(true)
      const t = setTimeout(() => setIsLookingAtEachOther(false), 800)
      return () => clearTimeout(t)
    }
    setIsLookingAtEachOther(false)
  }, [isTyping])

  // Purple peeks when password is visible
  useEffect(() => {
    if (password.length > 0 && showPassword) {
      const t = setTimeout(() => {
        setIsPurplePeeking(true)
        setTimeout(() => setIsPurplePeeking(false), 800)
      }, Math.random() * 3000 + 2000)
      return () => clearTimeout(t)
    }
    setIsPurplePeeking(false)
  }, [password, showPassword, isPurplePeeking])

  // Calculate body lean and face tracking for each character
  const calcPos = (ref: React.RefObject<HTMLDivElement | null>) => {
    if (!ref.current) return { faceX: 0, faceY: 0, bodySkew: 0 }
    const r = ref.current.getBoundingClientRect()
    const cx = r.left + r.width / 2
    const cy = r.top + r.height / 3
    const dx = mouseX - cx
    const dy = mouseY - cy
    return {
      faceX: Math.max(-15, Math.min(15, dx / 20)),
      faceY: Math.max(-10, Math.min(10, dy / 30)),
      bodySkew: Math.max(-6, Math.min(6, -dx / 120)),
    }
  }

  const purplePos = calcPos(purpleRef)
  const blackPos = calcPos(blackRef)
  const yellowPos = calcPos(yellowRef)
  const orangePos = calcPos(orangeRef)

  // Form helpers
  const validateForm = (): boolean => {
    const errs: FormErrors = {}
    if (!email.trim()) errs.email = 'Email is required.'
    else if (!validateEmail(email)) errs.email = 'Enter a valid email address.'
    if (!password) errs.password = 'Password is required.'
    else if (password.length < 6) errs.password = 'Password must be at least 6 characters.'
    setFormErrors(errs)
    return Object.keys(errs).length === 0
  }

  const clearFieldError = (field: keyof FormErrors) => {
    if (formErrors[field]) setFormErrors(c => ({ ...c, [field]: undefined }))
    if (error) onClearError()
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!validateForm()) return
    await onLogin(email.trim(), password)
  }

  // Derived boolean for hiding state
  const isHiding = password.length > 0 && !showPassword
  const isRevealed = password.length > 0 && showPassword

  return (
    <div className="login-split">

      {/* ════════════════════════════════════════
          LEFT — Characters panel (desktop only)
          ════════════════════════════════════════ */}
      <div className="login-left">
        {/* Grid overlay */}
        <div className="login-left__grid" aria-hidden="true" />

        {/* Brand */}
        <div className="login-left__brand">
          <BrandLogo large title="" />
        </div>

        {/* Characters scene */}
        <div className="login-left__scene">
          <div style={{ position: 'relative', width: '460px', height: '340px' }}>

            {/* ── Purple tall rect – back layer ── */}
            <div
              ref={purpleRef}
              style={{
                position: 'absolute',
                bottom: 0,
                left: '55px',
                width: '155px',
                height: (isTyping || isHiding) ? '390px' : '350px',
                backgroundColor: '#6C3FF5',
                borderRadius: '10px 10px 0 0',
                zIndex: 1,
                transition: 'all 0.7s cubic-bezier(0.16,1,0.3,1)',
                transform: isRevealed
                  ? 'skewX(0deg)'
                  : (isTyping || isHiding)
                    ? `skewX(${(purplePos.bodySkew || 0) - 12}deg) translateX(34px)`
                    : `skewX(${purplePos.bodySkew || 0}deg)`,
                transformOrigin: 'bottom center',
              }}
            >
              <div style={{
                position: 'absolute',
                display: 'flex',
                gap: '1.75rem',
                transition: 'all 0.7s cubic-bezier(0.16,1,0.3,1)',
                left: `${isRevealed ? 16 : isLookingAtEachOther ? 46 : 38 + purplePos.faceX}px`,
                top: `${isRevealed ? 28 : isLookingAtEachOther ? 54 : 32 + purplePos.faceY}px`,
              }}>
                <EyeBall size={18} pupilSize={7} maxDistance={5} eyeColor="white" pupilColor="#0d1829" isBlinking={isPurpleBlinking}
                  forceLookX={isRevealed ? (isPurplePeeking ? 4 : -4) : isLookingAtEachOther ? 3 : undefined}
                  forceLookY={isRevealed ? (isPurplePeeking ? 5 : -4) : isLookingAtEachOther ? 4 : undefined} />
                <EyeBall size={18} pupilSize={7} maxDistance={5} eyeColor="white" pupilColor="#0d1829" isBlinking={isPurpleBlinking}
                  forceLookX={isRevealed ? (isPurplePeeking ? 4 : -4) : isLookingAtEachOther ? 3 : undefined}
                  forceLookY={isRevealed ? (isPurplePeeking ? 5 : -4) : isLookingAtEachOther ? 4 : undefined} />
              </div>
            </div>

            {/* ── Dark navy rect – middle layer ── */}
            <div
              ref={blackRef}
              style={{
                position: 'absolute',
                bottom: 0,
                left: '200px',
                width: '105px',
                height: '268px',
                backgroundColor: '#1a2540',
                borderRadius: '8px 8px 0 0',
                zIndex: 2,
                transition: 'all 0.7s cubic-bezier(0.16,1,0.3,1)',
                transform: isRevealed
                  ? 'skewX(0deg)'
                  : isLookingAtEachOther
                    ? `skewX(${(blackPos.bodySkew || 0) * 1.5 + 10}deg) translateX(16px)`
                    : (isTyping || isHiding)
                      ? `skewX(${(blackPos.bodySkew || 0) * 1.5}deg)`
                      : `skewX(${blackPos.bodySkew || 0}deg)`,
                transformOrigin: 'bottom center',
              }}
            >
              <div style={{
                position: 'absolute',
                display: 'flex',
                gap: '1.4rem',
                transition: 'all 0.7s cubic-bezier(0.16,1,0.3,1)',
                left: `${isRevealed ? 8 : isLookingAtEachOther ? 26 : 20 + blackPos.faceX}px`,
                top: `${isRevealed ? 22 : isLookingAtEachOther ? 9 : 26 + blackPos.faceY}px`,
              }}>
                <EyeBall size={16} pupilSize={6} maxDistance={4} eyeColor="white" pupilColor="#0d1829" isBlinking={isBlackBlinking}
                  forceLookX={isRevealed ? -4 : isLookingAtEachOther ? 0 : undefined}
                  forceLookY={isRevealed ? -4 : isLookingAtEachOther ? -4 : undefined} />
                <EyeBall size={16} pupilSize={6} maxDistance={4} eyeColor="white" pupilColor="#0d1829" isBlinking={isBlackBlinking}
                  forceLookX={isRevealed ? -4 : isLookingAtEachOther ? 0 : undefined}
                  forceLookY={isRevealed ? -4 : isLookingAtEachOther ? -4 : undefined} />
              </div>
            </div>

            {/* ── Orange semi-circle – front left ── */}
            <div
              ref={orangeRef}
              style={{
                position: 'absolute',
                bottom: 0,
                left: '0px',
                width: '210px',
                height: '172px',
                backgroundColor: '#FF9B6B',
                borderRadius: '105px 105px 0 0',
                zIndex: 3,
                transition: 'all 0.7s cubic-bezier(0.16,1,0.3,1)',
                transform: isRevealed ? 'skewX(0deg)' : `skewX(${orangePos.bodySkew || 0}deg)`,
                transformOrigin: 'bottom center',
              }}
            >
              <div style={{
                position: 'absolute',
                display: 'flex',
                gap: '1.75rem',
                transition: 'all 0.2s ease-out',
                left: `${isRevealed ? 44 : 72 + (orangePos.faceX || 0)}px`,
                top: `${isRevealed ? 75 : 78 + (orangePos.faceY || 0)}px`,
              }}>
                <Pupil size={12} maxDistance={5} pupilColor="#0d1829"
                  forceLookX={isRevealed ? -5 : undefined} forceLookY={isRevealed ? -4 : undefined} />
                <Pupil size={12} maxDistance={5} pupilColor="#0d1829"
                  forceLookX={isRevealed ? -5 : undefined} forceLookY={isRevealed ? -4 : undefined} />
              </div>
            </div>

            {/* ── Yellow pill – front right ── */}
            <div
              ref={yellowRef}
              style={{
                position: 'absolute',
                bottom: 0,
                left: '270px',
                width: '125px',
                height: '200px',
                backgroundColor: '#E8D754',
                borderRadius: '62px 62px 0 0',
                zIndex: 4,
                transition: 'all 0.7s cubic-bezier(0.16,1,0.3,1)',
                transform: isRevealed ? 'skewX(0deg)' : `skewX(${yellowPos.bodySkew || 0}deg)`,
                transformOrigin: 'bottom center',
              }}
            >
              <div style={{
                position: 'absolute',
                display: 'flex',
                gap: '1.4rem',
                transition: 'all 0.2s ease-out',
                left: `${isRevealed ? 16 : 44 + (yellowPos.faceX || 0)}px`,
                top: `${isRevealed ? 30 : 34 + (yellowPos.faceY || 0)}px`,
              }}>
                <Pupil size={12} maxDistance={5} pupilColor="#0d1829"
                  forceLookX={isRevealed ? -5 : undefined} forceLookY={isRevealed ? -4 : undefined} />
                <Pupil size={12} maxDistance={5} pupilColor="#0d1829"
                  forceLookX={isRevealed ? -5 : undefined} forceLookY={isRevealed ? -4 : undefined} />
              </div>
              {/* Mouth */}
              <div style={{
                position: 'absolute',
                width: '4rem',
                height: '4px',
                backgroundColor: '#0d1829',
                borderRadius: '999px',
                transition: 'all 0.2s ease-out',
                left: `${isRevealed ? 8 : 34 + (yellowPos.faceX || 0)}px`,
                top: `${isRevealed ? 80 : 80 + (yellowPos.faceY || 0)}px`,
              }} />
            </div>

          </div>
        </div>

        {/* Decorative ambient blobs */}
        <div className="login-left__blob login-left__blob--a" aria-hidden="true" />
        <div className="login-left__blob login-left__blob--b" aria-hidden="true" />
      </div>

      {/* ════════════════════════════════════════
          RIGHT — Login form
          ════════════════════════════════════════ */}
      <div className="login-right">
        <div className="login-right__theme">
          <ThemeToggle />
        </div>

        {/* Mobile-only brand mark */}
        <div className="login-right__mobile-brand">
          <BrandLogo centered large title="" />
        </div>

        <div className="ui-auth-card login-card animate-fade-up">
          <div className="ui-auth-header">
            <div className="ui-fields">
              <h1 className="ui-auth-title">Sign in</h1>
              <p className="ui-auth-description">Welcome back — sign in to continue.</p>
            </div>
          </div>

          {error ? (
            <section className="ui-alert ui-alert--error" role="alert">
              <p className="ui-alert__content">{error}</p>
              <button type="button" className="ui-link-button" onClick={onClearError}>Dismiss</button>
            </section>
          ) : null}

          <form className="ui-fields" onSubmit={handleSubmit} noValidate>
            <Field label="Email address" htmlFor="login-email" error={formErrors.email}>
              <input
                id="login-email"
                type="email"
                className="ui-input"
                placeholder="name@university.edu"
                value={email}
                onChange={e => { setEmail(e.target.value); clearFieldError('email') }}
                onFocus={() => setIsTyping(true)}
                onBlur={() => setIsTyping(false)}
                disabled={isLoading}
                autoComplete="email"
              />
            </Field>

            <Field label="Password" htmlFor="login-password" error={formErrors.password}>
              <div className="ui-password">
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  className="ui-input"
                  placeholder="Enter your password"
                  value={password}
                  onChange={e => { setPassword(e.target.value); clearFieldError('password') }}
                  disabled={isLoading}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="ui-password-toggle"
                  onClick={() => setShowPassword(c => !c)}
                  disabled={isLoading}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </Field>

            <div className="ui-meta-row">
              <label className="ui-check">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={e => setRememberMe(e.target.checked)}
                  disabled={isLoading}
                />
                <span>Remember me</span>
              </label>
              <button type="button" className="ui-link-button" disabled={isLoading}>
                Forgot password?
              </button>
            </div>

            <Button type="submit" loading={isLoading} fullWidth size="lg">
              {isLoading ? 'Signing in' : 'Sign in'}
            </Button>

            <div className="ui-auth-footer-inline">
              <p className="ui-auth-description">
                New here? <Link to="/register">Create an account</Link>.
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
