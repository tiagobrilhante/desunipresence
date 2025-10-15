<script setup lang="ts">
const open = ref(false)
const delay = ref(1)

// Reseta o valor do delay para 1 sempre que o modal abrir
watch(open, (newValue) => {
  if (newValue) {
    delay.value = 1
  }
})
</script>

<template>
  <div class="flex flex-col mb-4">
    <UCard
      variant="subtle"
      class="flex-1 w-full rounded-2xl "
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

    <UCard
      v-if="true"
      variant="subtle"
      class="flex-1 w-full rounded-2xl mt-6 dark:bg-[#141414]"
    >
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
            <UButton label="Nova Sessão" icon="i-material-symbols-add-rounded" class="px-4 py-2" />

            <template #body>
              <UForm>
                <UFormField
                  label="Título *"
                  name="name"
                  :ui="{ root: 'w-full', container: 'w-full' }"
                >
                  <UInput :ui="{ root: 'w-full' }" class="py-0 my-0" placeholder="Ex: Reunião de alinhamento" />
                </UFormField>

                <UFormField
                  class="mt-4"
                  label="Descrição (Opcional)"
                  name="description"
                  :ui="{ root: 'w-full', container: 'w-full' }"
                >
                  <UTextarea :ui="{ root: 'w-full' }" class="py-0 my-0" placeholder="Detalhes da sessão..." />
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
                />
              </div>
            </template>
          </UModal>
        </div>
      </div>
    </UCard>
  </div>
</template>
