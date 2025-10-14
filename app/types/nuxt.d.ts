import type { SupabaseClient, Session, User } from '@supabase/supabase-js'
import type { Ref } from 'vue'
import type { Pinia } from 'pinia'
import type { DatabaseTypes } from '~/types/database.types'

declare module '#app' {
  interface NuxtApp {
    $supabase: SupabaseClient<DatabaseTypes>
    $supabaseSession: Ref<Session | null>
    $supabaseUser: Ref<User | null>
    $pinia: Pinia
  }
}

declare module 'vue' {
  interface ComponentCustomProperties {
    $supabase: SupabaseClient<DatabaseTypes>
  }
}

export {}
