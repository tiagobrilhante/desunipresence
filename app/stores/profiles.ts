import type { Database } from '~/types/database.types'

type Profile = Database['public']['Tables']['profiles']['Row']

export const useProfilesStore = defineStore(
  'profiles',
  () => {
    // State
    const items = ref<Record<string, Profile>>({})
    const loading = ref(false)
    const error = ref<string | null>(null)

    // Getters
    const getProfile = (id?: string | null) => {
      if (!id) return null
      return items.value[id] ?? null
    }

    const getProfileByUsername = (username?: string | null) => {
      if (!username) return null
      return Object.values(items.value).find(profile => profile.username === username) ?? null
    }

    const getProfilesByIds = (ids: string[]) => {
      return ids.map(id => items.value[id]).filter(Boolean) as Profile[]
    }

    const getProfilesByOrganization = (organizationId?: string | null) => {
      if (!organizationId) return []
      return Object.values(items.value).filter(profile => profile.organization_id === organizationId)
    }

    // Mutations (ações básicas de estado)
    const setError = (errorMessage: string | null) => {
      error.value = errorMessage
    }

    const setLoading = (isLoading: boolean) => {
      loading.value = isLoading
    }

    const setProfile = (profile: Profile) => {
      items.value[profile.id] = profile
    }

    const setProfiles = (profiles: Profile[]) => {
      const newItems: Record<string, Profile> = {}
      profiles.forEach(profile => {
        newItems[profile.id] = profile
      })
      items.value = { ...items.value, ...newItems }
    }

    const updateProfile = (id: string, updates: Partial<Profile>) => {
      if (items.value[id]) {
        items.value[id] = { ...items.value[id], ...updates }
      }
    }

    const removeProfile = (id: string) => {
      delete items.value[id]
    }

    const clearAll = () => {
      items.value = {}
      error.value = null
      loading.value = false
    }

    const clearOrganizationProfiles = (organizationId: string) => {
      Object.keys(items.value).forEach(profileId => {
        if (items.value[profileId]?.organization_id === organizationId) {
          delete items.value[profileId]
        }
      })
    }

    return {
      // State
      items,
      loading,
      error,
      
      // Getters
      getProfile,
      getProfileByUsername,
      getProfilesByIds,
      getProfilesByOrganization,
      
      // Mutations (apenas alterações de estado)
      setError,
      setLoading,
      setProfile,
      setProfiles,
      updateProfile,
      removeProfile,
      clearAll,
      clearOrganizationProfiles
    }
  },
  {
    persist: {
      pick: ['items']
    }
  }
)