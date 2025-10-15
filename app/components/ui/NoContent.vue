<script lang="ts" setup>
withDefaults(defineProps<{
  title?: string
  description?: string | null
  icon?: string
  size?: 'small' | 'big'
  button?: boolean
  buttonText?: string
  to?: string
  buttonIcon?: string
}>(), {
  title: 'Nenhum grupo encontrado',
  icon: 'i-lucide-users',
  size: 'small',
  button: true,
  buttonText: 'Criar Grupo',
  to: '/groups/create',
  description: 'Crie o seu Primeiro grupo ou entre em um grupo existente para começar',
  buttonIcon: ''
})
</script>

<template>
  <UContainer class="text-center align-middle mt-6 pt-6">
    <UIcon :name="icon" class="mb-0" size="2.6em" />

    <p class="mt-2 font-bold">
      {{ title }}
    </p>
    <p class="my-0 text-sm text-muted">
      {{ description }}
    </p>
    <UButton
      v-if="button"
      :label="buttonText"
      :to
      :icon="buttonIcon"
      class="mt-5 px-4 py-2"
      color="primary"
    />
  </UContainer>
</template>
