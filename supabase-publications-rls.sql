-- Politique provisoire pour la phase de développement.
-- Elle autorise les utilisateurs authentifiés à gérer uniquement l'assemblée de Binche.
-- Elle sera remplacée ensuite par une politique basée sur assembly_access.

alter table public.publications enable row level security;

drop policy if exists "Authenticated users can read Binche publications" on public.publications;
drop policy if exists "Authenticated users can insert Binche publications" on public.publications;
drop policy if exists "Authenticated users can update Binche publications" on public.publications;
drop policy if exists "Authenticated users can delete Binche publications" on public.publications;

create policy "Authenticated users can read Binche publications"
on public.publications
for select
to authenticated
using (assembly_id = 'be7ab216-ae11-4e65-b523-d7b9d5221199'::uuid);

create policy "Authenticated users can insert Binche publications"
on public.publications
for insert
to authenticated
with check (assembly_id = 'be7ab216-ae11-4e65-b523-d7b9d5221199'::uuid);

create policy "Authenticated users can update Binche publications"
on public.publications
for update
to authenticated
using (assembly_id = 'be7ab216-ae11-4e65-b523-d7b9d5221199'::uuid)
with check (assembly_id = 'be7ab216-ae11-4e65-b523-d7b9d5221199'::uuid);

create policy "Authenticated users can delete Binche publications"
on public.publications
for delete
to authenticated
using (assembly_id = 'be7ab216-ae11-4e65-b523-d7b9d5221199'::uuid);
