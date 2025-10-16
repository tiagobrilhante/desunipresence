import type { GroupMember } from '@/services/members.service'

export const useMembersStore = defineStore(
  'members',
  () => {
    // State - Cache em memória com estratégia de refresh
    const items = ref<Record<string, GroupMember>>({})
    const membersByGroup = ref<Record<string, string[]>>({}) // groupId -> memberIds[]
    const selectedMember = ref<GroupMember | null>(null)
    const loading = ref(false)
    const error = ref<string | null>(null)

    // Cache metadata para controle de refresh
    const lastFetch = ref<Record<string, number>>({}) // groupId -> timestamp
    const cacheTimeout = 3 * 60 * 1000 // 3 minutos em memória (mais frequente que groups)

    // Getters
    const getMember = (id?: string | null) => {
      if (!id) return null
      return items.value[id] ?? null
    }

    const getMembersByGroup = (groupId?: string | null): GroupMember[] => {
      if (!groupId) return []
      const memberIds = membersByGroup.value[groupId] || []
      return memberIds.map(id => items.value[id]).filter(Boolean) as GroupMember[]
    }

    // Verifica se o cache está válido
    const isCacheValid = (groupId: string) => {
      const lastFetchTime = lastFetch.value[groupId]
      if (!lastFetchTime) return false
      return Date.now() - lastFetchTime < cacheTimeout
    }

    // Mutations (ações básicas de estado)
    const setError = (errorMessage: string | null) => {
      error.value = errorMessage
    }

    const setLoading = (isLoading: boolean) => {
      loading.value = isLoading
    }

    const setMember = (member: GroupMember) => {
      items.value[member.id] = member

      // Atualiza o índice por grupo
      const groupId = member.group_id
      if (!membersByGroup.value[groupId]) {
        membersByGroup.value[groupId] = []
      }

      if (!membersByGroup.value[groupId].includes(member.id)) {
        membersByGroup.value[groupId].push(member.id)
      }
    }

    const setMembers = (members: GroupMember[], groupId?: string) => {
      members.forEach((member) => {
        items.value[member.id] = member
      })

      // Se temos um groupId específico, atualizamos o índice
      if (groupId) {
        membersByGroup.value[groupId] = members.map(m => m.id)
        lastFetch.value[groupId] = Date.now()
      }
    }

    const removeMember = (id: string) => {
      const member = items.value[id]
      if (member) {
        const groupId = member.group_id
        const { [id]: removedItem, ...restItems } = items.value
        items.value = restItems

        // Remove do índice por grupo
        if (membersByGroup.value[groupId]) {
          membersByGroup.value[groupId] = membersByGroup.value[groupId].filter(
            memberId => memberId !== id
          )
        }
      }
    }

    const clearAll = () => {
      items.value = {}
      membersByGroup.value = {}
      lastFetch.value = {}
      error.value = null
      loading.value = false
      selectedMember.value = null
    }

    const clearGroupMembers = (groupId: string) => {
      const memberIds = membersByGroup.value[groupId] || []
      memberIds.forEach((memberId) => {
        const { [memberId]: removedItem, ...restItems } = items.value
        items.value = restItems
      })
      const { [groupId]: removedGroup, ...restGroups } = membersByGroup.value
      membersByGroup.value = restGroups
      const { [groupId]: removedFetch, ...restFetch } = lastFetch.value
      lastFetch.value = restFetch
    }

    const setSelectedMember = (member: GroupMember | null) => {
      selectedMember.value = member
    }

    const clearSelectedMember = () => {
      selectedMember.value = null
    }

    // Força refresh removendo do cache
    const invalidateGroupCache = (groupId: string) => {
      const { [groupId]: removedFetch, ...restFetch } = lastFetch.value
      lastFetch.value = restFetch
      clearGroupMembers(groupId)
    }

    // Atualização otimística - atualiza UI imediatamente
    const updateMemberOptimistic = (memberId: string, updates: Partial<GroupMember>) => {
      const existingMember = items.value[memberId]
      if (existingMember) {
        items.value[memberId] = {
          ...existingMember,
          ...updates
        }
      }
    }

    // Buscar membro específico por profile_id em um grupo
    const getMemberByProfileId = (groupId: string, profileId: string): GroupMember | null => {
      const groupMembers = getMembersByGroup(groupId)
      return groupMembers.find(member => member.profile_id === profileId) || null
    }

    // Verificar se usuário é owner do grupo
    const isUserOwner = (groupId: string, profileId: string): boolean => {
      const member = getMemberByProfileId(groupId, profileId)
      return member?.role === 'owner'
    }

    // Verificar se usuário é admin ou owner do grupo
    const isUserAdminOrOwner = (groupId: string, profileId: string): boolean => {
      const member = getMemberByProfileId(groupId, profileId)
      return member?.role === 'owner' || member?.role === 'admin'
    }

    return {
      // State
      items,
      membersByGroup,
      selectedMember,
      loading,
      error,
      lastFetch,

      // Getters
      getMember,
      getMembersByGroup,
      getMemberByProfileId,
      isCacheValid,
      isUserOwner,
      isUserAdminOrOwner,

      // Mutations (apenas alterações de estado)
      setError,
      setLoading,
      setMember,
      setMembers,
      removeMember,
      clearAll,
      clearGroupMembers,
      setSelectedMember,
      clearSelectedMember,
      invalidateGroupCache,
      updateMemberOptimistic
    }
  }
)
