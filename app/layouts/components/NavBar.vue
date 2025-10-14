<script setup>
const colorMode = useColorMode()
const { logout } = useAuth()
const user = useSupabaseUser()
const profilesStore = useProfilesStore()

// Buscar perfil do usuário atual
const { getMyProfile } = useProfile()
const currentProfile = computed(() => {
  return getMyProfile()
})

const userInitials = computed(() => {
  if (currentProfile.value?.full_name) {
    const names = String(currentProfile.value.full_name).split(' ')
    const firstName = names[0] || ''
    return firstName.charAt(0).toUpperCase()
  }

  // Fallback para primeira letra do email
  if (user.value?.email) {
    return user.value.email.charAt(0).toUpperCase()
  }

  return 'U'
})

const userName = computed(() => {
  if (!currentProfile.value) return 'Usuário'
  return currentProfile.value.full_name || currentProfile.value.username || 'Usuário'
})

const userEmail = computed(() => {
  return user.value?.email || 'email@exemplo.com'
})
</script>

<template>
  <UHeader
    :toggle="false"
    class="border-b border-gray-200 dark:border-gray-800"
  >
    <template #left>
      <NuxtLink to="/" class="flex items-center gap-2">
        <NuxtImg src="d_300x300.png" class="size-10" />
        <span class="font-semibold text-lg">DesuniPresence</span>
      </NuxtLink>
    </template>

    <template #right>
      <ClientOnly>
        <UButton
          :icon="$colorMode.value === 'dark' ? 'i-heroicons-moon' : 'i-heroicons-sun'"
          color="neutral"
          square
          variant="outline"
          @click="$colorMode.preference = $colorMode.value === 'dark' ? 'light' : 'dark'"
        />
        <template #fallback>
          <UButton
            icon="i-heroicons-sun"
            color="neutral"
            square
            variant="outline"
          />
        </template>

        <div class="relative">
          <UDropdownMenu
            :ui="{
              content: colorMode.value === 'dark' ? 'bg-stone-900' : ''
            }"
            :items="[
              [{
                 type: 'label',
                 label: userName,
                 class: 'font-medium mb-0'
               },
               {
                 type: 'label',
                 label: userEmail,
                 class: 'text-xs text-gray-500 mt-0'
               }], [{
                label: 'Sair',
                icon: 'i-heroicons-arrow-right-on-rectangle',
                onSelect: async () => {

                  const result = await logout()
                  await navigateTo('/')
                }
              }]
            ]"
          >
            <UButton variant="ghost" class="p-1">
              <UAvatar
                :text="userInitials"
                size="sm"
                class="bg-primary"
                :ui="{
                  root: 'bg-primary',
                  fallback: 'text-black font-semibold'
                }"
              />
            </UButton>
          </UDropdownMenu>
        </div>
      </ClientOnly>
    </template>
  </UHeader>
</template>
