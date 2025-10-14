import type { Database } from '~/types/database.types'
import { OrganizationService } from '@/services/organization.service'

type Organization = Database['public']['Tables']['organizations']['Row']
type CreateOrganizationData = Parameters<OrganizationService['createOrganization']>[0]
type UpdateOrganizationData = Parameters<OrganizationService['updateOrganization']>[1]

export const useOrganizations = () => {
  const organizationsStore = useOrganizationsStore()
  const supabase = useSupabaseClient<Database>()
  const organizationService = new OrganizationService(supabase)

  // Buscar organização por ID (com cache inteligente)
  const fetchOrganization = async (id: string): Promise<Organization | null> => {
    // Verifica cache primeiro
    const cached = organizationsStore.getOrganization(id)
    if (cached) return cached

    try {
      organizationsStore.setLoading(true)
      organizationsStore.setError(null)

      const data = await organizationService.getOrganizationById(id)

      if (data) {
        organizationsStore.setOrganization(data)
      }

      return data
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao buscar organização'
      organizationsStore.setError(errorMessage)
      console.error('Error fetching organization:', error)
      return null
    } finally {
      organizationsStore.setLoading(false)
    }
  }

  // Buscar organização do usuário logado
  const fetchUserOrganization = async (userId?: string): Promise<Organization | null> => {
    try {
      organizationsStore.setLoading(true)
      organizationsStore.setError(null)

      const data = await organizationService.getUserOrganization(userId)

      if (data) {
        organizationsStore.setOrganization(data)
      }

      return data
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao buscar organização do usuário'
      organizationsStore.setError(errorMessage)
      console.error('Error fetching user organization:', error)
      return null
    } finally {
      organizationsStore.setLoading(false)
    }
  }

  // Criar nova organização
  const createOrganization = async (organizationData: CreateOrganizationData): Promise<Organization | null> => {
    try {
      organizationsStore.setLoading(true)
      organizationsStore.setError(null)

      const data = await organizationService.createOrganization(organizationData)

      if (data) {
        organizationsStore.setOrganization(data)
        // TODO: Aqui podemos adicionar notificações, logs, etc.
      }

      return data
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao criar organização'
      organizationsStore.setError(errorMessage)
      console.error('Error creating organization:', error)
      throw error
    } finally {
      organizationsStore.setLoading(false)
    }
  }

  // Atualizar organização
  const updateOrganization = async (id: string, organizationData: UpdateOrganizationData): Promise<Organization | null> => {
    try {
      organizationsStore.setLoading(true)
      organizationsStore.setError(null)

      const data = await organizationService.updateOrganization(id, organizationData)

      if (data) {
        organizationsStore.setOrganization(data)
        // TODO: Adicionar notificação de sucesso
      }

      return data
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao atualizar organização'
      organizationsStore.setError(errorMessage)
      console.error('Error updating organization:', error)
      throw error
    } finally {
      organizationsStore.setLoading(false)
    }
  }

  // Deletar organização
  const deleteOrganization = async (id: string): Promise<boolean> => {
    try {
      organizationsStore.setLoading(true)
      organizationsStore.setError(null)

      await organizationService.deleteOrganization(id)

      organizationsStore.removeOrganization(id)
      // TODO: Adicionar notificação de sucesso

      return true
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao deletar organização'
      organizationsStore.setError(errorMessage)
      console.error('Error deleting organization:', error)
      throw error
    } finally {
      organizationsStore.setLoading(false)
    }
  }

  // Buscar membros da organização
  const fetchOrganizationMembers = async (organizationId: string) => {
    try {
      organizationsStore.setLoading(true)
      organizationsStore.setError(null)

      const data = await organizationService.getOrganizationMembers(organizationId)

      // TODO: Aqui podemos armazenar em uma store separada para membros se necessário

      return data
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao buscar membros da organização'
      organizationsStore.setError(errorMessage)
      console.error('Error fetching organization members:', error)
      return []
    } finally {
      organizationsStore.setLoading(false)
    }
  }

  // Refresh da organização (força busca no servidor)
  const refreshOrganization = async (id: string): Promise<Organization | null> => {
    // Remove do cache e busca novamente
    organizationsStore.removeOrganization(id)
    return await fetchOrganization(id)
  }

  return {
    // Actions
    fetchOrganization,
    fetchUserOrganization,
    createOrganization,
    updateOrganization,
    deleteOrganization,
    fetchOrganizationMembers,
    refreshOrganization,

    // State (readonly)
    organizations: organizationsStore.items,
    loading: organizationsStore.loading,
    error: organizationsStore.error,

    // Getters
    getOrganization: organizationsStore.getOrganization
  }
}
