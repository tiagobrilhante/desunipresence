<script setup lang="ts">
import * as z from 'zod'
import type { FormSubmitEvent, SelectItem } from '@nuxt/ui'

// Composables
const { createSession, fetchSessionsByGroup, getSessionsByGroup, deleteSession, loading } = useSessions()
const groupsStore = useGroupsStore()
const toast = useToast()

// Pegar grupo selecionado da store
const selectedGroup = computed(() => groupsStore.selectedGroup)
const groupId = computed(() => selectedGroup.value?.id)

// Estado do modal e formulário
const open = ref(false)
const name = ref('')
const description = ref('')
const delay = ref(1)
const form = ref()
const submitting = ref(false)

// Estado do modal de confirmação de exclusão
const deleteModalOpen = ref(false)
const sessionToDelete = ref<{ id: string, name: string } | null>(null)
const deleting = ref(false)

// Schema de validação
const schema = z.object({
  name: z.string().min(1, 'Nome é obrigatório').max(100, 'Nome muito longo'),
  description: z.string().optional(),
  delay: z.number().min(1, 'Tolerância deve ser pelo menos 1 minuto').max(60, 'Tolerância máxima é 60 minutos')
})

type Schema = z.output<typeof schema>

// Buscar sessões ao montar o componente
const sessions = computed(() => {
  if (!groupId.value) return []
  return getSessionsByGroup(groupId.value)
})

const status_items = ref([
  {
    label: 'Pendente',
    value: 'pending',
    icon: 'i-lucide-clock',
    iconClass: 'text-orange-500'
  },
  {
    label: 'Aberto',
    value: 'open',
    icon: 'i-ri-door-open-line',
    iconClass: 'text-blue-500'
  },
  {
    label: 'Fechado',
    value: 'closed',
    icon: 'i-lucide-check',
    iconClass: 'text-green-400'
  }
] satisfies SelectItem[])

// Função para obter o ícone baseado no status
const getStatusIcon = (status: string) => {
  const item = status_items.value.find(item => item.value === status)
  return item?.icon || 'i-lucide-clock'
}

// Função para obter a classe de cor do ícone baseado no status
const getStatusIconClass = (status: string) => {
  const item = status_items.value.find(item => item.value === status)
  return item?.iconClass || 'text-yellow-500'
}

onMounted(async () => {
  if (groupId.value) {
    await fetchSessionsByGroup(groupId.value)
  }
})

// Reseta os valores do formulário sempre que o modal abrir
watch(open, (newValue) => {
  if (newValue) {
    name.value = ''
    description.value = ''
    delay.value = 1
  }
})

// Submissão do formulário
async function onSubmit(event: FormSubmitEvent<Schema>) {
  // Previne double-click
  if (submitting.value) return

  if (!groupId.value) {
    toast.add({
      title: 'Erro',
      description: 'Grupo não encontrado',
      color: 'error',
      ui: {
        root: 'dark:bg-neutral-900'
      }
    })
    return
  }

  try {
    submitting.value = true

    const sessionData = {
      name: event.data.name,
      description: event.data.description || null,
      delay: event.data.delay,
      group_id: groupId.value
    }

    const result = await createSession(sessionData)

    if (result) {
      toast.add({
        title: 'Sessão criada com sucesso!',
        description: `A sessão "${result.name}" foi criada.`,
        color: 'primary',
        ui: {
          root: 'dark:bg-neutral-900'
        }
      })

      // Fechar o modal
      open.value = false

      // Atualizar a lista de sessões
      await fetchSessionsByGroup(groupId.value, true)
    }
  } catch (error) {
    toast.add({
      title: 'Erro ao criar sessão',
      description: error instanceof Error ? error.message : 'Erro desconhecido',
      color: 'error',
      ui: {
        root: 'dark:bg-neutral-900'
      }
    })
  } finally {
    submitting.value = false
  }
}

// Funções utilitárias

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

// Função para obter o texto correto baseado no status
const getStatusActionText = (status: string) => {
  switch (status) {
    case 'open': return 'Início'
    case 'closed': return 'Fim'
    default: return 'Alterado'
  }
}

