<script lang="ts" setup>
const links = ref([
  {
    label: 'Criar Grupo',
    to: '/home',
    color: 'primary'
  }
])
</script>

<template>
  <UContainer class="text-center align-middle mt-6 pt-6">
    <UIcon name="i-lucide-users" class="mb-0" size="2.6em" />

    <p class="mt-2 font-bold">
      Nenhum grupo encontrado
    </p>
    <p class="my-0 text-sm text-muted">
      Crie o seu Primeiro grupo ou entre em um grupo existente para começar
    </p>
    <UButton
      label="Criar Grupo"
      to="/groups/create"
      class="mt-5 px-4 py-2"
      color="primary"
    />
  </UContainer>
</template>
