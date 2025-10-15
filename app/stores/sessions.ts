import type { Database } from '~/types/database.types'

type Session = Database['public']['Tables']['sessions']['Row']

export const useSessionsStore = defineStore(
  'sessions',
  () => {
    // State - Cache em memória apenas (sem persistência para ser sempre fresh)
    const items = ref<Record<string, Session>>({})
    const sessionsByGroup = ref<Record<string, string[]>>({}) // groupId -> sessionIds[]
    const selectedSession = ref<Session | null>(null)
    const loading = ref(false)
    const error = ref<string | null>(null)

    // Cache metadata para controle de refresh
    const lastFetch = ref<Record<string, number>>({}) // groupId -> timestamp
    const cacheTimeout = 5 * 60 * 1000 // 5 minutos em memória

    // Getters
    const getSession = (id?: string | null) => {
      if (!id) return null
      return items.value[id] ?? null
    }

    const getSessionsByGroup = (groupId?: string | null): Session[] => {
      if (!groupId) return []
      const sessionIds = sessionsByGroup.value[groupId] || []
      return sessionIds.map(id => items.value[id]).filter(Boolean) as Session[]
    }

    // Verifica se o cache está válido (útil para estratégia refresh)
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

    const setSession = (session: Session) => {
      items.value[session.id] = session

      // Atualiza o índice por grupo
      const groupId = session.group_id
      if (!sessionsByGroup.value[groupId]) {
        sessionsByGroup.value[groupId] = []
      }

      if (!sessionsByGroup.value[groupId].includes(session.id)) {
        sessionsByGroup.value[groupId].push(session.id)
      }
    }

    const setSessions = (sessions: Session[], groupId?: string) => {
      sessions.forEach((session) => {
        items.value[session.id] = session
      })

      // Se temos um groupId específico, atualizamos o índice
      if (groupId) {
        sessionsByGroup.value[groupId] = sessions.map(s => s.id)
        lastFetch.value[groupId] = Date.now()
      }
    }

    const removeSession = (id: string) => {
      const session = items.value[id]
      if (session) {
        const groupId = session.group_id
        const { [id]: removedItem, ...restItems } = items.value
        items.value = restItems

        // Remove do índice por grupo
        if (sessionsByGroup.value[groupId]) {
          sessionsByGroup.value[groupId] = sessionsByGroup.value[groupId].filter(
            sessionId => sessionId !== id
          )
        }
      }
    }

    const clearAll = () => {
      items.value = {}
      sessionsByGroup.value = {}
      lastFetch.value = {}
      error.value = null
      loading.value = false
      selectedSession.value = null
    }

    const clearGroupSessions = (groupId: string) => {
      const sessionIds = sessionsByGroup.value[groupId] || []
      sessionIds.forEach((sessionId) => {
        const { [sessionId]: removedItem, ...restItems } = items.value
        items.value = restItems
      })
      const { [groupId]: removedGroup, ...restGroups } = sessionsByGroup.value
      sessionsByGroup.value = restGroups
      const { [groupId]: removedFetch, ...restFetch } = lastFetch.value
      lastFetch.value = restFetch
    }

    const setSelectedSession = (session: Session | null) => {
      selectedSession.value = session
    }

    const clearSelectedSession = () => {
      selectedSession.value = null
    }

    // Força refresh removendo do cache (estratégia fresh)
    const invalidateGroupCache = (groupId: string) => {
      const { [groupId]: removedFetch, ...restFetch } = lastFetch.value
      lastFetch.value = restFetch
      clearGroupSessions(groupId)
    }

    // Atualização otimística - atualiza UI imediatamente
    const updateSessionOptimistic = (sessionId: string, updates: Partial<Session>) => {
      const existingSession = items.value[sessionId]
      if (existingSession) {
        items.value[sessionId] = {
          ...existingSession,
          ...updates,
          updated_at: new Date().toISOString()
        }
      }
    }

    // Sincroniza uma sessão específica com o servidor
    const syncSingleSession = async (sessionId: string) => {
      try {
        const supabase = useSupabaseClient()
        const { SessionService } = await import('@/services/sessions.service')
        const sessionService = new SessionService(supabase)

        const updatedSession = await sessionService.getSessionById(sessionId)
        if (updatedSession) {
          setSession(updatedSession)
        }
      } catch (error) {
        console.error('Erro ao sincronizar sessão:', error)
        // Em caso de erro, pode forçar um refresh completo se necessário
      }
    }

    return {
      // State
      items,
      sessionsByGroup,
      selectedSession,
      loading,
      error,
      lastFetch,

      // Getters
      getSession,
      getSessionsByGroup,
      isCacheValid,

      // Mutations (apenas alterações de estado)
      setError,
      setLoading,
      setSession,
      setSessions,
      removeSession,
      clearAll,
      clearGroupSessions,
      setSelectedSession,
      clearSelectedSession,
      invalidateGroupCache,
      updateSessionOptimistic,
      syncSingleSession
    }
  }
  // Note: SEM persistência - dados ficam apenas em memória para serem sempre fresh
)
