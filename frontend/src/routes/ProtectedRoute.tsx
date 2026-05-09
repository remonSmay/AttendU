import { Navigate, Outlet } from 'react-router-dom'

import { authStore } from '../store/authStore'

interface ProtectedRouteProps {
  redirectPath?: string
  allowedRoles?: string[]
  unauthorizedPath?: string
}

export default function ProtectedRoute({
  redirectPath = '/login',
  allowedRoles,
  unauthorizedPath = '/dashboard',
}: ProtectedRouteProps) {
  const token = authStore.getAccessToken()
  const user = authStore.getUser()

  if (!token) {
    return <Navigate to={redirectPath} replace />
  }

  if (allowedRoles && allowedRoles.length > 0) {
    if (!user?.role || !allowedRoles.includes(user.role)) {
      return <Navigate to={unauthorizedPath} replace />
    }
  }

  return <Outlet />
}
