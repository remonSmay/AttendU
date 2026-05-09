interface DashboardPlaceholderProps {
  onLogout: () => void
}

export default function DashboardPlaceholder({
  onLogout,
}: DashboardPlaceholderProps) {
  return (
    <div className="dashboard-placeholder">
      <h1>Dashboard (Placeholder)</h1>
      <button
        type="button"
        className="dashboard-placeholder-logout"
        onClick={onLogout}
      >
        Log Out
      </button>
    </div>
  )
}
