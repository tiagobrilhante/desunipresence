<script lang="ts" setup>
const props = withDefaults(defineProps<{
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
  description: 'Crie o seu Primeiro grupo ou entre em um grupo existente para começar',
  buttonIcon: ''
})

const emit = defineEmits<{
  buttonClick: []
}>()

const handleButtonClick = () => {
  // Se não tem 'to' definido, emite evento para o componente pai
  if (!props.to) {
    emit('buttonClick')
  }
  // Se tem 'to', o UButton vai navegar automaticamente
}
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
      :to="to || undefined"
      :icon="buttonIcon"
      class="mt-5 px-4 py-2"
      color="primary"
      @click="handleButtonClick"
    />
  </UContainer>
</template>
