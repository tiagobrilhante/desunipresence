# 🏗️ Arquitetura Padronizada - 3 Camadas

Este documento descreve a arquitetura padronizada em 3 camadas implementada na aplicação.

## 📋 Visão Geral

A aplicação segue um padrão arquitetural consistente com 3 camadas bem definidas:

```
┌─────────────────┐
│   COMPONENTS    │ ← Vue Components
└─────────────────┘
         ↓
┌─────────────────┐
│   COMPOSABLES   │ ← Lógica de Negócio
└─────────────────┘
         ↓
┌─────────────────┐
│    SERVICES     │ ← Acesso aos Dados
└─────────────────┘
         ↓
┌─────────────────┐
│     STORES      │ ← Estado Reativo
└─────────────────┘
```

## 🎯 Responsabilidades das Camadas

### 1. **Services** - Camada de Dados
- **Responsabilidade**: Acesso puro aos dados (Supabase)
- **Características**:
  - CRUD operations
  - Queries SQL
  - Transformação de dados
  - Tratamento de erros com `throwServiceError`
  - Uso do `authStore` para pegar user_id automaticamente

**Exemplo:**
```typescript
export class GroupService {
  constructor(private readonly supabase: SupabaseClient<Database>) {}

  async getGroups(userId?: string) {
    const currentUserId = userId || authStore.user?.id
    if (!currentUserId) throw new Error('User ID is required')
    
    const { data, error } = await this.supabase
      .from('groups')
      .select('*')
      .eq('profile_id', currentUserId)
    
    if (error) throwServiceError('GroupService.getGroups', error)
    return data
  }
}
```

### 2. **Composables** - Camada de Lógica de Negócio
- **Responsabilidade**: Orquestração entre Services e Stores
- **Características**:
  - Cache inteligente
  - Tratamento de erros
  - Validações de negócio
  - Gerenciamento de loading states
  - Funções de refresh/invalidação
  - Reutilização em components

**Exemplo:**
```typescript
export const useGroups = () => {
  const groupsStore = useGroupsStore()
  const groupService = new GroupService(useSupabaseClient())

  const fetchUserGroups = async (userId?: string) => {
    // Verifica cache primeiro
    if (!userId) {
      const cached = groupsStore.getUserGroups(authStore.user?.id)
      if (cached.length > 0) return cached
    }

    try {
      groupsStore.setLoading(true)
      const data = await groupService.getGroups(userId)
      if (data) groupsStore.setGroups(data)
      return data || []
    } catch (error) {
      groupsStore.setError(error.message)
      return []
    } finally {
      groupsStore.setLoading(false)
    }
  }

  return { fetchUserGroups, /* ... */ }
}
```

### 3. **Stores** - Camada de Estado
- **Responsabilidade**: Estado reativo puro
- **Características**:
  - Mutations simples (set, remove, clear)
  - Getters para acessar dados
  - Estado readonly para prevenir mutações diretas
  - Persistência local quando necessário
  - Sem lógica de negócio

**Exemplo:**
```typescript
export const useGroupsStore = defineStore('groups', () => {
  // State
  const items = ref<Record<string, Group>>({})
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Getters
  const getGroup = (id?: string | null) => {
    if (!id) return null
    return items.value[id] ?? null
  }

  // Mutations
  const setGroup = (group: Group) => {
    items.value[group.id] = group
  }

  return {
    items: readonly(items),
    loading: readonly(loading),
    error: readonly(error),
    getGroup,
    setGroup
  }
}, {
  persist: { pick: ['items'] }
})
```

## 📁 Estrutura de Arquivos

```
app/
├── services/           # Camada de Dados
│   ├── auth.service.ts
│   ├── groups.service.ts
│   ├── organization.service.ts
│   ├── profile.service.ts
│   └── me.service.ts
├── composables/        # Camada de Lógica
│   ├── useAuth.ts
│   ├── useGroups.ts
│   ├── useOrganizations.ts
│   └── useProfile.ts
└── stores/             # Camada de Estado
    ├── auth.ts
    ├── groups.ts
    ├── organizations.ts
    ├── profiles.ts
    └── preferences.ts
```

## 🛠️ Padrões Implementados

### Services
- ✅ Naming: `EntityService` (ex: `GroupService`)
- ✅ Constructor recebe `SupabaseClient`
- ✅ Usa `authStore` para user_id automático
- ✅ Error handling com `throwServiceError`
- ✅ Métodos CRUD completos
- ✅ Interfaces para CreateData/UpdateData

### Stores
- ✅ Naming: `useEntityStore` (ex: `useGroupsStore`)
- ✅ Estado readonly para prevenir mutações diretas
- ✅ Mutations simples: `setEntity`, `removeEntity`, `clearAll`
- ✅ Getters inteligentes: `getEntity`, `getEntityByX`
- ✅ Persistência com `persist: { pick: ['items'] }`

### Composables
- ✅ Naming: `useEntity` (ex: `useGroups`)
- ✅ Retorna actions, state readonly e getters
- ✅ Cache inteligente antes de fazer requests
- ✅ Loading/error states gerenciados na store
- ✅ Funções de refresh para invalidar cache

## 🎯 Entidades Implementadas

| Entidade | Service | Store | Composable | Status |
|----------|---------|-------|------------|--------|
| **Organizations** | ✅ | ✅ | ✅ | Completo |
| **Groups** | ✅ | ✅ | ✅ | Completo |
| **Profiles** | ✅ | ✅ | ✅ | Completo |
| **Auth** | ✅ | ✅ (AuthStore) | ✅ | Completo |
| **Me** | ✅ | - | - | Service Only |
| **Preferences** | - | ✅ | - | Store Only |

## 🚀 Como Usar nos Components

```vue
<script setup>
// 1. Import do composable
const { 
  fetchUserGroups, 
  createGroup, 
  loading, 
  error, 
  groups 
} = useGroups()

// 2. Buscar dados
onMounted(async () => {
  await fetchUserGroups()
})

// 3. Criar novo grupo
const handleCreateGroup = async (formData) => {
  try {
    await createGroup(formData)
    // Sucesso - dados atualizados automaticamente
  } catch (error) {
    // Error já está no state
    console.error('Erro:', error)
  }
}
</script>

<template>
  <div v-if="loading">Carregando...</div>
  <div v-else-if="error">Erro: {{ error }}</div>
  <div v-else>
    <div v-for="group in Object.values(groups)" :key="group.id">
      {{ group.name }}
    </div>
  </div>
</template>
```

## ✨ Benefícios da Arquitetura

1. **Separação de Responsabilidades** - Cada camada tem um papel específico
2. **Reutilização** - Composables podem ser usados em qualquer component
3. **Cache Inteligente** - Performance otimizada com cache automático
4. **Type Safety** - TypeScript robusto em todas as camadas
5. **Testabilidade** - Cada camada pode ser testada isoladamente
6. **Manutenibilidade** - Mudanças ficam isoladas na camada correta
7. **Consistência** - Padrão uniforme em toda aplicação
8. **Escalabilidade** - Fácil adicionar novas entidades seguindo o padrão

## 🔧 Utilitários

### Code Generator
```typescript
import { generateGroupCode } from '@/utils/codeGenerator'

// Gera códigos automáticos para grupos
const code = generateGroupCode() // "AB7C9D2E"
const codeWithTimestamp = generateGroupCode({ includeTimestamp: true })
```

### Service Logger
```typescript
import { throwServiceError } from '@/utils/serviceLogger'

// Tratamento consistente de erros
if (error) throwServiceError('ServiceName.methodName', error)
```

---

**Esta arquitetura garante código limpo, escalável e fácil de manter! 🎉**