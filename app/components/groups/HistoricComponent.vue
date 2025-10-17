<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'

const UBadge = resolveComponent('UBadge')

const toast = useToast()
const user = useSupabaseUser()

type Historic = {
  id: string
  memberName: string
  sessionName: string
  action: string
  description: string
  score: number
  date: string
}

// Buscar dados reais
const { fetchGroupHistory, loading } = useSessionHistory()
const { getSessionsByGroup } = useSessions()
const groupsStore = useGroupsStore()
const selectedGroup = computed(() => groupsStore.selectedGroup)
const groupId = computed(() => selectedGroup.value?.id)

// Verificar se o usuário atual é o dono do grupo
const isGroupOwner = computed(() => {
  return selectedGroup.value?.owner_id === user.value?.sub
})

// Filtros
const selectedSession = ref<{ label: string, value: string }>({ label: 'Todas as sessões', value: 'all' })

// Opções do select de sessões
const sessionOptions = computed(() => {
  const baseOptions = [{ label: 'Todas as sessões', value: 'all' }]

  if (!groupId.value) return baseOptions

  try {
    const sessions = getSessionsByGroup(groupId.value)
    if (!sessions || sessions.length === 0) return baseOptions

    const additionalOptions = sessions.map(session => ({
      label: session.name || 'Sessão sem nome',
      value: session.id
    }))

    return [...baseOptions, ...additionalOptions]
  } catch (error) {
    console.error('Error loading session options:', error)
    return baseOptions
  }
})

// Estado dos dados do histórico
const historyData = ref<Historic[]>([])

// Função para buscar histórico
const fetchHistory = async () => {
  if (!groupId.value) return

  try {
    // Determinar filtros baseado nas permissões
    const memberId = isGroupOwner.value ? undefined : user.value?.sub
    const sessionId = selectedSession.value.value === 'all' ? undefined : selectedSession.value.value

    const history = await fetchGroupHistory(groupId.value, memberId, sessionId)

    historyData.value = history.map(item => ({
      id: item.id,
      memberName: item.member_profile.username || item.member_profile.full_name || 'Usuário sem nome',
      sessionName: item.session?.name || 'Sessão desconhecida',
      action: item.action,
      description: item.action_description || '',
      score: item.score,
      date: item.created_at
    }))
  } catch (error) {
    toast.add({
      title: 'Erro ao buscar histórico',
      description: error instanceof Error ? error.message : 'Erro desconhecido',
      color: 'error',
      ui: {
        root: 'dark:bg-neutral-900'
      }
    })
  }
}

// Buscar dados ao montar e quando filtros mudarem
onMounted(async () => {
  // Aguardar um tick para garantir que as stores estão inicializadas
  await nextTick()
  await fetchHistory()
})

watch(selectedSession, async () => {
  await fetchHistory()
})

// Watch para reagir a mudanças no groupId
watch(groupId, async () => {
  if (groupId.value) {
    await fetchHistory()
  }
})

// Formatação de data
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

// Função para obter cor da ação
const getActionColor = (action: string) => {
  switch (action) {
    case 'checkin': return 'primary'
    default: return 'neutral'
  }
}

// Função para obter texto da ação
const getActionText = (action: string) => {
  switch (action) {
    case 'checkin': return 'Check-in'
    default: return action
  }
}

const columns: TableColumn<Historic>[] = [
  ...(isGroupOwner.value
    ? [{
        accessorKey: 'memberName' as keyof Historic,
        header: 'Membro'
      }]
    : []),
  {
    accessorKey: 'sessionName' as keyof Historic,
    header: 'Sessão'
  },
  {
    accessorKey: 'action' as keyof Historic,
    header: 'Ação',
    cell: ({ row }) => {
      const action = row.getValue('action')
      const actionText = getActionText(action as string)
      const actionColor = getActionColor(action as string)

      return h(UBadge, {
        class: 'capitalize rounded-2xl',
        variant: 'subtle',
        color: actionColor,
        label: actionText
      })
    }
  },
  {
    accessorKey: 'score' as keyof Historic,
    header: () => h('div', { class: 'text-right' }, 'Pontos'),
    cell: ({ row }) => {
      const score = Number.parseFloat(row.getValue('score'))
      return h('div', { class: 'text-right font-medium' }, `+${score}`)
    }
  },
  {
    accessorKey: 'date' as keyof Historic,
    header: 'Data',
    cell: ({ row }) => {
      return formatDate(row.getValue('date'))
    }
  }
]
</script>

<template>
  <div class="flex flex-col">
    <!-- Filtros -->
    <div class="flex justify-between items-center mb-4">
      <div>
        <p class="font-bold text-xl">
          Histórico
        </p>
        <p class="text-sm dark:text-gray-400">
          {{ isGroupOwner ? 'Histórico de atividades de todos os membros' : 'Seu histórico de atividades no grupo' }}
        </p>
      </div>
      <div class="flex gap-3">
        <USelectMenu
          v-model="selectedSession"
          :items="sessionOptions"
          searchable
          class="w-48"
          placeholder="Filtrar por sessão"
        />
      </div>
    </div>

    <!-- Tabela -->
    <UCard
      variant="subtle"
      class="flex-1 w-full rounded-2xl dark:bg-[#141414]"
    >
      <div v-if="loading" class="flex justify-center items-center py-8">
        <UIcon name="i-material-symbols-progress-activity" class="w-6 h-6 animate-spin mr-2" />
        <span>Carregando histórico...</span>
      </div>

      <div v-else-if="historyData.length === 0" class="flex justify-center items-center py-8">
        <div class="text-center">
          <UIcon name="i-material-symbols-history" class="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <p class="text-lg font-medium">
            Nenhum histórico encontrado
          </p>
          <p class="text-sm text-gray-500 mt-1">
            {{ selectedSession.value === 'all' ? 'Ainda não há atividades registradas.' : 'Nenhuma atividade na sessão selecionada.' }}
          </p>
        </div>
      </div>
      <UTable
        v-else
        :data="historyData"
        :columns="columns"
        class="flex-1"
      />
    </UCard>
  </div>
</template>
