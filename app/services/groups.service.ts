import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '~/types/database.types'
import { throwServiceError } from '@/utils/serviceLogger'
import { generateGroupCode } from '@/utils/codeGenerator'

interface CreateGroupData {
  name: string
  description?: string | null
  code?: string
  owner_id?: string
}

interface UpdateGroupData {
  name?: string
  description?: string | null
  code?: string
}

export class GroupService {
  constructor(private readonly supabase: SupabaseClient<Database>) {}

  async getGroups(userId?: string) {
    let currentUserId = userId

    if (!currentUserId) {
      // Obter usuário atual do Supabase diretamente
      const { data: { user } } = await this.supabase.auth.getUser()
      if (!user) {
        throw new Error('User not authenticated')
      }
      currentUserId = user.id
    }

    const { data, error } = await this.supabase
      .from('group_profile')
      .select(`
        role,
        joined_at,
        groups!inner (
          id,
          name,
          description,
          code,
          owner_id,
          created_at
        )
      `)
      .eq('profile_id', currentUserId)

    if (error) throwServiceError('GroupService.getGroups', error)
    return data
  }

  async createGroup(groupData: CreateGroupData) {
    let ownerId = groupData.owner_id

    if (!ownerId) {
      // Obter usuário atual do Supabase diretamente
      const { data: { user } } = await this.supabase.auth.getUser()
      if (!user) {
        throw new Error('User not authenticated')
      }
      ownerId = user.id
    }
    const code = groupData.code || generateGroupCode()
    const dataToInsert = {
      ...groupData,
      owner_id: ownerId,
      code
    }

    const { data, error } = await this.supabase
      .from('groups')
      .insert(dataToInsert)
      .select()
      .single()

    if (error) throwServiceError('GroupService.createGroup', error)
    return data
  }

  async updateGroup(groupId: string, groupData: UpdateGroupData) {
    const { data, error } = await this.supabase
      .from('groups')
      .update(groupData)
      .eq('id', groupId)
      .select()
      .single()

    if (error) throwServiceError('GroupService.updateGroup', error)
    return data
  }

  async deleteGroup(groupId: string) {
    const { error } = await this.supabase
      .from('groups')
      .delete()
      .eq('id', groupId)

    if (error) throwServiceError('GroupService.deleteGroup', error)
    return { success: true }
  }

  async getGroupById(groupId: string) {
    const { data, error } = await this.supabase
      .from('groups')
      .select('id, name, description, code, owner_id, created_at')
      .eq('id', groupId)
      .single()

    if (error) throwServiceError('GroupService.getGroupById', error)
    return data
  }
}
