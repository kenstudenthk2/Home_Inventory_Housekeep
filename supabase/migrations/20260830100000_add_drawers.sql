-- A named sub-container within a specific furniture instance (e.g. a
-- wardrobe's "襪褲格"). Free text, scoped to one furniture piece — unlike
-- furniture_types/categories this is not a shared global library.
create table drawers (
  id bigint generated always as identity primary key,
  furniture_id bigint not null references furniture (id) on delete cascade,
  name text not null check (length(trim(name)) > 0),
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);
create index drawers_furniture_id_idx on drawers (furniture_id);

-- Optional: an item may sit directly in a piece of furniture (unchanged
-- default) or, when that furniture has drawers, inside one specific drawer.
-- Application code enforces "required once the furniture has any drawers";
-- the column itself stays nullable so furniture without drawers is unaffected.
alter table items
  add column drawer_id bigint references drawers (id) on delete cascade;
create index items_drawer_id_idx on items (drawer_id);

alter table drawers enable row level security;
revoke all on drawers from anon, authenticated;
