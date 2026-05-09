import type { AuthResponse } from '../types/authTypes'
import { authStore } from '../../../store/authStore'

export const saveAuthSession = (auth: AuthResponse): void => {
  authStore.setSession(auth)
}

export const clearAuthSession = (): void => {
  authStore.clearSession()
}
