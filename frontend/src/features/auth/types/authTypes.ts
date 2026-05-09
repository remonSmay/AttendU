export interface AuthTokens {
  access_token: string
  refresh_token: string
}

export interface AuthUser {
  id: number
  full_name: string
  email: string
  role: string
}

export interface AuthResponse {
  tokens: AuthTokens
  user: AuthUser
}

export interface LoginPayload {
  email: string
  password: string
}

export interface RegisterPayload {
  full_name: string
  email: string
  password: string
  role: 'admin' | 'instructor'
}
