import { useState, useEffect, type ReactNode } from 'react'
import { NavLink, useLocation } from 'react-router-dom'

import BrandLogo from './BrandLogo'
import ThemeToggle from './ThemeToggle'

export interface WorkspaceNavItem {
  path: string
  label: string
  shortLabel?: string
  icon?: ReactNode
  isActive?: (pathname: string) => boolean
  children?: WorkspaceNavItem[]
  pinBottom?: boolean
}

interface WorkspaceShellProps {
  brandingKicker?: string
  navigation: WorkspaceNavItem[]
  userName: string
  userRole: string
  topbarKicker?: string
  topbarTitle: ReactNode
  topbarDescription?: string
  topbarActions?: ReactNode
  onLogout: () => void
  children: ReactNode
}

const IconLogOut = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" y1="12" x2="9" y2="12" />
  </svg>
)

const IconChevron = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="m9 18 6-6-6-6" />
  </svg>
)

const IconHamburger = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="3" y1="6" x2="21" y2="6" />
    <line x1="3" y1="12" x2="21" y2="12" />
    <line x1="3" y1="18" x2="21" y2="18" />
  </svg>
)

const IconClose = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
)

function getInitials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
}

function isChildActive(item: WorkspaceNavItem, pathname: string): boolean {
  if (!item.children) return false
  return item.children.some((child) =>
    child.isActive ? child.isActive(pathname) : pathname === child.path
  )
}

