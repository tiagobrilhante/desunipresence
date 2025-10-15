<script setup lang="ts">
import * as z from 'zod'
import type { FormSubmitEvent, AuthFormField } from '@nuxt/ui'
import type { Provider } from '@supabase/supabase-js'

definePageMeta({
  layout: 'unauthenticated'
})

const toast = useToast()
const { login, loginWithProvider, loading } = useAuth()

const fields: AuthFormField[] = [{
  name: 'email',
  type: 'email',
  label: 'Email',
  placeholder: 'Insira o seu email',
  required: true
}, {
  name: 'password',
  label: 'Senha',
  type: 'password',
  placeholder: 'Insira sua senha',
  required: true
}]

const providers = [{
  label: 'GitHub',
  icon: 'i-mdi-github',
  onClick: () => handleProviderLogin('github')
}]

const schema = z.object({
  email: z.email('Email inválido'),
  password: z.string().min(8, 'A senha deve ter pelo menos 8 caracteres')
})

type Schema = z.output<typeof schema>

async function handleProviderLogin(provider: Provider) {
  if (loading.value) return

  const { error } = await loginWithProvider(provider)

  if (error) {
    toast.add({
      title: 'Não foi possível entrar',
      description: error.message,
      color: 'error',
      ui: {
        root: 'dark:bg-neutral-900'
      }
    })
  }
}

async function onSubmit(payload: FormSubmitEvent<Schema>) {
  const { error } = await login(payload.data)

  if (error) {
    toast.add({
      title: 'Credenciais inválidas',
      description: error.message,
      color: 'error',
      ui: {
        root: 'dark:bg-neutral-900'
      }
    })
    return
  }

  toast.add({
    title: 'Bem-vindo(a) de volta!',
    description: 'Login realizado com sucesso.',
    color: 'primary',
    ui: {
      root: 'dark:bg-neutral-900'
    }
  })

  await navigateTo('/home')
}
</script>

<template>
  <div class="flex flex-col items-center justify-center">
    <UPageCard class="w-300 max-w-lg rounded-2xl dark:bg-[#141414]">
      <UAuthForm
        :schema="schema"
        title="Entrar"
        separator="ou"
        description="Entre com suas credenciais para acessar sua conta"
        :fields="fields"
        :providers="providers"
        :submit="{
          label: 'Entrar',
          loading: loading
        }"
        :loading="loading"
        @submit="onSubmit"
      >
        <template #header>
          <div class="justify-center">
            <UAvatar class="bg-primary mb-5" size="xl">
              <UIcon
                class="text-black"
                name="i-lucide-users"
              />
            </UAvatar><br>
            <p class="text-2xl">
              <strong> Entrar</strong>
            </p><br>
            <p class="text-sm">
              Entre com suas credenciais para acessar sua conta
            </p>
          </div>
        </template>

        <template #footer>
          Não tem uma conta?<NuxtLink to="/register"><span class="text-green-300"> Criar conta </span></NuxtLink>
        </template>
      </UAuthForm>
    </UPageCard>
  </div>
</template>
