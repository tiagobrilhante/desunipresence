do
$$
begin
    if
not exists (select 1 from pg_type where typname = 'user_role') then
create type user_role as enum ('super_admin','admin', 'member', 'supervisor');
end if;
end
$$;

create table if not exists public.profiles
(
    id
    uuid
    references
    auth
    .
    users
    on
    delete
    cascade
    not
    null,
    created_at
    timestamptz
    default
    now
(
) not null,
    username text unique not null,
    full_name text not null,
    bio text default null,
    mode text default 'dark' not null,
    avatar_url text default null,
    organization_id uuid references organizations on delete set null,
    role user_role default 'member' not null,
    primary key
(
    id
)
    );


create index if not exists idx_profiles_organization_id
    on public.profiles (organization_id);

alter table public.profiles enable row level security;

create
policy "Users can insert their profile"
       on public.profiles for insert
       with check (auth.uid() = id);

     create
policy "Users can update own profile"
       on public.profiles for
update
    using (auth.uid() = id);

create
policy "Public profiles are readable by anyone"
on public.profiles
for
select
    to anon, authenticated
    using (true);