export default function WorkspaceShell({
  brandingKicker = 'Attendu',
  navigation,
  userName,
  userRole,
  topbarKicker,
  topbarTitle,
  topbarDescription,
  topbarActions,
  onLogout,
  children,
}: WorkspaceShellProps) {
  const location = useLocation()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const [expanded, setExpanded] = useState<Set<string>>(() => {
    const initial = new Set<string>()
    for (const item of navigation) {
      if (item.children && isChildActive(item, location.pathname)) {
        initial.add(item.path)
      }
    }
    return initial
  })

  /* Close drawer on route change */
  useEffect(() => {
    setIsMobileMenuOpen(false)
  }, [location.pathname])

  /* Lock body scroll when drawer is open */
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [isMobileMenuOpen])

  useEffect(() => {
    for (const item of navigation) {
      if (item.children && isChildActive(item, location.pathname)) {
        setExpanded((prev) => {
          if (prev.has(item.path)) return prev
          const next = new Set(prev)
          next.add(item.path)
          return next
        })
      }
    }
  }, [location.pathname, navigation])

  const toggleExpanded = (path: string) => {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(path)) next.delete(path)
      else next.add(path)
      return next
    })
  }

  const isItemActive = (item: WorkspaceNavItem): boolean => {
    if (item.isActive) return item.isActive(location.pathname)
    return location.pathname === item.path
  }

  const initials = getInitials(userName)
  const mainNav = navigation.filter((item) => !item.pinBottom)
  const bottomNav = navigation.filter((item) => item.pinBottom)

  const renderNavItem = (item: WorkspaceNavItem, _inDrawer = false) => {
    const hasChildren = Boolean(item.children?.length)
    const isOpen = expanded.has(item.path)
    const anyChildActive = isChildActive(item, location.pathname)
    const isActive = !hasChildren && isItemActive(item)
    const parentActiveClass = hasChildren && anyChildActive ? ' ui-shell__nav-link--parent-active' : ''

    if (hasChildren) {
      return (
        <div key={item.path} className="ui-shell__nav-group">
          <button
            type="button"
            className={`ui-shell__nav-link ui-shell__nav-link--expandable${parentActiveClass}`}
            onClick={() => toggleExpanded(item.path)}
            aria-expanded={isOpen}
          >
            {item.icon ? (
              <span className="ui-shell__nav-icon" aria-hidden="true">{item.icon}</span>
            ) : null}
            <span className="ui-shell__nav-label">{item.label}</span>
            <span className={`ui-shell__nav-chevron${isOpen ? ' ui-shell__nav-chevron--open' : ''}`} aria-hidden="true">
              <IconChevron />
            </span>
          </button>

          <div className={`ui-shell__nav-sub${isOpen ? ' ui-shell__nav-sub--open' : ''}`}>
            <div className="ui-shell__nav-sub-inner">
              {item.children!.map((child) => {
                const childActive = child.isActive
                  ? child.isActive(location.pathname)
                  : location.pathname === child.path
                return (
                  <NavLink
                    key={child.path}
                    to={child.path}
                    className={`ui-shell__nav-sub-link${childActive ? ' ui-shell__nav-sub-link--active' : ''}`}
                    aria-current={childActive ? 'page' : undefined}
                  >
                    {child.icon ? (
                      <span className="ui-shell__nav-icon" aria-hidden="true">{child.icon}</span>
                    ) : null}
                    <span>{child.label}</span>
                  </NavLink>
                )
              })}
            </div>
          </div>
        </div>
      )
    }

    return (
      <NavLink
        key={item.path}
        to={item.path}
        className={`ui-shell__nav-link${isActive ? ' ui-shell__nav-link--active' : ''}`}
        aria-current={isActive ? 'page' : undefined}
      >
        {item.icon ? (
          <span className="ui-shell__nav-icon" aria-hidden="true">{item.icon}</span>
        ) : null}
        <span className="ui-shell__nav-label">{item.label}</span>
      </NavLink>
    )
  }

  return (
    <div className="ui-shell">

      {/* ── Desktop sidebar ───────────────────────── */}
      <aside className="ui-shell__sidebar" aria-label="Primary navigation">

        <div className="ui-shell__brand">
          <BrandLogo title="" />
          <div className="ui-shell__brand-text">
            <p className="ui-shell__brand-name">Attendu</p>
            <p className="ui-shell__brand-sub">{brandingKicker}</p>
          </div>
        </div>

        <div className="ui-shell__user">
          <div className="ui-shell__avatar" aria-hidden="true">{initials}</div>
          <div className="ui-shell__user-info">
            <p className="ui-shell__user-name">{userName}</p>
            <span className="ui-shell__user-role">{userRole}</span>
          </div>
        </div>

        <div className="ui-shell__divider" aria-hidden="true" />

        <nav className="ui-shell__nav" aria-label="Main navigation">
          {mainNav.map((item) => renderNavItem(item))}
        </nav>

        <div className="ui-shell__spacer" />
        <div className="ui-shell__divider" aria-hidden="true" />

        {bottomNav.length > 0 ? (
          <nav className="ui-shell__nav ui-shell__nav--bottom" aria-label="Secondary navigation">
            {bottomNav.map((item) => renderNavItem(item))}
          </nav>
        ) : null}

        <button type="button" className="ui-shell__logout" onClick={onLogout}>
          <span className="ui-shell__nav-icon" aria-hidden="true"><IconLogOut /></span>
          <span>Sign out</span>
        </button>

      </aside>

      {/* ── Mobile sticky header ──────────────────── */}
      <div className="ui-shell__mobile-header" role="banner">
        <button
          type="button"
          className="ui-shell__hamburger"
          onClick={() => setIsMobileMenuOpen(true)}
          aria-label="Open navigation menu"
          aria-expanded={isMobileMenuOpen}
        >
          <IconHamburger />
        </button>

        <div className="ui-shell__mobile-brand">
          <BrandLogo title="" />
          <span className="ui-shell__mobile-brand-name">Attendu</span>
        </div>

        <ThemeToggle compact />
      </div>

      {/* ── Mobile drawer backdrop ────────────────── */}
      <div
        className={`ui-shell__drawer-backdrop${isMobileMenuOpen ? ' ui-shell__drawer-backdrop--open' : ''}`}
        onClick={() => setIsMobileMenuOpen(false)}
        aria-hidden="true"
      />

      {/* ── Mobile slide-out drawer ───────────────── */}
      <div
        className={`ui-shell__drawer${isMobileMenuOpen ? ' ui-shell__drawer--open' : ''}`}
        aria-label="Navigation drawer"
        aria-hidden={!isMobileMenuOpen}
      >
        <div className="ui-shell__drawer-header">
          <div className="ui-shell__mobile-brand">
            <BrandLogo title="" />
            <span className="ui-shell__mobile-brand-name">Attendu</span>
          </div>
          <button
            type="button"
            className="ui-shell__drawer-close"
            onClick={() => setIsMobileMenuOpen(false)}
            aria-label="Close navigation menu"
          >
            <IconClose />
          </button>
        </div>

        <div className="ui-shell__drawer-user">
          <div className="ui-shell__avatar" aria-hidden="true">{initials}</div>
          <div className="ui-shell__user-info">
            <p className="ui-shell__user-name">{userName}</p>
            <span className="ui-shell__user-role">{userRole}</span>
          </div>
        </div>

        <div className="ui-shell__divider" aria-hidden="true" />

        <nav className="ui-shell__drawer-nav" aria-label="Drawer navigation">
          {navigation.map((item) => renderNavItem(item, true))}
        </nav>

        <div className="ui-shell__spacer" />

        <button type="button" className="ui-shell__logout" onClick={onLogout}>
          <span className="ui-shell__nav-icon" aria-hidden="true"><IconLogOut /></span>
          <span>Sign out</span>
        </button>
      </div>

      {/* ── Main content ──────────────────────────── */}
      <div className="ui-shell__content">
        <header className="ui-surface ui-shell__topbar">
          <div className="ui-shell__topbar-copy">
            {topbarKicker ? <p className="ui-shell__kicker">{topbarKicker}</p> : null}
            <h1 className="ui-shell__title">{topbarTitle}</h1>
            {topbarDescription ? <p className="ui-shell__description">{topbarDescription}</p> : null}
          </div>
          <div className="ui-shell__topbar-actions">
            <ThemeToggle compact />
            {topbarActions}
          </div>
        </header>
        <main className="ui-shell__main">{children}</main>
      </div>

      {/* ── Mobile bottom tab bar ─────────────────── */}
      <nav className="ui-shell__mobile-nav" aria-label="Mobile navigation">
        {navigation.map((item) => {
          const isActive = isItemActive(item) || isChildActive(item, location.pathname)
          const mobilePath = item.children?.[0]?.path ?? item.path
          return (
            <NavLink
              key={item.path}
              to={mobilePath}
              className={`ui-shell__mobile-link${isActive ? ' ui-shell__mobile-link--active' : ''}`}
              aria-current={isActive ? 'page' : undefined}
            >
              {item.icon ? (
                <span className="ui-shell__mobile-icon" aria-hidden="true">{item.icon}</span>
              ) : null}
              <span className="ui-shell__mobile-label">{item.shortLabel ?? item.label}</span>
            </NavLink>
          )
        })}
      </nav>

    </div>
  )
}
