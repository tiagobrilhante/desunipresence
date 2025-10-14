import type { LoginForm, RegisterForm } from '@/types/AuthForm'
import type { Provider, SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '~/types/database.types'
import { throwServiceError } from '@/utils/serviceLogger'

interface AuthServiceOptions {
  organizationId?: string | null
}

export class AuthService {
  constructor(private readonly supabase: SupabaseClient<Database>) {}

  async register(formData: RegisterForm, options: AuthServiceOptions = {}) {
    const { data, error } = await this.supabase.auth.signUp({
      email: formData.email,
      password: formData.password
    })

    if (error) throwServiceError('AuthService.register', error)

    if (data.user) {
      const { error: profileError } = await this.supabase.from('profiles').insert({
        id: data.user.id,
        username: formData.username,
        full_name: `${formData.firstName} ${formData.lastName}`.trim(),
        role: 'member',
        bio: formData.bio ?? null,
        avatar_url: formData.avatarUrl ?? null,
        organization_id: options.organizationId ?? null
      })

      if (profileError) throwServiceError('AuthService.register.profile', profileError)
    }

    return data
  }

  async login(formData: LoginForm) {
    const { data, error } = await this.supabase.auth.signInWithPassword({
      email: formData.email,
      password: formData.password
    })

    if (error) throwServiceError('AuthService.login', error)
    return data
  }

  async loginWithProvider(provider: Provider, redirectTo?: string) {
    const { data, error } = await this.supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo
      }
    })

    if (error) throwServiceError('AuthService.loginWithProvider', error)
    return data
  }

  async logout() {
    const { error } = await this.supabase.auth.signOut()
    if (error) throwServiceError('AuthService.logout', error)
    return { success: true }
  }

  async getCurrentSession() {
    const { data, error } = await this.supabase.auth.getSession()
    if (error) throwServiceError('AuthService.getCurrentSession', error)
    return data
  }

  async refreshSession() {
    const { data, error } = await this.supabase.auth.refreshSession()
    if (error) throwServiceError('AuthService.refreshSession', error)
    return data
  }

  async updatePassword(password: string) {
    const { data, error } = await this.supabase.auth.updateUser({ password })
    if (error) throwServiceError('AuthService.updatePassword', error)
    return data
  }

  async updateEmail(email: string) {
    const { data, error } = await this.supabase.auth.updateUser({ email })
    if (error) throwServiceError('AuthService.updateEmail', error)
    return data
  }

  async resetPassword(email: string, redirectTo?: string) {
    const { data, error } = await this.supabase.auth.resetPasswordForEmail(email, {
      redirectTo
    })
    if (error) throwServiceError('AuthService.resetPassword', error)
    return data
  }
}
