import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '~/types/database.types'
import { throwServiceError } from '@/utils/serviceLogger'

interface MeResponse {
  user: {
    id: string
    email: string
    email_confirmed_at: string
    last_sign_in_at: string
    created_at: string
  }
  profile: {
    id: string
    username: string
    full_name: string
    avatar_url?: string
    bio?: string
    created_at: string
    updated_at: string
    role: Database['public']['Enums']['user_role']
  }
}

export class MeService {
  constructor(private readonly supabase: SupabaseClient<Database>) {}

  async getCurrentUser(): Promise<MeResponse> {
    const { data, error } = await this.supabase.functions.invoke('me', {
      method: 'GET'
    })

    if (error) throwServiceError('MeService.getCurrentUser', error)
    return data as MeResponse
  }
}