// Atualizar status da sessão sem invalidar cache
const updateSessionStatus = async (sessionId: string, newStatus: 'open' | 'pending' | 'closed') => {
  try {
    const currentSessions = sessions.value
    const currentSession = currentSessions.find(s => s.id === sessionId)

    if (!currentSession) {
      throw new Error('Sessão não encontrada')
    }

    // Atualiza diretamente via service sem usar o composable (para evitar invalidateCache)
    const supabase = useSupabaseClient()
    const { SessionService } = await import('@/services/sessions.service')
    const sessionService = new SessionService(supabase)

    const updatedSession = await sessionService.updateSession(sessionId, { status: newStatus })

    // Atualiza apenas esta sessão na store sem limpar o cache
    const sessionsStore = useSessionsStore()
    if (updatedSession) {
      sessionsStore.setSession(updatedSession)
    } else {
      // Fallback: atualiza localmente se API não retornar dados
      sessionsStore.setSession({
        ...currentSession,
        status: newStatus,
        status_changed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
    }

    const statusLabels = {
      open: 'aberta',
      pending: 'pendente',
      closed: 'fechada'
    }

    toast.add({
      title: 'Status atualizado!',
      description: `Sessão ${statusLabels[newStatus]} com sucesso.`,
      color: 'primary',
      ui: {
        root: 'dark:bg-neutral-900'
      }
    })
  } catch (error) {
    toast.add({
      title: 'Erro ao atualizar status',
      description: error instanceof Error ? error.message : 'Erro desconhecido',
      color: 'error',
      ui: {
        root: 'dark:bg-neutral-900'
      }
    })
  }
}

// Ações do dropdown
const getSessionActions = (session: { id: string, name: string }) => {
  return [[
    {
      label: 'Opções da sessão',
      type: 'label'
    }], [
    {
      label: 'Deletar Sessão',
      icon: 'i-material-symbols-delete',
      onSelect: () => confirmDeleteSession(session)
    }
  ]]
}

// Abrir modal de confirmação de exclusão
const confirmDeleteSession = (session: { id: string, name: string }) => {
  sessionToDelete.value = session
  deleteModalOpen.value = true
}

// Executar exclusão da sessão
const executeDeleteSession = async () => {
  if (!sessionToDelete.value) return

  try {
    deleting.value = true

    await deleteSession(sessionToDelete.value.id)

    toast.add({
      title: 'Sessão excluída!',
      description: `A sessão "${sessionToDelete.value.name}" foi excluída com sucesso.`,
      color: 'primary',
      ui: {
        root: 'dark:bg-neutral-900'
      }
    })

    // Fechar modal e limpar estado
    deleteModalOpen.value = false
    sessionToDelete.value = null

    // Refresh das sessões
    if (groupId.value) {
      await fetchSessionsByGroup(groupId.value, true)
    }
  } catch (error) {
    toast.add({
      title: 'Erro ao excluir sessão',
      description: error instanceof Error ? error.message : 'Erro desconhecido',
      color: 'error',
      ui: {
        root: 'dark:bg-neutral-900'
      }
    })
  } finally {
    deleting.value = false
  }
}

// Cancelar exclusão
const cancelDeleteSession = () => {
  deleteModalOpen.value = false
  sessionToDelete.value = null
}
</script>

<template>
  <div class="flex flex-col mb-4">
    <!-- NoContent apenas quando não há sessões e não está carregando -->
    <UCard
      v-if="!loading && sessions.length === 0"
      variant="subtle"
      class="flex-1 w-full rounded-2xl"
    >
      <template #default>
        <ui-no-content
          title="Nenhuma sessão encontrada"
          description="Ainda não há sessões cadastradas para esse grupo"
          button-icon="i-material-symbols-add-rounded"
          button-text="Nova Sessão"
          @button-click="open = true"
        />
      </template>
    </UCard>

    <!-- Lista de sessões -->
    <div v-if="loading || (sessions && sessions.length > 0)" class="mt-10">
      <div class=" flex justify-between">
        <div>
          <p class="font-bold text-xl">
            Sessões
          </p>
          <p class="text-sm dark:text-gray-400">
            Gerencie as sessões do grupo e acompanhe a participação dos membros
          </p>
        </div>
        <div>
          <UButton
            label="Nova Sessão"
            icon="i-material-symbols-add-rounded"
            class="px-4 py-2"
            @click="open = true"
          />
        </div>
      </div>
      <UCard
        v-for="session in sessions"
        :key="session?.id"
        variant="subtle"
        class="flex-1 mt-6 w-full rounded-2xl dark:bg-[#141414]"
      >
        <template #default>
          <div v-if="session" class="py-1">
            <!-- Loading state -->
            <div v-if="loading" class="flex justify-center items-center py-8">
              <UIcon name="i-material-symbols-progress-activity" class="w-6 h-6 animate-spin mr-2" />
              <span>Carregando sessões...</span>
            </div>

            <!-- Lista de sessões -->
            <div class="flex flex-1 items-center justify-between">
              <h3 class="font-semibold text-xl">
                {{ session.name }}
              </h3>
            </div>
            <div class="flex flex-1 items-center mt-1">
              <h4 class="font-semibold text-sm dark:text-gray-400">
                {{ session.description }}
              </h4>
            </div>
            <div class="flex flex-1 items-center mt-2 dark:text-gray-400">
              <div class="flex items-center gap-4 text-sm">
                <span class="flex items-center gap-1">
                  <UIcon name="i-material-symbols-schedule" />
                  {{ session.delay }} min tolerância
                </span>
                <span v-if="session.status_changed_at && session.status !=='pending'" class="flex items-center gap-1">
                  <UIcon name="i-material-symbols-calendar-today" />
                  {{ getStatusActionText(session.status) }}: {{ formatDate(session.status_changed_at) }}
                </span>
              </div>
            </div>

            <USeparator class="pt-4" />
            <div class="flex flex-1 items-center gap-3 justify-end mt-3">
              <USelect
                v-model="session.status"
                :items="status_items"
                option-attribute="label"
                value-attribute="value"
                class="w-48 status-select"
                @update:model-value="(newStatus: string) => updateSessionStatus(session.id, newStatus as 'open' | 'pending' | 'closed')"
              >
                <template #item="{ item }">
                  <div class="flex items-center gap-2">
                    <UIcon
                      :name="item.icon"
                      :class="item.iconClass"
                    />
                    <span>{{ item.label }}</span>
                  </div>
                </template>
                <template #leading>
                  <UIcon
                    :name="getStatusIcon(session.status)"
                    :class="getStatusIconClass(session.status)"
                  />
                </template>
              </USelect>
              <UButton icon="i-iconamoon-eye-light" variant="subtle" color="neutral" />
              <UDropdownMenu
                :items="getSessionActions(session)"
                :content="{
                  align: 'end',
                  side: 'bottom',
                  sideOffset: 8
                }"
                :ui="{
                  content: 'w-auto dark:bg-neutral-900'

                }"
              >
                <UButton
                  icon="i-material-symbols-more-vert"
                  variant="ghost"
                  color="neutral"
                  size="sm"
                />
              </UDropdownMenu>
            </div>
          </div>
        </template>
      </UCard>
    </div>
    <!-- Modal -->
    <UModal
      v-model:open="open"
      title="Criar Nova Sessão"
      description="Defina o título, descrição e a tolerância de atraso da sessão."
      :ui="{
        overlay: 'bg-stone-950/75',
        content: 'max-w-xl'
      }"
      class="py-0 my-0"
    >
      <template #body>
        <UForm
          ref="form"
          :schema="schema"
          :state="{ name, description, delay }"
          @submit="onSubmit"
        >
          <UFormField
            label="Título *"
            name="name"
            :ui="{ root: 'w-full', container: 'w-full' }"
          >
            <UInput
              v-model="name"
              :ui="{ root: 'w-full' }"
              class="py-0 my-0"
              placeholder="Ex: Reunião de alinhamento"
            />
          </UFormField>

          <UFormField
            class="mt-4"
            label="Descrição (Opcional)"
            name="description"
            :ui="{ root: 'w-full', container: 'w-full' }"
          >
            <UTextarea
              v-model="description"
              :ui="{ root: 'w-full' }"
              class="py-0 my-0"
              placeholder="Detalhes da sessão..."
            />
          </UFormField>

          <UFormField
            class="mt-4"
            label="Tolerância de atraso (min) *"
            name="delay"
            :ui="{ root: 'w-full', container: 'w-full' }"
          >
            <UInput
              v-model="delay"
              type="number"
              min="1"
              max="60"
              :ui="{ root: 'w-full' }"
              class="py-0 my-0"
            />
          </UFormField>
        </UForm>
      </template>
      <template
        #footer="{ close }"
      >
        <div class="flex items-center justify-end gap-3 w-full">
          <UButton
            variant="outline"
            color="neutral"
            label="Cancelar"
            class="px-5"
            @click="close"
          />
          <UButton
            class="px-5"
            label="Criar Sessão"
            :loading="submitting"
            :disabled="!name.trim() || delay < 1 || submitting"
            @click="form?.submit()"
          />
        </div>
      </template>
    </UModal>

    <!-- Modal de Confirmação de Exclusão -->
    <UModal
      v-model:open="deleteModalOpen"
      title="Confirmar Exclusão"
      :ui="{
        overlay: 'bg-stone-950/75',
        content: 'max-w-md'
      }"
    >
      <template #body>
        <div class="flex flex-col gap-4">
          <div class="flex items-center gap-3">
            <div class="flex-shrink-0">
              <UIcon
                name="i-material-symbols-warning"
                class="w-8 h-8 text-red-500"
              />
            </div>
            <div class="flex-1">
              <p class="text-gray-900 dark:text-gray-100 font-medium">
                Tem certeza que deseja excluir esta sessão?
              </p>
              <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
                A sessão "<strong>{{ sessionToDelete?.name }}</strong>" será excluída permanentemente. Esta ação não pode ser desfeita.
              </p>
            </div>
          </div>
        </div>
      </template>
      <template #footer>
        <div class="flex items-center justify-end gap-3 w-full">
          <UButton
            variant="outline"
            color="neutral"
            label="Cancelar"
            class="px-5"
            :disabled="deleting"
            @click="cancelDeleteSession"
          />
          <UButton
            color="error"
            label="Excluir Sessão"
            class="px-5"
            :loading="deleting"
            :disabled="deleting"
            @click="executeDeleteSession"
          />
        </div>
      </template>
    </UModal>
  </div>
</template>
