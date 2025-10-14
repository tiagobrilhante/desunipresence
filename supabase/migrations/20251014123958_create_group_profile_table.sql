-- Criar tabela de relacionamento entre grupos e profiles (many-to-many)
create table if not exists group_profile (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now() not null,
  group_id uuid references groups(id) on delete cascade not null,
  profile_id uuid references profiles(id) on delete cascade not null,
  role text default 'member' not null check (role in ('owner', 'admin', 'member')),
  joined_at timestamptz default now() not null
);


alter table group_profile add constraint unique_group_profile unique (group_id, profile_id);

-- Habilitar RLS
alter table group_profile enable row level security;

-- Política simplificada: usuários autenticados podem ver membros de qualquer grupo
create policy "authenticated can see group members"
on group_profile
for select
to authenticated
using (true);


create policy "owners can manage members"
on group_profile
for all
to authenticated
using (
  exists (
    select 1 from groups g
    where g.id = group_profile.group_id
    and g.owner_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from groups g
    where g.id = group_profile.group_id
    and g.owner_id = auth.uid()
  )
);

-- Política simplificada: usuários podem se adicionar aos grupos
create policy "users can join groups"
on group_profile
for insert
to authenticated
with check (
  profile_id = auth.uid() and
  exists (select 1 from groups where id = group_profile.group_id)
);

create policy "users can leave groups"
on group_profile
for delete
to authenticated
using (profile_id = auth.uid());


create index if not exists group_profile_group_id_idx on group_profile(group_id);
create index if not exists group_profile_profile_id_idx on group_profile(profile_id);
create index if not exists group_profile_role_idx on group_profile(role);


create or replace function add_owner_as_member()
returns trigger as $$
begin
  insert into group_profile (group_id, profile_id, role, joined_at)
  values (NEW.id, NEW.owner_id, 'owner', NEW.created_at);
  return NEW;
end;
$$ language plpgsql;

create trigger add_owner_as_member_trigger
  after insert on groups
  for each row
  execute function add_owner_as_member();