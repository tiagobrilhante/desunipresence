import type { Database } from '~/types/database.types'

type Group = Database['public']['Tables']['groups']['Row']

export const useGroupsStore = defineStore(
  'groups',
  () => {
    // State
    const items = ref<Record<string, Group>>({})
    const loading = ref(false)
    const error = ref<string | null>(null)

    // Getters
    const getGroup = (id?: string | null) => {
      if (!id) return null
      return items.value[id] ?? null
    }

    const getUserGroups = (userId?: string | null) => {
      if (!userId) return []
      return Object.values(items.value).filter(group => group.owner_id === userId)
    }

    // Mutations (ações básicas de estado)
    const setError = (errorMessage: string | null) => {
      error.value = errorMessage
    }

    const setLoading = (isLoading: boolean) => {
      loading.value = isLoading
    }

    const setGroup = (group: Group) => {
      items.value[group.id] = group
    }

    const setGroups = (groups: Group[]) => {
      const newItems: Record<string, Group> = {}
      groups.forEach(group => {
        newItems[group.id] = group
      })
      items.value = { ...items.value, ...newItems }
    }

    const removeGroup = (id: string) => {
      delete items.value[id]
    }

    const clearAll = () => {
      items.value = {}
      error.value = null
      loading.value = false
    }

    const clearUserGroups = (userId: string) => {
      Object.keys(items.value).forEach(groupId => {
        if (items.value[groupId]?.owner_id === userId) {
          delete items.value[groupId]
        }
      })
    }

    return {
      // State
      items,
      loading,
      error,
      
      // Getters
      getGroup,
      getUserGroups,
      
      // Mutations (apenas alterações de estado)
      setError,
      setLoading,
      setGroup,
      setGroups,
      removeGroup,
      clearAll,
      clearUserGroups
    }
  },
  {
    persist: {
      pick: ['items']
    }
  }
)