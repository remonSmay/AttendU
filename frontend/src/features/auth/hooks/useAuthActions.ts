import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { loginRequest, registerRequest } from '../api/authApi'
import { clearAuthSession, saveAuthSession } from '../storage/authStorage'
import type { RegisterPayload } from '../types/authTypes'

const NETWORK_ERROR_MESSAGE =
  'Cannot reach the backend API. Make sure the FastAPI server is running on http://localhost:8000 and CORS allows http://localhost:5173.'

interface UseAuthActionsResult {
  isLoading: boolean
  error: string | null
  login: (email: string, password: string) => Promise<void>
  register: (payload: RegisterPayload) => Promise<void>
  clearError: () => void
  logout: () => void
}

export const useAuthActions = (): UseAuthActionsResult => {
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const login = async (email: string, password: string) => {
    setIsLoading(true)
    setError(null)

    try {
      const data = await loginRequest({ email, password })
      saveAuthSession(data)
      navigate('/dashboard')
    } catch (err) {
      const errorMessage =
        err instanceof TypeError
          ? NETWORK_ERROR_MESSAGE
          : err instanceof Error
            ? err.message
            : 'Login failed. Please try again.'
      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const register = async (payload: RegisterPayload) => {
    setIsLoading(true)
    setError(null)

    try {
      const data = await registerRequest(payload)
      saveAuthSession(data)
      navigate('/dashboard')
    } catch (err) {
      const errorMessage =
        err instanceof TypeError
          ? NETWORK_ERROR_MESSAGE
          : err instanceof Error
            ? err.message
            : 'Registration failed. Please try again.'
      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const clearError = () => {
    setError(null)
  }

  const logout = () => {
    clearAuthSession()
    navigate('/login')
  }

  return {
    isLoading,
    error,
    login,
    register,
    clearError,
    logout,
  }
}
