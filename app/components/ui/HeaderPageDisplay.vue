<script lang="ts" setup>
const props = defineProps<{
  title: string
  description?: string
  icon: string
}>()
</script>

<template>
  <UCard>
    <template #header>
      <div class="flex items-center align-middle gap-4">
        <div class="w-11 h-11 bg-green-500 rounded-lg flex items-center justify-center flex-shrink-0">
          <UIcon :name="props.icon" class="text-black" size="1.3rem" />
        </div>
        <div>
          <h2 class="text-2xl font-bold">
            {{ props.title }}
          </h2>
          <p class=" text-gray-400">
            {{ props.description }}
          </p>
        </div>
      </div>
    </template>
  </UCard>
</template>
