import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '~/types/database.types'
import { throwServiceError } from '@/utils/serviceLogger'

interface CreateSessionData {
  name: string
  description?: string | null
  delay: number
  group_id: string
}

interface UpdateSessionData {
  name?: string
  description?: string | null
  delay?: number
}

export class SessionService {
  constructor(private readonly supabase: SupabaseClient<Database>) {}

  async getSessionsByGroup(groupId: string) {
    const { data, error } = await this.supabase
      .from('sessions')
      .select(`
        id,
        name,
        description,
        delay,
        group_id,
        created_at,
        updated_at
      `)
      .eq('group_id', groupId)
      .order('created_at', { ascending: false })

    if (error) throwServiceError('SessionService.getSessionsByGroup', error)
    return data
  }

  async getSessionById(sessionId: string) {
    const { data, error } = await this.supabase
      .from('sessions')
      .select(`
        id,
        name,
        description,
        delay,
        group_id,
        created_at,
        updated_at
      `)
      .eq('id', sessionId)
      .single()

    if (error) throwServiceError('SessionService.getSessionById', error)
    return data
  }

  async createSession(sessionData: CreateSessionData) {
    const { data, error } = await this.supabase
      .from('sessions')
      .insert(sessionData)
      .select(`
        id,
        name,
        description,
        delay,
        group_id,
        created_at,
        updated_at
      `)
      .single()

    if (error) throwServiceError('SessionService.createSession', error)
    return data
  }

  async updateSession(sessionId: string, sessionData: UpdateSessionData) {
    const { data, error } = await this.supabase
      .from('sessions')
      .update(sessionData)
      .eq('id', sessionId)
      .select(`
        id,
        name,
        description,
        delay,
        group_id,
        created_at,
        updated_at
      `)
      .single()

    if (error) throwServiceError('SessionService.updateSession', error)
    return data
  }

  async deleteSession(sessionId: string) {
    const { error } = await this.supabase
      .from('sessions')
      .delete()
      .eq('id', sessionId)

    if (error) throwServiceError('SessionService.deleteSession', error)
    return { success: true }
  }

  // Método específico para buscar sessões recentes (útil para cache refresh)
  async getRecentSessionsByGroup(groupId: string, limit: number = 10) {
    const { data, error } = await this.supabase
      .from('sessions')
      .select(`
        id,
        name,
        description,
        delay,
        group_id,
        created_at,
        updated_at
      `)
      .eq('group_id', groupId)
      .order('updated_at', { ascending: false })
      .limit(limit)

    if (error) throwServiceError('SessionService.getRecentSessionsByGroup', error)
    return data
  }
}
