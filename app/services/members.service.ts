import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '~/types/database.types'
import { throwServiceError } from '@/utils/serviceLogger'

export interface GroupMember {
  id: string
  profile_id: string
  group_id: string
  role: 'owner' | 'admin' | 'member'
  joined_at: string
  profile: {
    id: string
    username: string | null
    full_name: string | null
  }
  score: number // Campo calculado/aleatório por enquanto
}

export interface UpdateMemberData {
  role?: 'owner' | 'admin' | 'member'
  score?: number
}

export class MembersService {
  constructor(private readonly supabase: SupabaseClient<Database>) {}

  async getGroupMembers(groupId: string): Promise<GroupMember[]> {
    const { data, error } = await this.supabase
      .from('group_profile')
      .select(`
        id,
        profile_id,
        group_id,
        role,
        joined_at,
        profiles!inner (
          id,
          username,
          full_name
        )
      `)
      .eq('group_id', groupId)
      .order('joined_at', { ascending: true })

    if (error) throwServiceError('MembersService.getGroupMembers', error)

    // Primeiro buscar todas as sessões do grupo
    const { data: groupSessions } = await this.supabase
      .from('sessions')
      .select('id')
      .eq('group_id', groupId)

    const sessionIds = groupSessions ? groupSessions.map(s => s.id) : []

    // Para cada membro, calcular a soma dos pontos do session_history
    return await Promise.all((data || []).map(async (member) => {
      let totalScore = 0

      if (sessionIds.length > 0) {
        const { data: scoreData, error: scoreError } = await this.supabase
          .from('session_history')
          .select('score')
          .eq('member_id', member.profile_id)
          .in('session_id', sessionIds)

        if (!scoreError && scoreData) {
          totalScore = scoreData.reduce((sum, record) => sum + (record.score || 0), 0)
        }
      }

      return {
        id: member.id,
        profile_id: member.profile_id,
        group_id: member.group_id,
        role: member.role as 'owner' | 'admin' | 'member',
        joined_at: member.joined_at,
        profile: {
          id: member.profiles.id,
          username: member.profiles.username,
          full_name: member.profiles.full_name
        },
        score: totalScore
      }
    }))
  }

  async removeMember(groupId: string, profileId: string): Promise<void> {
    // Verificar se o usuário atual é owner ou admin do grupo
    const { data: { user } } = await this.supabase.auth.getUser()
    if (!user) {
      throw new Error('User not authenticated')
    }

    const { data: currentUserRole } = await this.supabase
      .from('group_profile')
      .select('role')
      .eq('group_id', groupId)
      .eq('profile_id', user.id)
      .single()

    if (!currentUserRole || (currentUserRole.role !== 'owner' && currentUserRole.role !== 'admin')) {
      throw new Error('Você não tem permissão para remover membros')
    }

    // Verificar se não está tentando remover o próprio owner
    const { data: targetMember } = await this.supabase
      .from('group_profile')
      .select('role')
      .eq('group_id', groupId)
      .eq('profile_id', profileId)
      .single()

    if (targetMember?.role === 'owner') {
      throw new Error('Não é possível remover o líder do grupo')
    }

    const { error } = await this.supabase
      .from('group_profile')
      .delete()
      .eq('group_id', groupId)
      .eq('profile_id', profileId)

    if (error) throwServiceError('MembersService.removeMember', error)
  }

  async updateMemberRole(groupId: string, profileId: string, newRole: 'admin' | 'member'): Promise<void> {
    // Verificar se o usuário atual é owner do grupo
    const { data: { user } } = await this.supabase.auth.getUser()
    if (!user) {
      throw new Error('User not authenticated')
    }

    const { data: currentUserRole } = await this.supabase
      .from('group_profile')
      .select('role')
      .eq('group_id', groupId)
      .eq('profile_id', user.id)
      .single()

    if (!currentUserRole || currentUserRole.role !== 'owner') {
      throw new Error('Apenas o líder pode alterar funções de membros')
    }

    // Verificar se não está tentando alterar o próprio owner
    const { data: targetMember } = await this.supabase
      .from('group_profile')
      .select('role')
      .eq('group_id', groupId)
      .eq('profile_id', profileId)
      .single()

    if (targetMember?.role === 'owner') {
      throw new Error('Não é possível alterar a função do líder')
    }

    const { error } = await this.supabase
      .from('group_profile')
      .update({ role: newRole })
      .eq('group_id', groupId)
      .eq('profile_id', profileId)

    if (error) throwServiceError('MembersService.updateMemberRole', error)
  }

  async getMemberById(groupId: string, profileId: string): Promise<GroupMember | null> {
    const { data, error } = await this.supabase
      .from('group_profile')
      .select(`
        id,
        profile_id,
        group_id,
        role,
        joined_at,
        profiles!inner (
          id,
          username,
          full_name
        )
      `)
      .eq('group_id', groupId)
      .eq('profile_id', profileId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null // Não encontrado
      throwServiceError('MembersService.getMemberById', error)
    }

    if (!data) return null

    // Calcular score real do usuário
    // Primeiro buscar as sessões do grupo
    const { data: groupSessions } = await this.supabase
      .from('sessions')
      .select('id')
      .eq('group_id', groupId)

    const sessionIds = groupSessions ? groupSessions.map(s => s.id) : []
    let totalScore = 0

    if (sessionIds.length > 0) {
      const { data: scoreData } = await this.supabase
        .from('session_history')
        .select('score')
        .eq('member_id', data.profile_id)
        .in('session_id', sessionIds)

      totalScore = scoreData ? scoreData.reduce((sum, record) => sum + (record.score || 0), 0) : 0
    }

    return {
      id: data.id,
      profile_id: data.profile_id,
      group_id: data.group_id,
      role: data.role as 'owner' | 'admin' | 'member',
      joined_at: data.joined_at,
      profile: {
        id: data.profiles.id,
        username: data.profiles.username,
        full_name: data.profiles.full_name
      },
      score: totalScore
    }
  }
}
