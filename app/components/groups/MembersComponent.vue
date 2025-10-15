<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import type { Row } from '@tanstack/vue-table'
import { useClipboard } from '@vueuse/core'

const UButton = resolveComponent('UButton')
const UBadge = resolveComponent('UBadge')
const UDropdownMenu = resolveComponent('UDropdownMenu')

const toast = useToast()
const { copy } = useClipboard()

type Members = {
  id: string
  name: string
  date: string
  owner: boolean
  score: number
}

const data = ref<Members[]>([
  {
    id: '4600',
    name: 'Joaquim Soares',
    date: '2024-03-11T15:30:00',
    owner: true,
    score: 594
  }
])

const columns: TableColumn<Members>[] = [
  {
    accessorKey: 'name',
    header: 'Nome'
  },
  {
    accessorKey: 'date',
    header: 'Data de ingresso',
    cell: ({ row }) => {
      return new Date(row.getValue('date')).toLocaleString('en-US', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      })
    }
  },
  {
    accessorKey: 'owner',
    header: 'Tipo',
    cell: ({ row }) => {
      // 1. Pega o valor booleano da linha (true ou false)
      const isOwner = row.getValue('owner')

      // 2. Define o texto e a cor com base no valor
      const label = isOwner ? 'Líder' : 'Membro'
      const icon = isOwner ? 'i-material-symbols-light-crown-outline-rounded' : ''
      const color = isOwner ? 'secondary' : 'primary'

      // 3. Renderiza o UBadge com as propriedades dinâmicas
      return h(UBadge, {
        class: 'capitalize rounded-2xl',
        variant: 'subtle',
        icon, // Passa o ícone definido
        color, // Passa a cor definida
        label // Passa o texto definido
      })
    }
  },
  {
    accessorKey: 'score',
    header: () => h('div', { class: 'text-right' }, 'Pontos'),
    cell: ({ row }) => {
      const score = Number.parseFloat(row.getValue('score'))

      return h('div', { class: 'text-right font-medium' }, score)
    }
  },
  {
    id: 'actions',
    cell: ({ row }) => {
      return h(
        'div',
        { class: 'text-right' },
        h(
          UDropdownMenu,
          {
            'content': {
              align: 'end'
            },
            'items': getRowItems(row),
            'aria-label': 'Actions dropdown'
          },
          () =>
            h(UButton, {
              'icon': 'i-lucide-ellipsis-vertical',
              'color': 'neutral',
              'variant': 'ghost',
              'class': 'ml-auto',
              'aria-label': 'Actions dropdown'
            })
        )
      )
    }
  }
]

function getRowItems(row: Row<Members>) {
  return [
    {
      type: 'label',
      label: 'Opções do membro'
    },
    {
      type: 'separator'
    },
    {
      label: 'Ajustar Pontos',
      icon: 'i-material-symbols-sports-score',
      color: 'secondary'
    },
    {
      label: 'Expulsar Membro',
      icon: 'i-lucide-ban',
      color: 'error'
    }
  ]
}
</script>

<template>
  <UCard
    variant="subtle"
    class="flex-1 mt-6 w-full rounded-2xl dark:bg-[#141414]"
  >
    membros
    <UTable :data="data" :columns="columns" class="flex-1" />
  </UCard>
</template>
