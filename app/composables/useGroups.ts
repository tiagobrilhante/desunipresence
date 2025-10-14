import type { Database } from '~/types/database.types'
import { GroupService } from '@/services/groups.service'

type Group = Database['public']['Tables']['groups']['Row']
type CreateGroupData = Parameters<GroupService['createGroup']>[0]
type UpdateGroupData = Parameters<GroupService['updateGroup']>[1]

type GroupMembership = {
  role: string
  joined_at: string
  groups: Group
}

export const useGroups = () => {
  const groupsStore = useGroupsStore()
  const supabase = useSupabaseClient<Database>()
  const groupService = new GroupService(supabase)

  // Buscar grupos do usuário com informações de membership
  const fetchUserGroups = async (userId?: string): Promise<GroupMembership[]> => {
    // Para agora, sempre buscar do servidor para ter os dados de membership
    // TODO: Implementar cache para memberships futuramente

    try {
      groupsStore.setLoading(true)
      groupsStore.setError(null)

      const memberships = await groupService.getGroups(userId)

      if (memberships) {
        // Extrair apenas os grupos para o store (mantém compatibilidade)
        const groups = memberships.map(membership => membership.groups)
        groupsStore.setGroups(groups)
      }

      return memberships || []
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao buscar grupos'
      groupsStore.setError(errorMessage)
      console.error('Error fetching user groups:', error)
      return []
    } finally {
      groupsStore.setLoading(false)
    }
  }

  // Buscar grupo por ID (com cache inteligente)
  const fetchGroup = async (id: string): Promise<Group | null> => {
    // Verifica cache primeiro
    const cached = groupsStore.getGroup(id)
    if (cached) return cached

    try {
      groupsStore.setLoading(true)
      groupsStore.setError(null)

      const data = await groupService.getGroupById(id)

      if (data) {
        groupsStore.setGroup(data)
      }

      return data
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao buscar grupo'
      groupsStore.setError(errorMessage)
      console.error('Error fetching group:', error)
      return null
    } finally {
      groupsStore.setLoading(false)
    }
  }

  // Criar novo grupo
  const createGroup = async (groupData: CreateGroupData): Promise<Group | null> => {
    try {
      groupsStore.setLoading(true)
      groupsStore.setError(null)

      const data = await groupService.createGroup(groupData)

      if (data) {
        groupsStore.setGroup(data)
        // TODO: Aqui podemos adicionar notificações, logs, etc.
      }

      return data
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao criar grupo'
      groupsStore.setError(errorMessage)
      console.error('Error creating group:', error)
      throw error
    } finally {
      groupsStore.setLoading(false)
    }
  }

  // Atualizar grupo
  const updateGroup = async (id: string, groupData: UpdateGroupData): Promise<Group | null> => {
    try {
      groupsStore.setLoading(true)
      groupsStore.setError(null)

      const data = await groupService.updateGroup(id, groupData)

      if (data) {
        groupsStore.setGroup(data)
        // TODO: Adicionar notificação de sucesso
      }

      return data
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao atualizar grupo'
      groupsStore.setError(errorMessage)
      console.error('Error updating group:', error)
      throw error
    } finally {
      groupsStore.setLoading(false)
    }
  }

  // Deletar grupo
  const deleteGroup = async (id: string): Promise<boolean> => {
    try {
      groupsStore.setLoading(true)
      groupsStore.setError(null)

      await groupService.deleteGroup(id)

      groupsStore.removeGroup(id)
      // TODO: Adicionar notificação de sucesso

      return true
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao deletar grupo'
      groupsStore.setError(errorMessage)
      console.error('Error deleting group:', error)
      throw error
    } finally {
      groupsStore.setLoading(false)
    }
  }

  // Refresh dos grupos (força busca no servidor)
  const refreshUserGroups = async (userId?: string): Promise<GroupMembership[]> => {
    // Remove do cache e busca novamente
    const user = useSupabaseUser()
    const targetUserId = userId || user.value?.id
    if (targetUserId) {
      groupsStore.clearUserGroups(targetUserId)
    }
    return await fetchUserGroups(userId)
  }

  // Refresh do grupo específico (força busca no servidor)
  const refreshGroup = async (id: string): Promise<Group | null> => {
    // Remove do cache e busca novamente
    groupsStore.removeGroup(id)
    return await fetchGroup(id)
  }

  return {
    // Actions
    fetchUserGroups,
    fetchGroup,
    createGroup,
    updateGroup,
    deleteGroup,
    refreshUserGroups,
    refreshGroup,

    // State (readonly)
    groups: groupsStore.items,
    loading: groupsStore.loading,
    error: groupsStore.error,

    // Getters
    getGroup: groupsStore.getGroup,
    getUserGroups: groupsStore.getUserGroups
  }
}
