<script setup lang="ts">
import * as z from 'zod'
import type { FormSubmitEvent, AuthFormField } from '@nuxt/ui'
import type { Provider } from '@supabase/supabase-js'

definePageMeta({
  layout: 'unauthenticated'
})

const toast = useToast()
const { register, loginWithProvider, loading } = useAuth()

const fields: AuthFormField[] = [{
  name: 'firstName',
  type: 'text',
  label: 'Nome',
  placeholder: 'Insira seu nome',
  required: true
}, {
  name: 'lastName',
  type: 'text',
  label: 'Sobrenome',
  placeholder: 'Insira seu sobrenome',
  required: true
}, {
  name: 'username',
  type: 'text',
  label: 'Nome de usuário',
  placeholder: 'Insira seu nome de usuário',
  required: true
}, {
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
  firstName: z.string().min(1, 'Nome é obrigatório'),
  lastName: z.string().min(1, 'Sobrenome é obrigatório'),
  username: z.string().min(3, 'Nome de usuário deve ter pelo menos 3 caracteres'),
  email: z.string().email('Email inválido'),
  password: z.string().min(8, 'A senha deve ter pelo menos 8 caracteres'),
  bio: z.string().optional(),
  avatarUrl: z.string().url().optional().or(z.literal(''))
})

type Schema = z.output<typeof schema>

async function handleProviderLogin(provider: Provider) {
  if (loading.value) return

  const { error } = await loginWithProvider(provider)

  if (error) {
    toast.add({
      title: 'Não foi possível criar conta',
      description: error.message,
      color: 'red'
    })
  }
}

async function onSubmit(payload: FormSubmitEvent<Schema>) {
  const { error } = await register(payload.data)

  if (error) {
    toast.add({
      title: 'Erro ao criar conta',
      description: error.message,
      color: 'red'
    })
    return
  }

  toast.add({
    title: 'Conta criada com sucesso!',
    description: 'Bem-vindo ao sistema.',
    color: 'green'
  })

  await navigateTo('/home')
}
</script>

<template>
  <div class="flex flex-col items-center justify-center">
    <UPageCard class="w-300 max-w-lg rounded-2xl dark:bg-[#141414]">
      <UAuthForm
        :schema="schema"
        title="Criar Conta"
        separator="ou"
        description="Crie sua conta para acessar o sistema"
        :fields="fields"
        :providers="providers"
        :submit="{
          label: 'Criar Conta',
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
                name="i-lucide-user-plus"
              />
            </UAvatar><br>
            <p class="text-2xl">
              <strong>Criar Conta</strong>
            </p><br>
            <p class="text-sm">
              Crie sua conta para acessar o sistema
            </p>
          </div>
        </template>

        <template #footer>
          Já tem uma conta?<NuxtLink to="/"><span class="text-green-300"> Entrar </span></NuxtLink>
        </template>
      </UAuthForm>
    </UPageCard>
  </div>
</template>