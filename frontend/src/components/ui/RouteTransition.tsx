import type { ReactNode } from 'react'
import { useLocation } from 'react-router-dom'
import './RouteTransition.css'

interface RouteTransitionProps {
  children: ReactNode
}

export default function RouteTransition({ children }: RouteTransitionProps) {
  const location = useLocation()

  return (
    <div key={location.key} className="route-transition">
      {children}
    </div>
  )
}
