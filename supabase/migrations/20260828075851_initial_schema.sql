-- Lookup: room types that drive default furniture suggestions.
create table room_types (
  id bigint generated always as identity primary key,
  key text not null unique,
  label text not null,
  sort_order int not null default 0
);

-- Shared global library of furniture types. Reusable across every room.
create table furniture_types (
  id bigint generated always as identity primary key,
  name text not null,
  icon_key text not null default 'box',
  created_at timestamptz not null default now()
);
create unique index furniture_types_name_lower_idx on furniture_types (lower(name));

-- Which furniture types are suggested when creating a room of a given type.
create table room_type_default_furniture (
  room_type_id bigint not null references room_types (id) on delete cascade,
  furniture_type_id bigint not null references furniture_types (id) on delete cascade,
  primary key (room_type_id, furniture_type_id)
);
create index room_type_default_furniture_furniture_type_id_idx
  on room_type_default_furniture (furniture_type_id);

-- Shared global library of item categories.
create table categories (
  id bigint generated always as identity primary key,
  name text not null,
  created_at timestamptz not null default now()
);
create unique index categories_name_lower_idx on categories (lower(name));

create table rooms (
  id bigint generated always as identity primary key,
  name text not null check (length(trim(name)) > 0),
  room_type_id bigint references room_types (id) on delete set null,
  width_cm numeric(8, 2) check (width_cm is null or width_cm > 0),
  length_cm numeric(8, 2) check (length_cm is null or length_cm > 0),
  created_at timestamptz not null default now()
);
create index rooms_room_type_id_idx on rooms (room_type_id);

-- A furniture instance placed in a specific room.
create table furniture (
  id bigint generated always as identity primary key,
  room_id bigint not null references rooms (id) on delete cascade,
  furniture_type_id bigint not null references furniture_types (id) on delete restrict,
  custom_name text check (custom_name is null or length(trim(custom_name)) > 0),
  created_at timestamptz not null default now()
);
create index furniture_room_id_idx on furniture (room_id);
create index furniture_furniture_type_id_idx on furniture (furniture_type_id);

create table items (
  id bigint generated always as identity primary key,
  furniture_id bigint not null references furniture (id) on delete cascade,
  category_id bigint references categories (id) on delete set null,
  name text not null check (length(trim(name)) > 0),
  quantity int not null default 1 check (quantity > 0),
  expiry_date date,
  created_at timestamptz not null default now()
);
create index items_furniture_id_idx on items (furniture_id);
create index items_category_id_idx on items (category_id);
-- Partial index: the expiry dashboard only ever queries rows that have a date.
create index items_expiry_date_idx on items (expiry_date) where expiry_date is not null;

-- Atomic find-or-create for the shared libraries. A check-then-insert in
-- application code would race; ON CONFLICT makes this a single statement.
-- `returns setof` (not a bare composite) so PostgREST answers with a JSON
-- array, which lets the client use .single() consistently.
create function find_or_create_furniture_type(p_name text, p_icon_key text default 'box')
returns setof furniture_types
language plpgsql
as $$
declare
  result furniture_types;
begin
  insert into furniture_types (name, icon_key)
  values (trim(p_name), coalesce(nullif(trim(p_icon_key), ''), 'box'))
  on conflict (lower(name)) do nothing
  returning * into result;

  if result.id is null then
    select * into result from furniture_types where lower(name) = lower(trim(p_name));
  end if;

  return next result;
end;
$$;

create function find_or_create_category(p_name text)
returns setof categories
language plpgsql
as $$
declare
  result categories;
begin
  insert into categories (name)
  values (trim(p_name))
  on conflict (lower(name)) do nothing
  returning * into result;

  if result.id is null then
    select * into result from categories where lower(name) = lower(trim(p_name));
  end if;

  return next result;
end;
$$;

-- v1 has no login. Enable RLS with no policies and grant nothing to the
-- public roles, so the Data API cannot reach these tables at all. All access
-- goes through the server-side secret key, which bypasses RLS.
alter table room_types enable row level security;
alter table furniture_types enable row level security;
alter table room_type_default_furniture enable row level security;
alter table categories enable row level security;
alter table rooms enable row level security;
alter table furniture enable row level security;
alter table items enable row level security;

revoke all on all tables in schema public from anon, authenticated;
revoke all on all functions in schema public from anon, authenticated;

-- The revokes above only cover objects that exist right now. This also closes
-- anything a later migration adds, so a new table is never accidentally public.
alter default privileges in schema public revoke all on tables from anon, authenticated;
alter default privileges in schema public revoke all on functions from anon, authenticated;
