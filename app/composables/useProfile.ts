import type { Database } from '~/types/database.types'
import { ProfileService } from '@/services/profile.service'

type Profile = Database['public']['Tables']['profiles']['Row']
type CreateProfileData = Parameters<ProfileService['createProfile']>[0]
type UpdateProfileData = Parameters<ProfileService['updateProfile']>[1]

export const useProfile = () => {
  const profilesStore = useProfilesStore()
  const supabase = useSupabaseClient<Database>()
  const profileService = new ProfileService(supabase)

  // Buscar MEU perfil (perfil do usuário logado)
  const fetchMyProfile = async (userId?: string): Promise<Profile | null> => {
    const user = useSupabaseUser()
    const currentUserId = userId || user.value?.id

    if (!currentUserId) {
      throw new Error('No authenticated user available')
    }

    // Verifica cache primeiro
    const cached = profilesStore.getMyProfile()
    if (cached && cached.id === currentUserId) {
      return cached
    }

    try {
      profilesStore.setLoading(true)
      profilesStore.setError(null)

      const data = await profileService.getCurrentUserProfile(userId)

      if (data) {
        profilesStore.setMyProfile(data)
      }

      return data
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao buscar meu perfil'
      profilesStore.setError(errorMessage)
      console.error('Error fetching my profile:', error)
      throw error
    } finally {
      profilesStore.setLoading(false)
    }
  }

  // Alias para manter compatibilidade
  const fetchCurrentUserProfile = fetchMyProfile

  // Buscar perfil por ID (com cache inteligente)
  const fetchProfile = async (id: string): Promise<Profile | null> => {
    // Verifica cache primeiro
    const cached = profilesStore.getProfile(id)
    if (cached) return cached

    try {
      profilesStore.setLoading(true)
      profilesStore.setError(null)

      const data = await profileService.getProfileById(id)

      if (data) {
        profilesStore.setProfile(data)
      }

      return data
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao buscar perfil'
      profilesStore.setError(errorMessage)
      console.error('Error fetching profile:', error)
      return null
    } finally {
      profilesStore.setLoading(false)
    }
  }

  // Buscar perfil por coluna específica
  const fetchProfileByColumn = async <K extends keyof Profile>(
    column: K,
    value: Profile[K]
  ): Promise<Profile | null> => {
    try {
      profilesStore.setLoading(true)
      profilesStore.setError(null)

      const data = await profileService.getProfileByColumn(column, value)

      if (data) {
        profilesStore.setProfile(data)
      }

      return data
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao buscar perfil'
      profilesStore.setError(errorMessage)
      console.error('Error fetching profile by column:', error)
      return null
    } finally {
      profilesStore.setLoading(false)
    }
  }

  // Buscar todos os perfis
  const fetchProfiles = async (): Promise<Profile[]> => {
    try {
      profilesStore.setLoading(true)
      profilesStore.setError(null)

      const data = await profileService.getProfiles()

      if (data) {
        profilesStore.setProfiles(data)
      }

      return data || []
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao buscar perfis'
      profilesStore.setError(errorMessage)
      console.error('Error fetching profiles:', error)
      return []
    } finally {
      profilesStore.setLoading(false)
    }
  }

  // Buscar perfis por IDs
  const fetchProfilesByIds = async (userIds: string[]): Promise<Profile[]> => {
    // Verifica quais já estão no cache
    const cached = profilesStore.getProfilesByIds(userIds)
    const cachedIds = cached.map(p => p.id)
    const missingIds = userIds.filter(id => !cachedIds.includes(id))

    if (missingIds.length === 0) {
      return cached
    }

    try {
      profilesStore.setLoading(true)
      profilesStore.setError(null)

      const data = await profileService.getProfilesByIds(missingIds)

      if (data) {
        profilesStore.setProfiles(data)
      }

      // Retorna todos os perfis solicitados (cached + novos)
      return profilesStore.getProfilesByIds(userIds)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao buscar perfis'
      profilesStore.setError(errorMessage)
      console.error('Error fetching profiles by ids:', error)
      return cached // Retorna pelo menos os cached em caso de erro
    } finally {
      profilesStore.setLoading(false)
    }
  }

  // Buscar perfis por organização
  const fetchProfilesByOrganization = async (organizationId: string): Promise<Profile[]> => {
    // Verifica cache primeiro
    const cached = profilesStore.getProfilesByOrganization(organizationId)
    if (cached.length > 0) return cached

    try {
      profilesStore.setLoading(true)
      profilesStore.setError(null)

      const data = await profileService.getProfilesByOrganization(organizationId)

      if (data) {
        profilesStore.setProfiles(data)
      }

      return data || []
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao buscar perfis da organização'
      profilesStore.setError(errorMessage)
      console.error('Error fetching organization profiles:', error)
      return []
    } finally {
      profilesStore.setLoading(false)
    }
  }

  // Criar perfil
  const createProfile = async (profileData: CreateProfileData): Promise<Profile | null> => {
    try {
      profilesStore.setLoading(true)
      profilesStore.setError(null)

      const data = await profileService.createProfile(profileData)

      if (data) {
        profilesStore.setProfile(data)
      }

      return data
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao criar perfil'
      profilesStore.setError(errorMessage)
      console.error('Error creating profile:', error)
      throw error
    } finally {
      profilesStore.setLoading(false)
    }
  }

  // Atualizar perfil
  const updateProfile = async (id: string, profileData: UpdateProfileData): Promise<Profile | null> => {
    try {
      profilesStore.setLoading(true)
      profilesStore.setError(null)

      const data = await profileService.updateProfile(id, profileData)

      if (data) {
        profilesStore.setProfile(data)
      }

      return data
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao atualizar perfil'
      profilesStore.setError(errorMessage)
      console.error('Error updating profile:', error)
      throw error
    } finally {
      profilesStore.setLoading(false)
    }
  }

  // Atualizar perfil do usuário atual
  const updateCurrentUserProfile = async (profileData: UpdateProfileData, userId?: string): Promise<Profile | null> => {
    const user = useSupabaseUser()
    const currentUserId = userId || user.value?.id

    if (!currentUserId) {
      throw new Error('No authenticated user available')
    }

    return updateProfile(currentUserId, profileData)
  }

  // Deletar perfil
  const deleteProfile = async (id: string): Promise<boolean> => {
    try {
      profilesStore.setLoading(true)
      profilesStore.setError(null)

      await profileService.deleteProfile(id)

      profilesStore.removeProfile(id)

      return true
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao deletar perfil'
      profilesStore.setError(errorMessage)
      console.error('Error deleting profile:', error)
      throw error
    } finally {
      profilesStore.setLoading(false)
    }
  }

  // Refresh perfil (força busca no servidor)
  const refreshProfile = async (id: string): Promise<Profile | null> => {
    profilesStore.removeProfile(id)
    return await fetchProfile(id)
  }

  return {
    // Actions
    fetchMyProfile,
    fetchCurrentUserProfile, // Alias para compatibilidade
    fetchProfile,
    fetchProfileByColumn,
    fetchProfiles,
    fetchProfilesByIds,
    fetchProfilesByOrganization,
    createProfile,
    updateProfile,
    updateCurrentUserProfile,
    deleteProfile,
    refreshProfile,

    // State (readonly)
    myProfile: profilesStore.myProfile,
    otherProfiles: profilesStore.otherProfiles,
    loading: profilesStore.loading,
    error: profilesStore.error,

    // Getters
    getMyProfile: profilesStore.getMyProfile,
    getProfile: profilesStore.getProfile,
    getProfileByUsername: profilesStore.getProfileByUsername,
    getProfilesByIds: profilesStore.getProfilesByIds,
    getProfilesByOrganization: profilesStore.getProfilesByOrganization
  }
}
