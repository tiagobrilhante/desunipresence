import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '~/types/database.types'
import { throwServiceError } from '@/utils/serviceLogger'

export interface SessionHistory {
  id: string
  created_at: string
  session_id: string
  member_id: string
  action: string
  action_description: string | null
  score: number
  by_profile_id: string
  member_profile: {
    id: string
    username: string | null
    full_name: string | null
  }
  by_profile: {
    id: string
    username: string | null
    full_name: string | null
  }
}

export interface CreateSessionHistoryData {
  session_id: string
  member_id: string
  action: string
  action_description?: string | null
  score?: number
}

export class SessionHistoryService {
  constructor(private readonly supabase: SupabaseClient<Database>) {}

  async createSessionHistory(data: CreateSessionHistoryData): Promise<SessionHistory> {
    // Obter usuário atual para o campo by_profile_id
    const { data: { user } } = await this.supabase.auth.getUser()
    if (!user) {
      throw new Error('User not authenticated')
    }

    const { data: result, error } = await this.supabase
      .from('session_history')
      .insert({
        session_id: data.session_id,
        member_id: data.member_id,
        action: data.action,
        action_description: data.action_description || null,
        score: data.score || 0,
        by_profile_id: user.id
      })
      .select(`
        id,
        created_at,
        session_id,
        member_id,
        action,
        action_description,
        score,
        by_profile_id,
        member_profile:profiles!member_id (
          id,
          username,
          full_name
        ),
        by_profile:profiles!by_profile_id (
          id,
          username,
          full_name
        )
      `)
      .single()

    if (error) throwServiceError('SessionHistoryService.createSessionHistory', error)

    if (result) {
      return {
        id: result.id,
        created_at: result.created_at,
        session_id: result.session_id,
        member_id: result.member_id,
        action: result.action,
        action_description: result.action_description,
        score: result.score,
        by_profile_id: result.by_profile_id,
        member_profile: {
          id: result.member_profile.id,
          username: result.member_profile.username,
          full_name: result.member_profile.full_name
        },
        by_profile: {
          id: result.by_profile.id,
          username: result.by_profile.username,
          full_name: result.by_profile.full_name
        }
      }
    }

    throw new Error('Failed to create session history')
  }

  async getSessionHistory(sessionId: string): Promise<SessionHistory[]> {
    const { data, error } = await this.supabase
      .from('session_history')
      .select(`
        id,
        created_at,
        session_id,
        member_id,
        action,
        action_description,
        score,
        by_profile_id,
        member_profile:profiles!member_id (
          id,
          username,
          full_name
        ),
        by_profile:profiles!by_profile_id (
          id,
          username,
          full_name
        )
      `)
      .eq('session_id', sessionId)
      .order('created_at', { ascending: false })

    if (error) throwServiceError('SessionHistoryService.getSessionHistory', error)

    return (data || []).map(item => ({
      id: item.id,
      created_at: item.created_at,
      session_id: item.session_id,
      member_id: item.member_id,
      action: item.action,
      action_description: item.action_description,
      score: item.score,
      by_profile_id: item.by_profile_id,
      member_profile: {
        id: item.member_profile.id,
        username: item.member_profile.username,
        full_name: item.member_profile.full_name
      },
      by_profile: {
        id: item.by_profile.id,
        username: item.by_profile.username,
        full_name: item.by_profile.full_name
      }
    }))
  }

  async createCheckin(sessionId: string, memberId?: string): Promise<SessionHistory> {
    // Se não especificar memberId, usa o usuário atual
    let targetMemberId = memberId
    if (!targetMemberId) {
      const { data: { user } } = await this.supabase.auth.getUser()
      if (!user) {
        throw new Error('User not authenticated')
      }
      targetMemberId = user.id
    }

    // Verificar se a sessão existe e está aberta
    const { data: session, error: sessionError } = await this.supabase
      .from('sessions')
      .select('id, status')
      .eq('id', sessionId)
      .single()

    if (sessionError) {
      throw new Error('Sessão não encontrada')
    }

    if (session.status !== 'open') {
      throw new Error('Check-in só é permitido em sessões abertas')
    }

    // Verificar se o usuário já fez check-in nesta sessão
    const { data: existingCheckin } = await this.supabase
      .from('session_history')
      .select('id')
      .eq('session_id', sessionId)
      .eq('member_id', targetMemberId)
      .eq('action', 'checkin')
      .single()

    if (existingCheckin) {
      throw new Error('Você já fez check-in nesta sessão')
    }

    return await this.createSessionHistory({
      session_id: sessionId,
      member_id: targetMemberId,
      action: 'checkin',
      action_description: 'Fez check-in na sessão',
      score: 100 // Score fixo por enquanto
    })
  }

  async deleteSessionHistory(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('session_history')
      .delete()
      .eq('id', id)

    if (error) throwServiceError('SessionHistoryService.deleteSessionHistory', error)
  }
}
