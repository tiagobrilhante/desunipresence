import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '~/types/database.types'
import { throwServiceError } from '@/utils/serviceLogger'

type ProfileRow = Database['public']['Tables']['profiles']['Row']
type ProfileColumn = keyof ProfileRow
type CreateProfileData = Database['public']['Tables']['profiles']['Insert']
type UpdateProfileData = Database['public']['Tables']['profiles']['Update']

export class ProfileService {
  constructor(private readonly supabase: SupabaseClient<Database>) {}

  async getProfileById(id: string) {
    const { data, error } = await this.supabase
      .from('profiles')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throwServiceError('ProfileService.getProfileById', error)
    return data
  }

  async getProfileByColumn(column: ProfileColumn, value: ProfileRow[ProfileColumn]) {
    const { data, error } = await this.supabase
      .from('profiles')
      .select('*')
      .eq(column, value as never)
      .maybeSingle()

    if (error) throwServiceError('ProfileService.getProfileByColumn', error)
    return data
  }

  async getProfiles() {
    const { data, error } = await this.supabase
      .from('profiles')
      .select('*')
      .order('full_name')

    if (error) throwServiceError('ProfileService.getProfiles', error)
    return data
  }

  async getProfilesByIds(userIds: string[]) {
    const { data, error } = await this.supabase
      .from('profiles')
      .select('*')
      .in('id', userIds)

    if (error) throwServiceError('ProfileService.getProfilesByIds', error)
    return data
  }

  async getProfilesByOrganization(organizationId: string) {
    const { data, error } = await this.supabase
      .from('profiles')
      .select('*')
      .eq('organization_id', organizationId)
      .order('full_name')

    if (error) throwServiceError('ProfileService.getProfilesByOrganization', error)
    return data
  }

  async getCurrentUserProfile(userId?: string) {
    let currentUserId = userId
    
    if (!currentUserId) {
      // Obter usuário atual do Supabase diretamente
      const { data: { user } } = await this.supabase.auth.getUser()
      if (!user) {
        throw new Error('User not authenticated')
      }
      currentUserId = user.id
    }

    return this.getProfileById(currentUserId)
  }

  async createProfile(profileData: CreateProfileData) {
    const { data, error } = await this.supabase
      .from('profiles')
      .insert(profileData)
      .select()
      .single()

    if (error) throwServiceError('ProfileService.createProfile', error)
    return data
  }

  async updateProfile(id: string, profileData: UpdateProfileData) {
    const { data, error } = await this.supabase
      .from('profiles')
      .update(profileData)
      .eq('id', id)
      .select()
      .single()

    if (error) throwServiceError('ProfileService.updateProfile', error)
    return data
  }

  async updateCurrentUserProfile(profileData: UpdateProfileData, userId?: string) {
    let currentUserId = userId
    
    if (!currentUserId) {
      // Obter usuário atual do Supabase diretamente
      const { data: { user } } = await this.supabase.auth.getUser()
      if (!user) {
        throw new Error('User not authenticated')
      }
      currentUserId = user.id
    }

    return this.updateProfile(currentUserId, profileData)
  }

  async deleteProfile(id: string) {
    const { error } = await this.supabase
      .from('profiles')
      .delete()
      .eq('id', id)

    if (error) throwServiceError('ProfileService.deleteProfile', error)
    return { success: true }
  }
}
