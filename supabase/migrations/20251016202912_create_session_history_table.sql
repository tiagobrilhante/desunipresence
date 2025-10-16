create table if not exists session_history (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now() not null,
  session_id uuid references sessions(id) on delete cascade not null,
  member_id uuid references profiles(id) on delete cascade not null,
  action text not null,
  action_description text,
  score integer default 0 not null,
  by_profile_id uuid references profiles(id) on delete cascade not null
);

create index if not exists session_history_session_id_idx on session_history(session_id);
create index if not exists session_history_member_id_idx on session_history(member_id);
create index if not exists session_history_by_profile_id_idx on session_history(by_profile_id);
create index if not exists session_history_created_at_idx on session_history(created_at);

-- Constraint para evitar múltiplos check-ins do mesmo usuário na mesma sessão
create unique index session_history_unique_checkin_idx 
on session_history(session_id, member_id) 
where action = 'checkin';

alter table session_history enable row level security;

create policy "members can see session history of their groups"
on session_history
for select
to authenticated
using (
  exists (
    select 1 from sessions s
    inner join group_profile gp on gp.group_id = s.group_id
    where s.id = session_history.session_id
    and gp.profile_id = auth.uid()
  )
);

create policy "members can checkin or admins can insert for anyone"
on session_history
for insert
to authenticated
with check (
  exists (
    select 1 from sessions s
    inner join group_profile gp on gp.group_id = s.group_id
    where s.id = session_history.session_id
    and gp.profile_id = auth.uid()
    and (
      -- Membro fazendo check-in para si mesmo
      (session_history.member_id = auth.uid() and session_history.by_profile_id = auth.uid())
      or
      -- Owners e admins podem fazer check-in para qualquer membro
      (gp.role in ('owner', 'admin'))
    )
  )
);

create policy "owners and admins can update session history"
on session_history
for update
to authenticated
using (
  exists (
    select 1 from sessions s
    inner join group_profile gp on gp.group_id = s.group_id
    where s.id = session_history.session_id
    and gp.profile_id = auth.uid()
    and gp.role in ('owner', 'admin')
  )
);

create policy "owners can delete session history"
on session_history
for delete
to authenticated
using (
  exists (
    select 1 from sessions s
    inner join group_profile gp on gp.group_id = s.group_id
    where s.id = session_history.session_id
    and gp.profile_id = auth.uid()
    and gp.role = 'owner'
  )
);