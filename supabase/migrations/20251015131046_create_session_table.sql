do
$$
begin
    if
not exists (select 1 from pg_type where typname = 'status') then
create type status as enum ('open','pending', 'closed');
end if;
end
$$;

-- Criar tabela de sessões
create table if not exists sessions
(
    id
    uuid
    primary
    key
    default
    gen_random_uuid
(
),
    created_at timestamptz default now
(
) not null,
    updated_at timestamptz default now
(
) not null,
    name text not null,
    description text default null,
    delay integer not null check
(
    delay >
    0
),
    status status default 'pending' not null,
    status_changed_at timestamptz default null,
    group_id uuid references groups
(
    id
) on delete cascade not null
    );

-- Habilitar RLS
alter table sessions enable row level security;

-- Política: usuários podem ver sessões apenas se pertencerem ao grupo
create
policy "members can read sessions"
on sessions
for
select
    to authenticated
    using (
    exists (
    select 1 from group_profile gp
    where gp.group_id = sessions.group_id
    and gp.profile_id = auth.uid()
    )
    );

-- Política: apenas donos do grupo podem criar sessões
create
policy "owners can create sessions"
on sessions
for insert
to authenticated
with check (
  exists (
    select 1 from groups g
    where g.id = sessions.group_id
    and g.owner_id = auth.uid()
  )
);

-- Política: apenas donos do grupo podem atualizar sessões
create
policy "owners can update sessions"
on sessions
for
update
    to authenticated
    using (
    exists (
    select 1 from groups g
    where g.id = sessions.group_id
    and g.owner_id = auth.uid()
    )
    )
with check (
    exists (
    select 1 from groups g
    where g.id = sessions.group_id
    and g.owner_id = auth.uid()
    )
    );

-- Política: apenas donos do grupo podem deletar sessões
create
policy "owners can delete sessions"
on sessions
for delete
to authenticated
using (
  exists (
    select 1 from groups g
    where g.id = sessions.group_id
    and g.owner_id = auth.uid()
  )
);

-- Criar índices para performance
create index if not exists sessions_group_id_idx on sessions(group_id);
create index if not exists sessions_created_at_idx on sessions(created_at);
create index if not exists sessions_status_idx on sessions(status);
create index if not exists sessions_status_changed_at_idx on sessions(status_changed_at);

-- Trigger para atualizar updated_at
create
or replace function update_updated_at_column()
returns trigger as $$
begin
  NEW.updated_at
= now();
return NEW;
end;
$$
language plpgsql;

create trigger update_sessions_updated_at
    before update
    on sessions
    for each row
    execute function update_updated_at_column();

-- Trigger para capturar timestamp quando status mudar
create or replace function update_status_changed_at()
returns trigger as $$
begin
  -- Se o status mudou, atualiza o timestamp
  if OLD.status != NEW.status then
    NEW.status_changed_at = now();
  end if;
  return NEW;
end;
$$ language plpgsql;

create trigger update_sessions_status_changed_at
    before update
    on sessions
    for each row
    execute function update_status_changed_at();