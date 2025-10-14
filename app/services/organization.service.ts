import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '~/types/database.types'
import { throwServiceError } from '@/utils/serviceLogger'

interface CreateOrganizationData {
  name: string
  description?: string | null
  settings?: Record<string, any> | null
}

interface UpdateOrganizationData {
  name?: string
  description?: string | null
  settings?: Record<string, any> | null
}

export class OrganizationService {
  constructor(private readonly supabase: SupabaseClient<Database>) {}

  async getOrganizations() {
    const { data, error } = await this.supabase
      .from('organizations')
      .select('*')
      .order('name')

    if (error) throwServiceError('OrganizationService.getOrganizations', error)
    return data
  }

  async getOrganizationById(organizationId: string) {
    const { data, error } = await this.supabase
      .from('organizations')
      .select('*')
      .eq('id', organizationId)
      .single()

    if (error) throwServiceError('OrganizationService.getOrganizationById', error)
    return data
  }

  async createOrganization(organizationData: CreateOrganizationData) {
    const { data, error } = await this.supabase
      .from('organizations')
      .insert(organizationData)
      .select()
      .single()

    if (error) throwServiceError('OrganizationService.createOrganization', error)
    return data
  }

  async updateOrganization(organizationId: string, organizationData: UpdateOrganizationData) {
    const { data, error } = await this.supabase
      .from('organizations')
      .update(organizationData)
      .eq('id', organizationId)
      .select()
      .single()

    if (error) throwServiceError('OrganizationService.updateOrganization', error)
    return data
  }

  async deleteOrganization(organizationId: string) {
    const { error } = await this.supabase
      .from('organizations')
      .delete()
      .eq('id', organizationId)

    if (error) throwServiceError('OrganizationService.deleteOrganization', error)
    return { success: true }
  }

  async getUserOrganization(userId?: string) {
    let currentUserId = userId
    
    if (!currentUserId) {
      // Obter usuário atual do Supabase diretamente
      const { data: { user } } = await this.supabase.auth.getUser()
      if (!user) {
        throw new Error('User not authenticated')
      }
      currentUserId = user.id
    }

    // Busca a organização do usuário através do perfil
    const { data, error } = await this.supabase
      .from('profiles')
      .select(`
        organization_id,
        organizations:organization_id (*)
      `)
      .eq('id', currentUserId)
      .single()

    if (error) throwServiceError('OrganizationService.getUserOrganization', error)
    
    return data?.organizations || null
  }

  async getOrganizationMembers(organizationId: string) {
    const { data, error } = await this.supabase
      .from('profiles')
      .select('*')
      .eq('organization_id', organizationId)
      .order('full_name')

    if (error) throwServiceError('OrganizationService.getOrganizationMembers', error)
    return data
  }
}