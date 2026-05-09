import { useEffect } from 'react'

import { useAuthActions } from '../features/auth/hooks/useAuthActions'
import { useTheme } from '../context/ThemeContext'
import { authStore } from '../store/authStore'
import { useTopbarSetter } from '../context/TopbarContext'
import './SettingsPage.css'

const IconSun = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4" /><path d="M12 2v2" /><path d="M12 20v2" /><path d="m4.93 4.93 1.41 1.41" /><path d="m17.66 17.66 1.41 1.41" /><path d="M2 12h2" /><path d="M20 12h2" /><path d="m6.34 17.66-1.41 1.41" /><path d="m19.07 4.93-1.41 1.41" /></svg>
)
const IconMoon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" /></svg>
)
const IconUser = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" /></svg>
)

export default function SettingsPage() {
  const { logout } = useAuthActions()
  const { theme, toggleTheme } = useTheme()
  const user = authStore.getUser()
  const setTopbar = useTopbarSetter()

  const roleLabel = user?.role
    ? `${user.role.charAt(0).toUpperCase()}${user.role.slice(1)}`
    : 'User'

  useEffect(() => {
    setTopbar({
      kicker: 'Settings',
      title: 'Preferences',
      description: 'Manage your appearance preferences and account settings.',
    })
  }, [setTopbar])

  return (
    <div className="settings-stack">

      {/* Appearance */}
      <section className="settings-section">
        <div className="settings-section__header">
          <h2 className="settings-section__title">Appearance</h2>
          <p className="settings-section__description">Choose how Attendu looks on your device.</p>
        </div>

        <div className="settings-theme-grid">
          <button
            type="button"
            className={`settings-theme-card ${theme === 'light' ? 'settings-theme-card--active' : ''}`}
            onClick={() => { if (theme !== 'light') toggleTheme() }}
            aria-pressed={theme === 'light'}
          >
            <div className="settings-theme-card__preview settings-theme-card__preview--light">
              <div className="stc-preview__topbar" />
              <div className="stc-preview__sidebar" />
              <div className="stc-preview__content">
                <div className="stc-preview__card" />
                <div className="stc-preview__card" />
              </div>
            </div>
            <div className="settings-theme-card__footer">
              <span className="settings-theme-card__icon"><IconSun /></span>
              <span className="settings-theme-card__label">Light mode</span>
              {theme === 'light' && <span className="settings-theme-card__badge">Active</span>}
            </div>
          </button>

          <button
            type="button"
            className={`settings-theme-card ${theme === 'dark' ? 'settings-theme-card--active' : ''}`}
            onClick={() => { if (theme !== 'dark') toggleTheme() }}
            aria-pressed={theme === 'dark'}
          >
            <div className="settings-theme-card__preview settings-theme-card__preview--dark">
              <div className="stc-preview__topbar" />
              <div className="stc-preview__sidebar" />
              <div className="stc-preview__content">
                <div className="stc-preview__card" />
                <div className="stc-preview__card" />
              </div>
            </div>
            <div className="settings-theme-card__footer">
              <span className="settings-theme-card__icon"><IconMoon /></span>
              <span className="settings-theme-card__label">Dark mode</span>
              {theme === 'dark' && <span className="settings-theme-card__badge">Active</span>}
            </div>
          </button>
        </div>
      </section>

      {/* Account */}
      <section className="settings-section">
        <div className="settings-section__header">
          <h2 className="settings-section__title">Account</h2>
          <p className="settings-section__description">Your profile information as it appears in the system.</p>
        </div>

        <div className="settings-account-card">
          <div className="settings-account-avatar" aria-hidden="true">
            <IconUser />
          </div>
          <div className="settings-account-info">
            <p className="settings-account-name">{user?.full_name ?? '—'}</p>
            <p className="settings-account-email">{user?.email ?? '—'}</p>
            <span className="settings-account-role">{roleLabel}</span>
          </div>
        </div>
      </section>

      {/* Session */}
      <section className="settings-section">
        <div className="settings-section__header">
          <h2 className="settings-section__title">Session</h2>
          <p className="settings-section__description">Manage your active login session.</p>
        </div>

        <div className="settings-row">
          <div className="settings-row__info">
            <p className="settings-row__label">Sign out</p>
            <p className="settings-row__hint">You will be returned to the login screen.</p>
          </div>
          <button type="button" className="settings-btn-danger" onClick={logout}>
            Sign out
          </button>
        </div>
      </section>

    </div>
  )
}
