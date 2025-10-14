create table if not exists organizations
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
    name text unique not null,
    bio text default null,
    address_cep text default null,
    address_street text default null,
    address_number text default null,
    address_complement text default null,
    address_neighborhood text default null,
    address_city text default null,
    address_state text default null,
    logo_url text default null,
    logo_path text default null
    );


alter table organizations enable row level security;

create policy "public can read organizations"
on public.organizations
for select to anon
               using (true);