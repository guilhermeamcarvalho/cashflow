import { http } from '@/lib/http'
import type { AuthResponse, User } from '@/types/api'

export interface LoginInput {
  email: string
  password: string
}

export interface RegisterInput extends LoginInput {
  name: string
}

export const authApi = {
  login: (input: LoginInput) => http.post<AuthResponse>('/api/v1/auth/login', input),
  register: (input: RegisterInput) => http.post<AuthResponse>('/api/v1/auth/register', input),
}

export const userApi = {
  me: () => http.get<User>('/api/v1/users/me'),
  updateProfile: (name: string) => http.put<User>('/api/v1/users/me', { name }),
  changePassword: (currentPassword: string, newPassword: string) =>
    http.put<void>('/api/v1/users/me/password', { currentPassword, newPassword }),
}
