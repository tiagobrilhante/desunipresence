import type { Database } from '~/types/database.types'
import { MembersService, type GroupMember, type UpdateMemberData } from '@/services/members.service'

export const useMembers = () => {
  const membersStore = useMembersStore()
  const supabase = useSupabaseClient<Database>()
  const memberService = new MembersService(supabase)

  // Buscar membros de um grupo com estratégia "fresh-first"
  const fetchGroupMembers = async (groupId: string, forceRefresh = false): Promise<GroupMember[]> => {
    try {
      membersStore.setLoading(true)
      membersStore.setError(null)

      // Estratégia "fresh-first": sempre busca do servidor em page refresh
      // ou quando cache é inválido ou quando forçado
      const shouldFetchFresh = forceRefresh
        || !membersStore.isCacheValid(groupId)
        || import.meta.client // No cliente, prefere dados frescos

      if (shouldFetchFresh) {
        const data = await memberService.getGroupMembers(groupId)

        if (data) {
          membersStore.setMembers(data, groupId)
        }

        return data || []
      } else {
        // Usa cache apenas se válido e não estivermos no cliente
        return membersStore.getMembersByGroup(groupId)
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao buscar membros'
      membersStore.setError(errorMessage)
      console.error('Error fetching group members:', error)
      return []
    } finally {
      membersStore.setLoading(false)
    }
  }

  // Buscar membro específico por ID
  const fetchMember = async (groupId: string, profileId: string): Promise<GroupMember | null> => {
    try {
      membersStore.setLoading(true)
      membersStore.setError(null)

      const data = await memberService.getMemberById(groupId, profileId)

      if (data) {
        membersStore.setMember(data)
      }

      return data
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao buscar membro'
      membersStore.setError(errorMessage)
      console.error('Error fetching member:', error)
      return null
    } finally {
      membersStore.setLoading(false)
    }
  }

  // Remover membro do grupo
  const removeMember = async (groupId: string, profileId: string): Promise<boolean> => {
    try {
      membersStore.setLoading(true)
      membersStore.setError(null)

      // Encontrar o membro para obter o ID
      const member = membersStore.getMemberByProfileId(groupId, profileId)
      if (!member) {
        throw new Error('Membro não encontrado')
      }

      await memberService.removeMember(groupId, profileId)

      // Remove do cache local
      membersStore.removeMember(member.id)

      return true
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao remover membro'
      membersStore.setError(errorMessage)
      console.error('Error removing member:', error)
      throw error
    } finally {
      membersStore.setLoading(false)
    }
  }

  // Atualizar role do membro
  const updateMemberRole = async (groupId: string, profileId: string, newRole: 'admin' | 'member'): Promise<boolean> => {
    try {
      membersStore.setLoading(true)
      membersStore.setError(null)

      await memberService.updateMemberRole(groupId, profileId, newRole)

      // Atualização otimística no cache
      const member = membersStore.getMemberByProfileId(groupId, profileId)
      if (member) {
        membersStore.updateMemberOptimistic(member.id, { role: newRole })
      }

      return true
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao atualizar função do membro'
      membersStore.setError(errorMessage)
      console.error('Error updating member role:', error)
      throw error
    } finally {
      membersStore.setLoading(false)
    }
  }

  // Refresh dos membros de um grupo (força busca no servidor)
  const refreshGroupMembers = async (groupId: string): Promise<GroupMember[]> => {
    // Remove do cache e força busca nova
    membersStore.invalidateGroupCache(groupId)
    return await fetchGroupMembers(groupId, true)
  }

  // Verificar permissões do usuário atual
  const checkUserPermissions = (groupId: string, userProfileId: string) => {
    return {
      isOwner: membersStore.isUserOwner(groupId, userProfileId),
      isAdminOrOwner: membersStore.isUserAdminOrOwner(groupId, userProfileId),
      canRemoveMembers: membersStore.isUserAdminOrOwner(groupId, userProfileId),
      canUpdateRoles: membersStore.isUserOwner(groupId, userProfileId)
    }
  }

  return {
    // Actions
    fetchGroupMembers,
    fetchMember,
    removeMember,
    updateMemberRole,
    refreshGroupMembers,
    checkUserPermissions,

    // State (readonly)
    members: computed(() => Object.values(membersStore.items)),
    loading: membersStore.loading,
    error: membersStore.error,
    selectedMember: membersStore.selectedMember,

    // Getters
    getMember: membersStore.getMember,
    getMembersByGroup: membersStore.getMembersByGroup,
    getMemberByProfileId: membersStore.getMemberByProfileId,
    isCacheValid: membersStore.isCacheValid,
    isUserOwner: membersStore.isUserOwner,
    isUserAdminOrOwner: membersStore.isUserAdminOrOwner,

    // Store actions
    setSelectedMember: membersStore.setSelectedMember,
    clearSelectedMember: membersStore.clearSelectedMember,
    invalidateGroupCache: membersStore.invalidateGroupCache
  }
}
