<script setup lang="ts">
import { z } from 'zod'
import type { FormSubmitEvent } from '#ui/types'

definePageMeta({
  layout: 'authenticated'
})

// Composables e stores
const { createGroup, loading, error } = useGroups()
const toast = useToast()

// Schema de validação
const schema = z.object({
  name: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres').max(100, 'Nome muito longo'),
  description: z.string().max(400, 'Descrição muito longa').optional().or(z.literal(''))
})

type Schema = z.output<typeof schema>

// Estado do formulário
const state = reactive({
  name: '',
  description: ''
})

// Submit do formulário
const onSubmit = async (event: FormSubmitEvent<Schema>) => {
  try {
    const groupData = {
      name: event.data.name,
      description: event.data.description || null
    }

    const newGroup = await createGroup(groupData)

    if (newGroup) {
      toast.add({
        title: 'Grupo criado com sucesso!',
        description: `O grupo "${newGroup.name}" foi criado. Código: ${newGroup.code}`,
        color: 'green'
      })

      // Navegar para a página do grupo ou dashboard
      await navigateTo('/home')
    }
  } catch (err) {
    console.error('Error creating group:', err)
    toast.add({
      title: 'Erro ao criar grupo',
      description: err instanceof Error ? err.message : 'Ocorreu um erro inesperado',
      color: 'red'
    })
  }
}
</script>

<template>
  <UContainer>
    <UPage>
      <UPageBody>
        <UButton
          variant="link"
          color="neutral"
          icon="i-material-symbols-arrow-left-alt-rounded"
          class="mb-0"
          to="/home"
          label="Voltar ao Dashboard"
        />
        <ui-header-page-display title="Criar Novo Grupo" description="Configure seu grupo e defina atividades" icon="i-lucide-users" />

        <div class="flex items-center justify-center">
          <UForm
            :schema="schema"
            :state="state"
            class="w-full max-w-2xl"
            @submit="onSubmit"
          >
            <UCard
              class="w-full rounded-2xl dark:bg-[#141414]"
              variant="subtle"
              :ui="{ root: 'divide-y-0' }"
            >
              <template #header>
                <p class="h-2">
                  <b>Informações do Grupo</b>
                </p>
                <p class="mt-4 text-gray-400 text-sm">
                  Defina o nome e descrição do seu grupo. Você poderá editar essas informações depois.
                </p>
              </template>

              <template #default>
                <UFormField
                  label="Nome do Grupo *"
                  name="name"
                  :ui="{ root: 'w-full', container: 'w-full' }"
                  class="mt-0 mb-6"
                >
                  <UInput
                    v-model="state.name"
                    :ui="{ root: 'w-full' }"
                    placeholder="Ex: Equipe de Desenvolvimento"
                    :disabled="loading"
                  />
                </UFormField>

                <UFormField
                  label="Descrição (Opcional)"
                  name="description"
                  :ui="{ root: 'w-full', container: 'w-full' }"
                  class="my-3"
                >
                  <UTextarea
                    v-model="state.description"
                    :ui="{ root: 'w-full' }"
                    placeholder="Descreva o propósito do grupo e que tipo de atividades serão realizadas..."
                    :disabled="loading"
                  />
                </UFormField>

                <!-- Exibir erro se houver -->
                <UAlert
                  v-if="error"
                  icon="i-heroicons-exclamation-triangle"
                  color="red"
                  variant="subtle"
                  :title="error"
                  class="mt-4"
                />
              </template>

              <template #footer>
                <div class="flex items-center justify-end gap-3 w-full">
                  <UButton
                    variant="outline"
                    color="neutral"
                    to="/home"
                    size="lg"
                    label="Cancelar"
                    :disabled="loading"
                  />

                  <UButton
                    type="submit"
                    size="lg"
                    :loading="loading"
                    :disabled="loading"
                  >
                    {{ loading ? 'Criando...' : 'Criar Grupo' }}
                  </UButton>
                </div>
              </template>
            </UCard>
          </UForm>
        </div>
      </UPageBody>
    </UPage>
  </UContainer>
</template>
