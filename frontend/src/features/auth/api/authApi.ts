import { API_BASE_URL } from '../../../shared/config/env'
import type {
  AuthResponse,
  LoginPayload,
  RegisterPayload,
} from '../types/authTypes'

const parseErrorMessage = async (
  response: Response,
  fallbackMessage: string,
): Promise<string> => {
  try {
    const data = await response.json()
    if (typeof data?.detail === 'string' && data.detail.trim()) {
      return data.detail
    }
    return fallbackMessage
  } catch {
    return fallbackMessage
  }
}

const postAuth = async <TPayload>(
  endpoint: string,
  payload: TPayload,
  fallbackMessage: string,
): Promise<AuthResponse> => {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    const message = await parseErrorMessage(response, fallbackMessage)
    throw new Error(message)
  }

  return (await response.json()) as AuthResponse
}

export const loginRequest = (payload: LoginPayload): Promise<AuthResponse> =>
  postAuth('/auth/login', payload, 'Invalid email or password')

export const registerRequest = (payload: RegisterPayload): Promise<AuthResponse> =>
  postAuth('/auth/register', payload, 'Registration failed. Please check your information.')
