# 🎯 desUnipresence
### disponível em: https://desunipresence.vercel.app/

> **Engenharia Reversa** de uma aplicação de controle de presença acadêmico, reimplementada com stack moderna

## 📖 Sobre o Projeto

**desUnipresence** é um projeto experimental que visa recriar as funcionalidades de uma aplicação de controle de presença estudantil (originalmente desenvolvida com React + Django) utilizando uma stack tecnológica completamente diferente e seguindo as melhores práticas de desenvolvimento moderno.

### 🎯 Objetivo

Demonstrar como diferentes tecnologias podem resolver os mesmos problemas, comparando:

- **Stack Original**: React + Django REST API + PostgreSQL
- **Stack Nova**: Nuxt 4 + Supabase + NuxtUI + Pinia + TypeScript

### ✨ Funcionalidades Principais

- 🔐 **Sistema de Autenticação** completo (registro, login, logout)
- 👥 **Gestão de Grupos** (criação, entrada via código, membros)
- 🏷️ **Sistema de Roles** (Owner, Admin, Member)
- 🎨 **Interface Moderna** com NuxtUI e design responsivo
- ⚡ **Real-time** com Supabase
- 📱 **PWA Ready** (Progressive Web App)

## 🛠️ Stack Tecnológica

### Frontend
- **[Nuxt 4](https://nuxt.com/)** - Framework Vue.js full-stack
- **[NuxtUI](https://ui.nuxt.com/)** - Biblioteca de componentes moderna
- **[Vue 3](https://vuejs.org/)** + **TypeScript** - Framework reativo
- **[Pinia](https://pinia.vuejs.org/)** - Gerenciamento de estado
- **[VueUse](https://vueuse.org/)** - Composables utilitários

### Backend & Database
- **[Supabase](https://supabase.com/)** - BaaS com PostgreSQL
- **Row Level Security (RLS)** - Segurança no nível de linha
- **Real-time subscriptions** - Atualizações em tempo real

### Ferramentas & DevX
- **[TypeScript](https://www.typescriptlang.org/)** - Tipagem estática
- **[ESLint](https://eslint.org/)** - Linting e formatação
- **[Pinia Persisted State](https://prazdevs.github.io/pinia-plugin-persistedstate/)** - Cache persistente
- **[Date-fns](https://date-fns.org/)** - Manipulação de datas
- **[Zod](https://zod.dev/)** - Validação de schemas

## 🏗️ Arquitetura

### Padrão de Camadas
```
📁 app/
├── 🎨 pages/          # Rotas e páginas
├── 🧩 components/     # Componentes reutilizáveis  
├── 🔄 composables/    # Lógica de negócio
├── 🏪 stores/         # Gerenciamento de estado
├── ⚙️ services/       # Comunicação com APIs
├── 🛡️ middleware/     # Interceptadores
├── 📋 layouts/        # Layouts da aplicação
└── 🔧 types/          # Definições TypeScript
```

### Fluxo de Dados
```
Page → Composable → Service → Supabase
  ↓        ↓           ↓
Store ← Cache ←─── Response
```

### Princípios Arquiteturais

1. **Single Source of Truth** - Estado centralizado com Pinia
2. **Separation of Concerns** - Cada camada tem responsabilidade específica  
3. **Reactive by Design** - Reatividade em todo fluxo de dados
4. **Type Safety First** - TypeScript em 100% do código
5. **Cache Inteligente** - Cache com invalidação automática

## 🚀 Setup do Projeto

### Pré-requisitos
- **Node.js** 18+ 
- **pnpm** (recomendado)
- **Conta Supabase**

### 1. Clonando o Repositório
```bash
git clone https://github.com/tiagobrilhante/desunipresence.git
cd desunipresence
```

### 2. Instalando Dependências
```bash
pnpm install
```

### 3. Configuração do Supabase

#### 3.1 Criar Projeto no Supabase
1. Acesse [supabase.com](https://supabase.com)
2. Crie um novo projeto
3. Anote a **URL** e **anon key**

#### 3.2 Configurar Variáveis de Ambiente
```bash
cp .env.example .env
```

Edite o `.env`:
```env
SUPABASE_URL=sua_url_aqui
SUPABASE_ANON_KEY=sua_chave_aqui
```

#### 3.3 Executar Migrations
```bash
# Conectar ao projeto Supabase
pnpm supabase:link

# Aplicar migrations
pnpm run:migrations

# Gerar tipos TypeScript
pnpm supabase:types
```

### 4. Desenvolvimento
```bash
pnpm dev
```

Acesse: **http://localhost:3000**

## 📜 Scripts Disponíveis

### Desenvolvimento
- `pnpm dev` - Servidor de desenvolvimento
- `pnpm build` - Build para produção
- `pnpm preview` - Preview da build

### Supabase
- `pnpm supabase:link` - Conectar ao projeto
- `pnpm run:migrations` - Aplicar migrations
- `pnpm supabase:types` - Gerar tipos TS
- `pnpm db:reset` - Reset do banco (dev)
- `pnpm db:migrate:new [nome]` - Nova migration

### Qualidade de Código
- `pnpm lint` - Verificar ESLint
- `pnpm type-check` - Verificar tipos TS

## 🗃️ Estrutura do Banco

### Tabelas Principais

#### `profiles`
- Perfis de usuários
- Relaciona com `auth.users` do Supabase

#### `groups` 
- Grupos/turmas criados
- Cada grupo tem um `owner_id`

#### `group_profile` (Many-to-Many)
- Relacionamento usuário ↔ grupo
- Define roles: `owner`, `admin`, `member`
- Permite auto-join via código

### Políticas RLS
- **Grupos**: Usuários veem grupos onde são membros
- **Profiles**: Públicos para membros dos mesmos grupos
- **Auto-join**: Usuários podem entrar em grupos via código

## 🎨 Design System

### Tokens de Design
- **Cores**: Sistema baseado em Tailwind CSS
- **Tipografia**: Inter (variável)
- **Espaçamento**: Sistema 4px base
- **Componentes**: NuxtUI como base

### Padrões de Interface
- **Layouts Responsivos** - Mobile-first
- **Dark/Light Mode** - Tema automático
- **Loading States** - Feedback visual consistente
- **Error Handling** - Mensagens user-friendly

## 🧪 Testes

```bash
# Executar testes unitários
pnpm test

# Testes E2E
pnpm test:e2e

# Coverage
pnpm test:coverage
```

## 📦 Deploy

### Vercel (Recomendado)
```bash
# Conectar ao Vercel
vercel

# Deploy automático via Git
git push origin main
```

### Variáveis de Ambiente (Produção)
```env
SUPABASE_URL=sua_url_producao
SUPABASE_ANON_KEY=sua_chave_producao
NUXT_PUBLIC_SITE_URL=https://seu-dominio.com
```

## 🤝 Contribuindo

1. Fork o projeto
2. Crie uma branch: `git checkout -b feature/nova-feature`
3. Commit: `git commit -m 'feat: adiciona nova feature'`
4. Push: `git push origin feature/nova-feature`
5. Abra um Pull Request

### Padrões de Commit
- `feat:` - Nova funcionalidade
- `fix:` - Correção de bug
- `docs:` - Documentação
- `style:` - Formatação
- `refactor:` - Refatoração
- `test:` - Testes

## 📄 Licença

Este projeto está sob a licença **MIT**. Veja o arquivo [LICENSE](LICENSE) para detalhes.

## 🙏 Agradecimentos

- **Equipe Nuxt** - Framework incrível
- **Supabase** - BaaS que funciona
- **NuxtUI** - Componentes lindos
- **Comunidade Vue.js** - Ecossistema fantástico

---

**Feito com ❤️ usando Nuxt 4 + Supabase**

> Este é um projeto educacional para demonstrar diferentes abordagens tecnológicas para resolver os mesmos problemas de negócio.