<script setup lang="ts">
// Importar tipo do grupo
import type { Database } from '~/types/database.types'

definePageMeta({
  layout: 'authenticated'
})

const route = useRoute()
const groupsStore = useGroupsStore()
const { fetchGroup, fetchMemberCount } = useGroups()
const toast = useToast()

// Pegar o ID da URL
const groupId = route.params.id as string

type Group = Database['public']['Tables']['groups']['Row']

// Buscar dados do grupo
const group = ref<Group | null>(null)
const memberCount = ref(0)
const loading = ref(true)
const checkBadge = ref(false)
const showCode = ref(false)
const copied = ref(false)
const activeTab = ref('secao')

const { myProfile } = useProfile()

const handleTabClick = (tab: string, event: Event) => {
  activeTab.value = tab
  const target = event.target as HTMLElement
  target.focus()
}

// Função para copiar código
const copyCode = async () => {
  copied.value = true

  if (group.value?.code) {
    try {
      await navigator.clipboard.writeText(group.value.code)
      console.log('Código copiado!')

      toast.add({
        title: 'Código copiado!',
        icon: 'i-lucide-check',
        ui: {
          root: 'dark:bg-neutral-900'
        }
      })

      setTimeout(() => {
        copied.value = false
      }, 5000)
    } catch (error) {
      console.error('Erro ao copiar código:', error)
    }
  }
}

// Toggle da visibilidade do código
const toggleCodeVisibility = () => {
  showCode.value = !showCode.value
}

const items = ref([
  [
    {
      label: 'Configurações do Grupo',
      type: 'label'
    }
  ],
  [
    {
      label: 'Excluir Grupo',
      icon: 'i-lucide-trash'
    }
  ]

])

onMounted(async () => {
  try {
    // Buscar grupo do servidor
    const groupData = await fetchGroup(groupId)

    if (groupData && myProfile) {
      group.value = groupData
      // Salvar como selectedGroup na store
      groupsStore.setSelectedGroup(groupData)

      if (group.value.owner_id === myProfile?.id) {
        checkBadge.value = true
      }

      // Buscar contagem de membros
      memberCount.value = await fetchMemberCount(groupId)
    } else {
      // Grupo não encontrado - lança erro FORA do try/catch
      loading.value = false
      return createError({
        statusCode: 404,
        statusMessage: 'Grupo não encontrado'
      })
    }
  } catch (error) {
    console.error('Erro ao carregar grupo:', error)
    loading.value = false
  }

  loading.value = false
})
</script>

<template>
  <UContainer>
    <UPage>
      <UPageBody>
        <!-- Loading state -->
        <div v-if="loading" class="flex justify-center items-center h-64">
          <UIcon name="i-material-symbols-progress-activity" class="w-8 h-8 animate-spin" />
          <span class="ml-2">Carregando grupo...</span>
        </div>

        <!-- Group details -->
        <div v-else-if="group">
          <div class="flex items-center justify-between w-full">
            <ui-header-page-display
              size="big"
              :title="group.name"
              :description="group.description"
              icon="i-lucide-users"
              :badge="checkBadge"
              badge-text="Líder"
            />

            <UTooltip
              arrow
              :delay-duration="0"
              text="Configurações do Grupo"
              :content="{
                align: 'center',
                side: 'top'
              }"
              :ui="{
                content: 'bg-primary text-black rounded-xl p-4',
                arrow: 'fill-green-400'
              }"
            >
              <UDropdownMenu
                :items="items"
                :content="{
                  align: 'end',
                  side: 'bottom',
                  sideOffset: 8
                }"
                :ui="{
                  content: 'w-48 dark:bg-neutral-900'

                }"
              >
                <UButton
                  variant="subtle"
                  color="neutral"
                  icon="i-bx-dots-vertical-rounded"
                  size="lg"
                />
              </UDropdownMenu>
            </UTooltip>
          </div>

          <!-- Group info cards -->
          <div class="grid grid-cols-1 md:grid-cols-1 gap-6 mt-4">
            <UCard class="border-1 py-4 dark:border-gray-800 light:border-gray-100">
              <template #default>
                <div class="space-y-3 align-middle content-center">
                  <div class="flex justify-between">
                    <div>
                      <label class="text-sm font-bold dark:text-white">Código de Convite</label>
                      <div class="flex items-center gap-2 mt-1">
                        <UInput
                          :value="group.code"
                          :type="showCode ? 'text' : 'password'"
                          readonly
                          class="font-mono"
                        />
                        <UButton
                          :icon="copied ? 'i-material-symbols-check' : 'i-material-symbols-content-copy-outline'"
                          size="sm"
                          color="neutral"
                          variant="link"
                          title="Copiar código"
                          @click="copyCode"
                        />
                        <UButton
                          :icon="showCode ? 'i-material-symbols-visibility-off' : 'i-material-symbols-visibility'"
                          size="sm"
                          color="neutral"
                          variant="outline"
                          :title="showCode ? 'Ocultar código' : 'Mostrar código'"
                          @click="toggleCodeVisibility"
                        />
                      </div>
                    </div>
                    <div class="align-middle content-center">
                      <div class="flex justify-between gap-3">
                        <div class="text-right text-sm">
                          <span class="text-gray-600 dark:text-gray-400">
                            {{ memberCount }} {{ memberCount === 1 ? 'membro' : 'membros' }}
                          </span>
                          <p class="mt-1">
                            Criado em: {{ new Date(group.created_at).toLocaleDateString('pt-BR') }}
                          </p>
                        </div>
                        <div class="align-middle content-center">
                          <UButton
                            label="Ver Ranking"
                            icon="i-lucide-users"
                            class="px-4 py-2"
                            color="primary"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </template>
            </UCard>
          </div>

          <div class="flex mt-8 w-full">
            <UButton
              color="neutral"
              variant="subtle"
              label="Seção"
              :class="[
                'flex-1 rounded-r-none justify-center',
                activeTab === 'secao' ? 'bg-neutral-200 dark:bg-neutral-700 text-neutral-900 dark:text-white' : ''
              ]"
              @click="handleTabClick('secao', $event)"
            />
            <UButton
              color="neutral"
              variant="subtle"
              label="Membros"
              :class="[
                'flex-1 rounded-none border-l-0 justify-center',
                activeTab === 'membros' ? 'bg-neutral-200 dark:bg-neutral-700 text-neutral-900 dark:text-white' : ''
              ]"
              @click="handleTabClick('membros', $event)"
            />
            <UButton
              color="neutral"
              variant="subtle"
              label="Histórico"
              :class="[
                'flex-1 rounded-l-none border-l-0 justify-center',
                activeTab === 'historico' ? 'bg-neutral-200 dark:bg-neutral-700 text-neutral-900 dark:text-white' : ''
              ]"
              @click="handleTabClick('historico', $event)"
            />
          </div>

          <div class="mt-1 w-full h-96">
            <groups-session-component v-if="activeTab === 'secao'" />
            <groups-members-component v-if="activeTab === 'membros'" />
            <groups-historic-component v-if="activeTab === 'historico'" />
          </div>
        </div>
      </UPageBody>
    </UPage>
  </UContainer>
</template>
