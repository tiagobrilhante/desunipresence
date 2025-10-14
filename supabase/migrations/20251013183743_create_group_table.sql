-- Criar tabela de grupos
create table if not exists groups (
                                      id uuid primary key default gen_random_uuid(),
    created_at timestamptz default now() not null,
    name text not null,
    description text default null,
    code text unique not null,
    owner_id uuid references profiles(id) on delete cascade not null
    );

-- Habilitar RLS
alter table groups enable row level security;

-- Política: usuários autenticados podem ver todos os grupos
create policy "authenticated can read groups"
on groups
for select
               to authenticated
               using (true);

-- Política: apenas o dono pode atualizar o grupo
create policy "owner can update group"
on groups
for update
               to authenticated
               using (auth.uid() = owner_id);

-- Política: apenas o dono pode deletar o grupo
create policy "owner can delete group"
on groups
for delete
to authenticated
using (auth.uid() = owner_id);

-- Política: usuários autenticados podem criar grupos
create policy "authenticated can create groups"
on groups
for insert
to authenticated
with check (auth.uid() = owner_id);

-- Criar índices para performance
create index if not exists groups_owner_id_idx on groups(owner_id);
create index if not exists groups_code_idx on groups(code);