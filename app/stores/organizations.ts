import type { Database } from '~/types/database.types'

type Organization = Database['public']['Tables']['organizations']['Row']

export const useOrganizationsStore = defineStore(
  'organizations',
  () => {
    // State
    const items = ref<Record<string, Organization>>({})
    const loading = ref(false)
    const error = ref<string | null>(null)

    // Getters
    const getOrganization = (id?: string | null) => {
      if (!id) return null
      return items.value[id] ?? null
    }

    // Mutations (ações básicas de estado)
    const setError = (errorMessage: string | null) => {
      error.value = errorMessage
    }

    const setLoading = (isLoading: boolean) => {
      loading.value = isLoading
    }

    const setOrganization = (organization: Organization) => {
      items.value[organization.id] = organization
    }

    const setOrganizations = (organizations: Organization[]) => {
      const newItems: Record<string, Organization> = {}
      organizations.forEach((org) => {
        newItems[org.id] = org
      })
      items.value = newItems
    }

    const removeOrganization = (id: string) => {
      delete items.value[id]
    }

    const clearAll = () => {
      items.value = {}
      error.value = null
      loading.value = false
    }

    return {
      // State
      items,
      loading,
      error,

      // Getters
      getOrganization,

      // Mutations (apenas alterações de estado)
      setError,
      setLoading,
      setOrganization,
      setOrganizations,
      removeOrganization,
      clearAll
    }
  },
  {
    persist: {
      pick: ['items']
    }
  }
)
