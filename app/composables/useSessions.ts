import type { Database } from '~/types/database.types'
import { SessionService } from '@/services/sessions.service'

type Session = Database['public']['Tables']['sessions']['Row']
type CreateSessionData = Parameters<SessionService['createSession']>[0]
type UpdateSessionData = Parameters<SessionService['updateSession']>[1]

export const useSessions = () => {
  const sessionsStore = useSessionsStore()
  const supabase = useSupabaseClient<Database>()
  const sessionService = new SessionService(supabase)

  // Buscar sessões por grupo com estratégia "fresh-first"
  const fetchSessionsByGroup = async (groupId: string, forceRefresh = false): Promise<Session[]> => {
    try {
      sessionsStore.setLoading(true)
      sessionsStore.setError(null)

      // Estratégia "fresh-first": sempre busca do servidor em page refresh
      // ou quando cache é inválido ou quando forçado
      const shouldFetchFresh = forceRefresh
        || !sessionsStore.isCacheValid(groupId)
        || import.meta.client // No cliente, prefere dados frescos

      if (shouldFetchFresh) {
        const data = await sessionService.getSessionsByGroup(groupId)

        if (data) {
          sessionsStore.setSessions(data, groupId)
        }

        return data || []
      } else {
        // Usa cache apenas se válido e não estivermos no cliente
        return sessionsStore.getSessionsByGroup(groupId) as Session[]
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao buscar sessões'
      sessionsStore.setError(errorMessage)
      console.error('Error fetching sessions:', error)
      return []
    } finally {
      sessionsStore.setLoading(false)
    }
  }

  // Buscar sessão por ID (sempre fresh por ser mais específico)
  const fetchSession = async (id: string): Promise<Session | null> => {
    try {
      sessionsStore.setLoading(true)
      sessionsStore.setError(null)

      const data = await sessionService.getSessionById(id)

      if (data) {
        sessionsStore.setSession(data)
      }

      return data
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao buscar sessão'
      sessionsStore.setError(errorMessage)
      console.error('Error fetching session:', error)
      return null
    } finally {
      sessionsStore.setLoading(false)
    }
  }

  // Criar nova sessão
  const createSession = async (sessionData: CreateSessionData): Promise<Session | null> => {
    try {
      sessionsStore.setLoading(true)
      sessionsStore.setError(null)

      const data = await sessionService.createSession(sessionData)

      if (data) {
        sessionsStore.setSession(data)
        // Invalida cache do grupo para forçar refresh na próxima busca
        sessionsStore.invalidateGroupCache(sessionData.group_id)
      }

      return data
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao criar sessão'
      sessionsStore.setError(errorMessage)
      console.error('Error creating session:', error)
      throw error
    } finally {
      sessionsStore.setLoading(false)
    }
  }

  // Atualizar sessão
  const updateSession = async (id: string, sessionData: UpdateSessionData): Promise<Session | null> => {
    try {
      sessionsStore.setLoading(true)
      sessionsStore.setError(null)

      const data = await sessionService.updateSession(id, sessionData)

      if (data) {
        sessionsStore.setSession(data)
        // Invalida cache do grupo para forçar refresh
        sessionsStore.invalidateGroupCache(data.group_id)
      }

      return data
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao atualizar sessão'
      sessionsStore.setError(errorMessage)
      console.error('Error updating session:', error)
      throw error
    } finally {
      sessionsStore.setLoading(false)
    }
  }

  // Deletar sessão
  const deleteSession = async (id: string): Promise<boolean> => {
    try {
      sessionsStore.setLoading(true)
      sessionsStore.setError(null)

      // Pega a sessão antes de deletar para saber o grupo
      const session = sessionsStore.getSession(id)

      await sessionService.deleteSession(id)

      sessionsStore.removeSession(id)

      // Invalida cache do grupo se soubermos qual é
      if (session) {
        sessionsStore.invalidateGroupCache(session.group_id)
      }

      return true
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao deletar sessão'
      sessionsStore.setError(errorMessage)
      console.error('Error deleting session:', error)
      throw error
    } finally {
      sessionsStore.setLoading(false)
    }
  }

  // Refresh explícito das sessões de um grupo (sempre fresh)
  const refreshGroupSessions = async (groupId: string): Promise<Session[]> => {
    // Remove do cache e força busca nova
    sessionsStore.invalidateGroupCache(groupId)
    return await fetchSessionsByGroup(groupId, true)
  }

  // Refresh explícito de uma sessão específica (sempre fresh)
  const refreshSession = async (id: string): Promise<Session | null> => {
    // Sempre busca fresh para sessão específica
    return await fetchSession(id)
  }

  // Buscar sessões recentes (útil para dashboards)
  const fetchRecentSessions = async (groupId: string, limit = 5): Promise<Session[]> => {
    try {
      sessionsStore.setLoading(true)
      sessionsStore.setError(null)

      const data = await sessionService.getRecentSessionsByGroup(groupId, limit)

      // Não adiciona ao cache principal, apenas retorna os dados
      return data || []
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao buscar sessões recentes'
      sessionsStore.setError(errorMessage)
      console.error('Error fetching recent sessions:', error)
      return []
    } finally {
      sessionsStore.setLoading(false)
    }
  }

  return {
    // Actions com foco em dados frescos
    fetchSessionsByGroup,
    fetchSession,
    createSession,
    updateSession,
    deleteSession,
    refreshGroupSessions,
    refreshSession,
    fetchRecentSessions,

    // State (readonly)
    sessions: computed(() => Object.values(sessionsStore.items)),
    loading: sessionsStore.loading,
    error: sessionsStore.error,
    selectedSession: sessionsStore.selectedSession,

    // Getters
    getSession: sessionsStore.getSession,
    getSessionsByGroup: sessionsStore.getSessionsByGroup,
    isCacheValid: sessionsStore.isCacheValid,

    // Store actions
    setSelectedSession: sessionsStore.setSelectedSession,
    clearSelectedSession: sessionsStore.clearSelectedSession,
    invalidateGroupCache: sessionsStore.invalidateGroupCache
  }
}
