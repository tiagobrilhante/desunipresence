import type { AuthError, AuthResponse, Provider, Session, User } from '@supabase/supabase-js'
import type { LoginForm, RegisterForm } from '@/types/AuthForm'
import type { Database } from '@/types/database.types'
import { AuthService } from '@/services/auth.service'
import { MeService } from '@/services/me.service'
import { useProfile } from '@/composables/useProfile'

export const useAuth = () => {
  const supabase = useSupabaseClient<Database>()
  const { fetchCurrentUserProfile } = useProfile()
  const authService = new AuthService(supabase)
  const meService = new MeService(supabase)

  const loading = ref(false)

  const withLoading = async <T>(handler: () => Promise<T>) => {
    loading.value = true
    try {
      return await handler()
    } finally {
      loading.value = false
    }
  }

  const handleAuthenticatedUser = async (payload: { user: User | null, session: Session | null }) => {
    const { user, session } = payload

    if (!user || !session) {
      return
    }

    try {
      await fetchCurrentUserProfile(user.id)
      
      // Limpar cache e recarregar dados após login
      const groupsStore = useGroupsStore()
      groupsStore.clearAll()
      
      // Buscar dados frescos do servidor
      const { fetchUserGroups } = useGroups()
      await fetchUserGroups()
    } catch (error) {
      console.warn('Unable to synchronize user profile after authentication', error)
    }
  }

  const register = async (formData: RegisterForm) => {
    try {
      const data = await withLoading(() => authService.register({
        ...formData,
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        username: formData.username.trim(),
        bio: formData.bio?.trim() ?? null,
        avatarUrl: formData.avatarUrl?.trim() ?? null
      }))

      if (data.user && data.session) {
        await handleAuthenticatedUser({ user: data.user, session: data.session })
      }

      return { data, error: null as AuthError | null }
    } catch (error) {
      console.error(error)
      return { data: null, error: error as AuthError }
    }
  }

  const login = async (formData: LoginForm) => {
    const normalizedForm = {
      email: formData.email.trim(),
      password: formData.password
    }

    try {
      const data = await withLoading(() => authService.login(normalizedForm))

      await handleAuthenticatedUser({ user: data.user, session: data.session })

      return { data, error: null as AuthError | null }
    } catch (error) {
      return { data: null as AuthResponse | null, error: error as AuthError }
    }
  }

  const loginWithProvider = async (provider: Provider) => {
    const redirectTo = import.meta.client ? window.location.origin : undefined

    try {
      const data = await withLoading(() => authService.loginWithProvider(provider, redirectTo))
      return { data, error: null as AuthError | null }
    } catch (error) {
      return { data: null, error: error as AuthError }
    }
  }

  const logout = async () => {
    try {
      await withLoading(() => authService.logout())
      
      // Limpar todos os stores ao fazer logout
      const groupsStore = useGroupsStore()
      const profilesStore = useProfilesStore()
      
      groupsStore.clearAll()
      profilesStore.clearAll()
      
      return { success: true as const, error: null as AuthError | null }
    } catch (error) {
      console.error(error)
      return { success: false as const, error: error as AuthError }
    }
  }

  const getCurrentUser = async () => {
    try {
      const data = await withLoading(() => meService.getCurrentUser())
      return { data, error: null as Error | null }
    } catch (error) {
      return { data: null, error: error as Error }
    }
  }

  return {
    loading: readonly(loading),
    register,
    login,
    loginWithProvider,
    logout,
    getCurrentUser
  }
}
