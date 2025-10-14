import type { Database } from '~/types/database.types'

type Profile = Database['public']['Tables']['profiles']['Row']

export const useProfilesStore = defineStore(
  'profiles',
  () => {
    // State - Separação clara entre meu perfil e outros perfis
    const myProfile = ref<Profile | null>(null)
    const otherProfiles = ref<Record<string, Profile>>({})
    const loading = ref(false)
    const error = ref<string | null>(null)

    // Getters
    const getMyProfile = () => {
      return myProfile.value
    }

    const getProfile = (id?: string | null) => {
      if (!id) return null

      // Verifica se é meu perfil primeiro
      if (myProfile.value?.id === id) {
        return myProfile.value
      }

      // Senão, busca nos outros perfis
      return otherProfiles.value[id] ?? null
    }

    const getProfileByUsername = (username?: string | null) => {
      if (!username) return null

      // Verifica se é meu perfil primeiro
      if (myProfile.value?.username === username) {
        return myProfile.value
      }

      // Senão, busca nos outros perfis
      return Object.values(otherProfiles.value).find(profile => profile.username === username) ?? null
    }

    const getProfilesByIds = (ids: string[]) => {
      const profiles: Profile[] = []

      ids.forEach((id) => {
        if (myProfile.value?.id === id) {
          profiles.push(myProfile.value)
        } else if (otherProfiles.value[id]) {
          profiles.push(otherProfiles.value[id])
        }
      })

      return profiles
    }

    const getProfilesByOrganization = (organizationId?: string | null) => {
      if (!organizationId) return []

      const profiles: Profile[] = []

      // Verifica meu perfil
      if (myProfile.value?.organization_id === organizationId) {
        profiles.push(myProfile.value)
      }

      // Adiciona outros perfis da mesma organização
      Object.values(otherProfiles.value).forEach((profile) => {
        if (profile.organization_id === organizationId) {
          profiles.push(profile)
        }
      })

      return profiles
    }

    // Mutations (ações básicas de estado)
    const setError = (errorMessage: string | null) => {
      error.value = errorMessage
    }

    const setLoading = (isLoading: boolean) => {
      loading.value = isLoading
    }

    const setMyProfile = (profile: Profile | null) => {
      myProfile.value = profile
    }

    const setProfile = (profile: Profile) => {
      // Se for meu perfil, salva separadamente
      if (myProfile.value?.id === profile.id) {
        myProfile.value = profile
      } else {
        // Senão, salva nos outros perfis
        otherProfiles.value[profile.id] = profile
      }
    }

    const setProfiles = (profiles: Profile[]) => {
      profiles.forEach((profile) => {
        // Se for meu perfil, não adiciona aos outros
        if (myProfile.value?.id !== profile.id) {
          otherProfiles.value[profile.id] = profile
        }
      })
    }

    const updateMyProfile = (updates: Partial<Profile>) => {
      if (myProfile.value) {
        myProfile.value = { ...myProfile.value, ...updates }
      }
    }

    const updateProfile = (id: string, updates: Partial<Profile>) => {
      if (myProfile.value?.id === id) {
        updateMyProfile(updates)
      } else if (otherProfiles.value[id]) {
        otherProfiles.value[id] = { ...otherProfiles.value[id], ...updates }
      }
    }

    const removeProfile = (id: string) => {
      // Não permite remover meu próprio perfil
      if (myProfile.value?.id !== id) {
        delete otherProfiles.value[id]
      }
    }

    const clearAll = () => {
      myProfile.value = null
      otherProfiles.value = {}
      error.value = null
      loading.value = false
    }

    const clearOtherProfiles = () => {
      otherProfiles.value = {}
    }

    const clearOrganizationProfiles = (organizationId: string) => {
      Object.keys(otherProfiles.value).forEach((profileId) => {
        if (otherProfiles.value[profileId]?.organization_id === organizationId) {
          delete otherProfiles.value[profileId]
        }
      })
    }

    return {
      // State
      myProfile,
      otherProfiles,
      loading,
      error,

      // Getters
      getMyProfile,
      getProfile,
      getProfileByUsername,
      getProfilesByIds,
      getProfilesByOrganization,

      // Mutations (apenas alterações de estado)
      setError,
      setLoading,
      setMyProfile,
      setProfile,
      setProfiles,
      updateMyProfile,
      updateProfile,
      removeProfile,
      clearAll,
      clearOtherProfiles,
      clearOrganizationProfiles
    }
  },
  {
    persist: {
      pick: ['myProfile', 'otherProfiles']
    }
  }
)
