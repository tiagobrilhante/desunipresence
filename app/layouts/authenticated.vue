<script setup lang="ts">
import NavBar from '~/layouts/components/NavBar.vue'

const toaster = {
  position: 'top-right' as const
}
</script>

<template>
  <UApp :toaster="toaster">
    <NavBar />
    <NuxtPage />
  </UApp>
</template>
