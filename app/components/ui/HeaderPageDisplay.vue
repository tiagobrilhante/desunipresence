<script lang="ts" setup>
const props = withDefaults(defineProps<{
  title: string
  description?: string | null
  icon: string
  size?: 'small' | 'big'
  badge?: boolean
  badgeText?: string
}>(), {
  size: 'small',
  badge: false,
  description: ''
})
</script>

<template>
  <div class="flex items-center align-middle gap-4">
    <div :class="size === 'big' ? 'w-14 h-14' : 'w-11 h-11'" class="bg-green-500 rounded-lg flex items-center justify-center flex-shrink-0">
      <UIcon :name="props.icon" class="text-black" :size="size === 'big' ? '1.7rem' : '1.3rem'" />
    </div>
    <div>
      <h2 :class="size === 'big' ? 'text-4xl' : 'text-2xl'" class="font-bold">
        {{ props.title }}    <UBadge
          v-if="badge"
          color="secondary"
          variant="solid"
          class="rounded-2xl"
          icon="i-material-symbols-light-crown-outline-rounded"
          :size="size === 'big' ? 'md' : 'sm'"
          :label="badgeText"
        />
      </h2>
      <p class=" text-gray-400">
        {{ props.description }}
      </p>
    </div>
  </div>
</template>
