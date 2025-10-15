<script setup lang="ts">
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
        />
      </template>
    </UCard>

    <UCard
      v-if="false"
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
          <UButton label="Nova Sessão" icon="i-material-symbols-add-rounded" class="px-4 py-2" />
        </div>
      </div>
    </UCard>
  </div>
</template>
