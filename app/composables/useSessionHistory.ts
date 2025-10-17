import type { Database } from '~/types/database.types'
import { SessionHistoryService, type SessionHistory, type CreateSessionHistoryData } from '@/services/sessionHistory.service'

export const useSessionHistory = () => {
  const sessionHistoryStore = useSessionHistoryStore()
  const supabase = useSupabaseClient<Database>()
  const sessionHistoryService = new SessionHistoryService(supabase)

  // Buscar histórico de uma sessão com estratégia "fresh-first"
  const fetchSessionHistory = async (sessionId: string, forceRefresh = false): Promise<SessionHistory[]> => {
    try {
      sessionHistoryStore.setLoading(true)
      sessionHistoryStore.setError(null)

      // Estratégia "fresh-first": sempre busca do servidor em page refresh
      // ou quando cache é inválido ou quando forçado
      const shouldFetchFresh = forceRefresh
        || !sessionHistoryStore.isCacheValid(sessionId)
        || import.meta.client // No cliente, prefere dados frescos

      if (shouldFetchFresh) {
        const data = await sessionHistoryService.getSessionHistory(sessionId)

        if (data) {
          sessionHistoryStore.setSessionHistory(data, sessionId)
        }

        return data || []
      } else {
        // Usa cache apenas se válido e não estivermos no cliente
        return sessionHistoryStore.getSessionHistory(sessionId)
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao buscar histórico da sessão'
      sessionHistoryStore.setError(errorMessage)
      console.error('Error fetching session history:', error)
      return []
    } finally {
      sessionHistoryStore.setLoading(false)
    }
  }

  // Criar entrada no histórico
  const createHistoryEntry = async (data: CreateSessionHistoryData): Promise<SessionHistory | null> => {
    try {
      sessionHistoryStore.setLoading(true)
      sessionHistoryStore.setError(null)

      const result = await sessionHistoryService.createSessionHistory(data)

      if (result) {
        sessionHistoryStore.setHistoryItem(result)
      }

      return result
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao criar entrada no histórico'
      sessionHistoryStore.setError(errorMessage)
      console.error('Error creating history entry:', error)
      throw error
    } finally {
      sessionHistoryStore.setLoading(false)
    }
  }

  // Fazer check-in (função principal)
  const performCheckin = async (sessionId: string, memberId?: string): Promise<SessionHistory | null> => {
    try {
      sessionHistoryStore.setLoading(true)
      sessionHistoryStore.setError(null)

      const result = await sessionHistoryService.createCheckin(sessionId, memberId)

      if (result) {
        sessionHistoryStore.setHistoryItem(result)
      }

      return result
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao fazer check-in'
      sessionHistoryStore.setError(errorMessage)
      console.error('Error performing checkin:', error)
      throw error
    } finally {
      sessionHistoryStore.setLoading(false)
    }
  }

  // Deletar entrada do histórico
  const deleteHistoryEntry = async (id: string): Promise<boolean> => {
    try {
      sessionHistoryStore.setLoading(true)
      sessionHistoryStore.setError(null)

      await sessionHistoryService.deleteSessionHistory(id)

      // Remove do cache local
      sessionHistoryStore.removeHistoryItem(id)

      return true
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao deletar entrada do histórico'
      sessionHistoryStore.setError(errorMessage)
      console.error('Error deleting history entry:', error)
      throw error
    } finally {
      sessionHistoryStore.setLoading(false)
    }
  }

  // Refresh do histórico de uma sessão (força busca no servidor)
  const refreshSessionHistory = async (sessionId: string): Promise<SessionHistory[]> => {
    // Remove do cache e força busca nova
    sessionHistoryStore.invalidateSessionCache(sessionId)
    return await fetchSessionHistory(sessionId, true)
  }

  // Verificar se usuário pode fazer check-in
  const canCheckin = (sessionId: string, profileId: string): boolean => {
    return !sessionHistoryStore.hasCheckedIn(sessionId, profileId)
  }

  // Obter estatísticas de uma sessão
  const getSessionStats = (sessionId: string) => {
    const history = sessionHistoryStore.getSessionHistory(sessionId)
    const checkins = history.filter(h => h.action === 'checkin')
    const totalParticipants = new Set(checkins.map(h => h.member_id)).size
    const totalScore = history.reduce((total, h) => total + h.score, 0)

    return {
      totalEntries: history.length,
      totalCheckins: checkins.length,
      totalParticipants,
      totalScore,
      latestActivity: history[0]?.created_at || null
    }
  }

  // Buscar histórico do grupo com filtros
  const fetchGroupHistory = async (groupId: string, memberId?: string, sessionId?: string): Promise<SessionHistory[]> => {
    try {
      sessionHistoryStore.setLoading(true)
      sessionHistoryStore.setError(null)

      const data = await sessionHistoryService.getGroupHistory(groupId, memberId, sessionId)
      return data || []
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao buscar histórico do grupo'
      sessionHistoryStore.setError(errorMessage)
      console.error('Error fetching group history:', error)
      return []
    } finally {
      sessionHistoryStore.setLoading(false)
    }
  }

  return {
    // Actions
    fetchSessionHistory,
    fetchGroupHistory,
    createHistoryEntry,
    performCheckin,
    deleteHistoryEntry,
    refreshSessionHistory,
    canCheckin,
    getSessionStats,

    // State (readonly)
    history: computed(() => Object.values(sessionHistoryStore.items)),
    loading: sessionHistoryStore.loading,
    error: sessionHistoryStore.error,

    // Getters
    getHistoryItem: sessionHistoryStore.getHistoryItem,
    getSessionHistory: sessionHistoryStore.getSessionHistory,
    isCacheValid: sessionHistoryStore.isCacheValid,
    getLastCheckin: sessionHistoryStore.getLastCheckin,
    hasCheckedIn: sessionHistoryStore.hasCheckedIn,
    getUserSessionScore: sessionHistoryStore.getUserSessionScore,

    // Store actions
    invalidateSessionCache: sessionHistoryStore.invalidateSessionCache
  }
}
