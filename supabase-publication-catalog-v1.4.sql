-- PubliService 1.4.0
-- Catalogue des noms de publications par assemblée.
-- Cette migration est non destructive : aucune publication, quantité,
-- distribution ou entrée d'historique existante n'est supprimée.

create extension if not exists pgcrypto;
create extension if not exists unaccent;

create table if not exists public.publication_catalog (
  id uuid primary key default gen_random_uuid(),
  assembly_id uuid not null references public.assemblies(id) on delete cascade,
  name text not null check (char_length(trim(name)) between 1 and 120),
  has_date boolean not null default true,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create unique index if not exists publication_catalog_assembly_name_unique
on public.publication_catalog (assembly_id, lower(trim(name)));

alter table public.publication_catalog enable row level security;

drop policy if exists "Publication catalog is readable" on public.publication_catalog;
create policy "Publication catalog is readable"
on public.publication_catalog
for select
using (true);

drop policy if exists "Administrators can create publication catalog entries"
on public.publication_catalog;
create policy "Administrators can create publication catalog entries"
on public.publication_catalog
for insert
to authenticated
with check (auth.uid() is not null);

drop policy if exists "Administrators can update publication catalog entries"
on public.publication_catalog;
create policy "Administrators can update publication catalog entries"
on public.publication_catalog
for update
to authenticated
using (auth.uid() is not null)
with check (auth.uid() is not null);

drop policy if exists "Administrators can delete publication catalog entries"
on public.publication_catalog;
create policy "Administrators can delete publication catalog entries"
on public.publication_catalog
for delete
to authenticated
using (auth.uid() is not null);

grant select on public.publication_catalog to anon, authenticated;
grant insert, update, delete on public.publication_catalog to authenticated;

-- Reprend les familles de publications existantes. Les périodiques connus
-- conservent leur date ; les autres deviennent des publications sans date.
insert into public.publication_catalog (
  assembly_id,
  name,
  has_date
)
select distinct on (p.assembly_id, lower(trim(
  case
    when p.name ~ '\s+-\s+[^-]+\s+-\s+[^-]+\s+-\s+[^-]+$'
      then regexp_replace(
        p.name,
        '\s+-\s+[^-]+\s+-\s+[^-]+\s+-\s+[^-]+$',
        ''
      )
    else p.name
  end
)))
  p.assembly_id,
  trim(
    case
      when p.name ~ '\s+-\s+[^-]+\s+-\s+[^-]+\s+-\s+[^-]+$'
        then regexp_replace(
          p.name,
          '\s+-\s+[^-]+\s+-\s+[^-]+\s+-\s+[^-]+$',
          ''
        )
      else p.name
    end
  ),
  (
    coalesce(p.publication_type, '') in ('workbook', 'watchtower')
    or lower(unaccent(p.name)) like '%cahier%'
    or lower(unaccent(p.name)) like '%tour de garde%'
  )
from public.publications p
where nullif(trim(p.name), '') is not null
on conflict do nothing;

-- Noms de base proposés dans chaque assemblée existante.
insert into public.publication_catalog (assembly_id, name, has_date)
select a.id, defaults.name, defaults.has_date
from public.assemblies a
cross join (
  values
    ('Cahier Vie et ministère', true),
    ('Tour de Garde d’étude', true),
    ('Tour de Garde publique', true),
    ('Réveillez-vous !', true)
) as defaults(name, has_date)
on conflict do nothing;
