<script setup lang="ts">
definePageMeta({
  layout: 'authenticated'
})

const open = ref(false)
const user = useSupabaseUser()
const profilesStore = useProfilesStore()
const { fetchUserGroups } = useGroups()

// Buscar perfil do usuário atual
const { getMyProfile } = useProfile()
const currentProfile = computed(() => {
  return getMyProfile()
})

// Estado reativo para os memberships
type GroupMembership = {
  role: string
  joined_at: string
  groups: {
    id: string
    name: string
    description: string | null
    code: string
    owner_id: string
    created_at: string
  }
}

const myGroups = ref<GroupMembership[]>([])

onMounted(async () => {
  myGroups.value = await fetchUserGroups()
})
</script>

<template>
  <UContainer>
    <UPage>
      <UPageHeader
        description="Gerencie seus grupos e acompanhe seu progresso"
      >
        <template #title>
          <ClientOnly>
            <span>Olá, {{ currentProfile?.username || 'Usuário' }}!</span>
            <template #fallback>
              <span>Olá!</span>
            </template>
          </ClientOnly>
        </template>
        <div class="mt-6 flex items-center gap-2">
          <UButton icon="i-material-symbols-add-2-rounded" class="gap-3 py-2 px-4" to="/groups/create">
            Criar Grupo
          </UButton>
          <UModal
            v-model:open="open"
            title="Entrar em um Grupo"
            description="Digite o código de convite para entrar em um grupo"
            :ui="{
              overlay: 'bg-stone-950/75'
            }"
            class="py-0 my-0"
          >
            <UButton
              icon="i-solar-users-group-rounded-linear"
              color="neutral"
              class="gap-3 py-2 px-4"
              variant="outline"
            >
              <b>Entrar com Código</b>
            </UButton>

            <template #body>
              <UForm>
                <UFormField
                  label="Código do Grupo"
                  name="name"
                  :ui="{ root: 'w-full', container: 'w-full' }"
                >
                  <UInput :ui="{ root: 'w-full' }" class="py-0 my-0" placeholder="Digite o código do grupo" />
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
                  label="Entrar no Grupo"
                />
              </div>
            </template>
          </UModal>
        </div>
      </UPageHeader>

      <USeparator color="primary" />

      <UPageBody>
        <h2 class="h-2 text-xl">
          <strong>Meus Grupos</strong>
        </h2>

        <UPageColumns v-if="myGroups.length > 0" :columns="2" class="gap-4">
          <UCard
            v-for="membership in myGroups"
            :key="membership.groups.id"
            variant="soft"
            class="dark:bg-[#171717]"
          >
            <template #header>
              <div class="flex items-center justify-between mb-2">
                <span class="h-8 text-xl"><b>{{ membership.groups.name }}</b></span>
                <UBadge
                  v-if="membership.role === 'owner'"
                  color="secondary"
                  variant="solid"
                  class="rounded-2xl"
                  icon="i-material-symbols-light-crown-outline-rounded"
                  size="sm"
                  label="Líder"
                />
              </div>
              <span class="h-32 text-sm">{{ membership.groups.description }}</span>
            </template>

            <template #footer>
              <div class="flex items-center justify-between">
                <div>
                  <UIcon name="i-material-symbols-calendar-today-outline-rounded" size="small" class="mr-1" />
                  <span class="text-xs">{{
                    new Date(membership.groups.created_at).toLocaleDateString('pt-BR')
                  }}</span>
                </div>
                <UButton :to="`/groups/${membership.groups.id}`">
                  Acessar
                </UButton>
              </div>
            </template>
          </UCard>
        </UPageColumns>

        <ui-no-content v-else to="/groups/create" />
      </UPageBody>
    </UPage>
  </UContainer>
</template>
