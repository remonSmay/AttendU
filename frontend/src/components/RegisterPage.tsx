import { useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import { Link } from 'react-router-dom'

import type { RegisterPayload } from '../features/auth/types/authTypes'
import BrandLogo from './ui/BrandLogo'
import Button from './ui/Button'
import Field from './ui/Field'
import ThemeToggle from './ui/ThemeToggle'
import './RegisterPage.css'

interface RegisterPageProps {
  onRegister: (data: RegisterPayload) => Promise<void>
  isLoading: boolean
  error: string | null
  onClearError: () => void
}

export default function RegisterPage({
  onRegister,
  isLoading,
  error,
  onClearError,
}: RegisterPageProps) {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [role, setRole] = useState<'admin' | 'instructor'>('instructor')
  const [validationError, setValidationError] = useState<string | null>(null)

  const clearErrors = () => {
    if (validationError) {
      setValidationError(null)
    }

    if (error) {
      onClearError()
    }
  }

  const handleInputChange =
    (setter: (value: string) => void) =>
    (event: ChangeEvent<HTMLInputElement>) => {
      setter(event.target.value)
      clearErrors()
    }

  const validateEmail = (value: string): boolean => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (fullName.trim().length < 2) {
      setValidationError('Full name must be at least 2 characters long.')
      return
    }

    if (fullName.trim().length > 100) {
      setValidationError('Full name must be at most 100 characters long.')
      return
    }

    if (!validateEmail(email.trim())) {
      setValidationError('Please enter a valid email address.')
      return
    }

    if (password.length < 6) {
      setValidationError('Password must be at least 6 characters long.')
      return
    }

    if (password.length > 128) {
      setValidationError('Password must be at most 128 characters long.')
      return
    }

    if (password !== confirmPassword) {
      setValidationError('Passwords do not match.')
      return
    }

    setValidationError(null)
    void onRegister({
      full_name: fullName.trim(),
      email: email.trim(),
      password,
      role,
    })
  }

  const displayError = validationError || error

  return (
    <div className="ui-auth-page register-page">
      <div className="ui-auth-theme-row">
        <ThemeToggle />
      </div>
      <div className="ui-auth-card animate-fade-up">
        <div className="ui-auth-header">
          <BrandLogo centered large title="" />
          <div className="ui-fields">
            <h1 className="ui-auth-title">Create Account</h1>
            <p className="ui-auth-description">Set up your account to get started.</p>
          </div>
        </div>

        {displayError ? (
          <section className="ui-alert ui-alert--error" role="alert">
            <p className="ui-alert__content">{displayError}</p>
            <button type="button" className="ui-link-button" onClick={clearErrors}>
              Dismiss
            </button>
          </section>
        ) : null}

        <form className="register-form-grid" onSubmit={handleSubmit} noValidate>
          <Field label="Full name" htmlFor="register-full-name" span={2}>
            <input
              id="register-full-name"
              type="text"
              required
              className="ui-input"
              placeholder="John Doe"
              value={fullName}
              onChange={handleInputChange(setFullName)}
              disabled={isLoading}
              autoComplete="name"
            />
          </Field>

          <Field label="Email address" htmlFor="register-email" span={2}>
            <input
              id="register-email"
              type="email"
              required
              className="ui-input"
              placeholder="name@university.edu"
              value={email}
              onChange={handleInputChange(setEmail)}
              disabled={isLoading}
              autoComplete="email"
            />
          </Field>

          <Field label="Role" span={2}>
            <div className="ui-segment-grid">
              <label className="ui-radio-card">
                <input
                  type="radio"
                  name="role"
                  value="instructor"
                  checked={role === 'instructor'}
                  onChange={() => {
                    setRole('instructor')
                    clearErrors()
                  }}
                  disabled={isLoading}
                />
                <span className="ui-radio-card__content">
                  <span className="ui-radio-card__title">Instructor</span>
                  <span className="ui-radio-card__meta">Manage your sections and attendance sessions.</span>
                </span>
              </label>

              <label className="ui-radio-card">
                <input
                  type="radio"
                  name="role"
                  value="admin"
                  checked={role === 'admin'}
                  onChange={() => {
                    setRole('admin')
                    clearErrors()
                  }}
                  disabled={isLoading}
                />
                <span className="ui-radio-card__content">
                  <span className="ui-radio-card__title">Admin</span>
                  <span className="ui-radio-card__meta">Access the full control panel and system records.</span>
                </span>
              </label>
            </div>
          </Field>

          <Field label="Password" htmlFor="register-password">
            <div className="ui-password">
              <input
                id="register-password"
                type={showPassword ? 'text' : 'password'}
                required
                className="ui-input"
                placeholder="Create a strong password"
                value={password}
                onChange={handleInputChange(setPassword)}
                disabled={isLoading}
                autoComplete="new-password"
              />
              <button
                type="button"
                className="ui-password-toggle"
                onClick={() => setShowPassword((current) => !current)}
                disabled={isLoading}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
          </Field>

          <Field label="Confirm password" htmlFor="register-confirm-password">
            <div className="ui-password">
              <input
                id="register-confirm-password"
                type={showConfirmPassword ? 'text' : 'password'}
                required
                className="ui-input"
                placeholder="Repeat your password"
                value={confirmPassword}
                onChange={handleInputChange(setConfirmPassword)}
                disabled={isLoading}
                autoComplete="new-password"
              />
              <button
                type="button"
                className="ui-password-toggle"
                onClick={() => setShowConfirmPassword((current) => !current)}
                disabled={isLoading}
                aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
              >
                {showConfirmPassword ? 'Hide' : 'Show'}
              </button>
            </div>
          </Field>

          <div className="register-submit-row">
            <Button type="submit" loading={isLoading} fullWidth size="lg">
              {isLoading ? 'Creating account' : 'Create account'}
            </Button>
          </div>
        </form>

        <div className="ui-auth-footer">
          <p className="ui-auth-description">
            Already have an account? <Link to="/login">Sign in</Link>.
          </p>
        </div>
      </div>
    </div>
  )
}
