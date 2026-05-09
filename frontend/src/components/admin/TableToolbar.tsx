import type { ReactNode } from 'react'
import { IconSearch } from '../ui/Icons'

interface TableToolbarProps {
  searchQuery: string
  onSearchChange: (value: string) => void
  searchPlaceholder?: string
  actions?: ReactNode
}

export default function TableToolbar({
  searchQuery,
  onSearchChange,
  searchPlaceholder = 'Search...',
  actions,
}: TableToolbarProps) {
  return (
    <div className="table-toolbar" style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap' }}>
      <div className="ui-search" style={{ flex: '1 1 300px' }}>
        <span className="ui-search__icon" aria-hidden="true">
          <IconSearch />
        </span>
        <input
          type="search"
          className="ui-input"
          placeholder={searchPlaceholder}
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          aria-label={searchPlaceholder}
        />
      </div>
      {actions && <div className="table-toolbar__actions" style={{ display: 'flex', gap: '0.5rem' }}>{actions}</div>}
    </div>
  )
}
