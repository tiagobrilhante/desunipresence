import type { SessionHistory } from '@/services/sessionHistory.service'

export const useSessionHistoryStore = defineStore(
  'sessionHistory',
  () => {
    // State - Cache em memória com estratégia fresh-first
    const items = ref<Record<string, SessionHistory>>({})
    const historyBySession = ref<Record<string, string[]>>({}) // sessionId -> historyIds[]
    const loading = ref(false)
    const error = ref<string | null>(null)

    // Cache metadata para controle de refresh
    const lastFetch = ref<Record<string, number>>({}) // sessionId -> timestamp
    const cacheTimeout = 5 * 60 * 1000 // 5 minutos em memória (dados históricos podem ser mais persistentes)

    // Getters
    const getHistoryItem = (id?: string | null) => {
      if (!id) return null
      return items.value[id] ?? null
    }

    const getSessionHistory = (sessionId?: string | null): SessionHistory[] => {
      if (!sessionId) return []
      const historyIds = historyBySession.value[sessionId] || []
      return historyIds.map(id => items.value[id]).filter(Boolean) as SessionHistory[]
    }

    // Verifica se o cache está válido
    const isCacheValid = (sessionId: string) => {
      const lastFetchTime = lastFetch.value[sessionId]
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

    const setHistoryItem = (item: SessionHistory) => {
      items.value[item.id] = item

      // Atualiza o índice por sessão
      const sessionId = item.session_id
      if (!historyBySession.value[sessionId]) {
        historyBySession.value[sessionId] = []
      }

      if (!historyBySession.value[sessionId].includes(item.id)) {
        // Adiciona no início da lista (mais recente primeiro)
        historyBySession.value[sessionId].unshift(item.id)
      }
    }

    const setSessionHistory = (history: SessionHistory[], sessionId?: string) => {
      history.forEach((item) => {
        items.value[item.id] = item
      })

      // Se temos um sessionId específico, atualizamos o índice
      if (sessionId) {
        // Ordena por data (mais recente primeiro)
        const sortedHistory = history.sort((a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )
        historyBySession.value[sessionId] = sortedHistory.map(h => h.id)
        lastFetch.value[sessionId] = Date.now()
      }
    }

    const removeHistoryItem = (id: string) => {
      const item = items.value[id]
      if (item) {
        const sessionId = item.session_id
        const { [id]: removedItem, ...restItems } = items.value
        items.value = restItems

        // Remove do índice por sessão
        if (historyBySession.value[sessionId]) {
          historyBySession.value[sessionId] = historyBySession.value[sessionId].filter(
            historyId => historyId !== id
          )
        }
      }
    }

    const clearAll = () => {
      items.value = {}
      historyBySession.value = {}
      lastFetch.value = {}
      error.value = null
      loading.value = false
    }

    const clearSessionHistory = (sessionId: string) => {
      const historyIds = historyBySession.value[sessionId] || []
      historyIds.forEach((historyId) => {
        const { [historyId]: removedItem, ...restItems } = items.value
        items.value = restItems
      })
      const { [sessionId]: removedSession, ...restSessions } = historyBySession.value
      historyBySession.value = restSessions
      const { [sessionId]: removedFetch, ...restFetch } = lastFetch.value
      lastFetch.value = restFetch
    }

    // Força refresh removendo do cache
    const invalidateSessionCache = (sessionId: string) => {
      const { [sessionId]: removedFetch, ...restFetch } = lastFetch.value
      lastFetch.value = restFetch
      clearSessionHistory(sessionId)
    }

    // Buscar último check-in de um usuário em uma sessão
    const getLastCheckin = (sessionId: string, profileId: string): SessionHistory | null => {
      const sessionHistory = getSessionHistory(sessionId)
      return sessionHistory.find(h =>
        h.member_id === profileId && h.action === 'checkin'
      ) || null
    }

    // Verificar se usuário já fez check-in
    const hasCheckedIn = (sessionId: string, profileId: string): boolean => {
      return getLastCheckin(sessionId, profileId) !== null
    }

    // Obter total de pontos de um usuário em uma sessão
    const getUserSessionScore = (sessionId: string, profileId: string): number => {
      const sessionHistory = getSessionHistory(sessionId)
      return sessionHistory
        .filter(h => h.member_id === profileId)
        .reduce((total, h) => total + h.score, 0)
    }

    return {
      // State
      items,
      historyBySession,
      loading,
      error,
      lastFetch,

      // Getters
      getHistoryItem,
      getSessionHistory,
      isCacheValid,
      getLastCheckin,
      hasCheckedIn,
      getUserSessionScore,

      // Mutations (apenas alterações de estado)
      setError,
      setLoading,
      setHistoryItem,
      setSessionHistory,
      removeHistoryItem,
      clearAll,
      clearSessionHistory,
      invalidateSessionCache
    }
  }
  // Note: SEM persistência - dados ficam apenas em memória para serem sempre fresh
)
