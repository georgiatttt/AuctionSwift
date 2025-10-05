-- Enable RLS
alter table public.organizations     enable row level security;
alter table public.profiles          enable row level security;
alter table public.items             enable row level security;
alter table public.item_images       enable row level security;
alter table public.comps             enable row level security;
alter table public.price_suggestions enable row level security;

-- PROFILES
drop policy if exists "profiles: read self"  on public.profiles;
drop policy if exists "profiles: insert self" on public.profiles;

create policy "profiles: read self"
on public.profiles for select to authenticated
using (id = auth.uid());

create policy "profiles: insert self"
on public.profiles for insert to authenticated
with check (id = auth.uid());

-- ORGANIZATIONS
drop policy if exists "orgs: member read" on public.organizations;

create policy "orgs: member read"
on public.organizations for select to authenticated
using (exists (
  select 1 from public.profiles p
  where p.id = auth.uid() and p.org_id = organizations.id
));

-- ITEMS
drop policy if exists "items: org read"   on public.items;
drop policy if exists "items: org insert" on public.items;
drop policy if exists "items: org update" on public.items;
drop policy if exists "items: org delete" on public.items;

create policy "items: org read"
on public.items for select to authenticated
using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.org_id = items.org_id));

create policy "items: org insert"
on public.items for insert to authenticated
with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.org_id = items.org_id));

create policy "items: org update"
on public.items for update to authenticated
using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.org_id = items.org_id))
with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.org_id = items.org_id));

create policy "items: org delete"
on public.items for delete to authenticated
using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.org_id = items.org_id));

-- ITEM_IMAGES
drop policy if exists "images: org read"   on public.item_images;
drop policy if exists "images: org insert" on public.item_images;
drop policy if exists "images: org update" on public.item_images;
drop policy if exists "images: org delete" on public.item_images;

create policy "images: org read"
on public.item_images for select to authenticated
using (exists (select 1 from public.items i join public.profiles p on p.id = auth.uid()
               where i.id = item_images.item_id and i.org_id = p.org_id));

create policy "images: org insert"
on public.item_images for insert to authenticated
with check (exists (select 1 from public.items i join public.profiles p on p.id = auth.uid()
               where i.id = item_images.item_id and i.org_id = p.org_id));

create policy "images: org update"
on public.item_images for update to authenticated
using (exists (select 1 from public.items i join public.profiles p on p.id = auth.uid()
               where i.id = item_images.item_id and i.org_id = p.org_id))
with check (exists (select 1 from public.items i join public.profiles p on p.id = auth.uid()
               where i.id = item_images.item_id and i.org_id = p.org_id));

create policy "images: org delete"
on public.item_images for delete to authenticated
using (exists (select 1 from public.items i join public.profiles p on p.id = auth.uid()
               where i.id = item_images.item_id and i.org_id = p.org_id));

-- COMPS
drop policy if exists "comps: org read"   on public.comps;
drop policy if exists "comps: org insert" on public.comps;
drop policy if exists "comps: org update" on public.comps;
drop policy if exists "comps: org delete" on public.comps;

create policy "comps: org read"
on public.comps for select to authenticated
using (exists (select 1 from public.items i join public.profiles p on p.id = auth.uid()
               where i.id = comps.item_id and i.org_id = p.org_id));

create policy "comps: org insert"
on public.comps for insert to authenticated
with check (exists (select 1 from public.items i join public.profiles p on p.id = auth.uid()
               where i.id = comps.item_id and i.org_id = p.org_id));

create policy "comps: org update"
on public.comps for update to authenticated
using (exists (select 1 from public.items i join public.profiles p on p.id = auth.uid()
               where i.id = comps.item_id and i.org_id = p.org_id))
with check (exists (select 1 from public.items i join public.profiles p on p.id = auth.uid()
               where i.id = comps.item_id and i.org_id = p.org_id));

create policy "comps: org delete"
on public.comps for delete to authenticated
using (exists (select 1 from public.items i join public.profiles p on p.id = auth.uid()
               where i.id = comps.item_id and i.org_id = p.org_id));

-- PRICE_SUGGESTIONS
drop policy if exists "prices: org read"   on public.price_suggestions;
drop policy if exists "prices: org insert" on public.price_suggestions;
drop policy if exists "prices: org update" on public.price_suggestions;
drop policy if exists "prices: org delete" on public.price_suggestions;

create policy "prices: org read"
on public.price_suggestions for select to authenticated
using (exists (select 1 from public.items i join public.profiles p on p.id = auth.uid()
               where i.id = price_suggestions.item_id and i.org_id = p.org_id));

create policy "prices: org insert"
on public.price_suggestions for insert to authenticated
with check (exists (select 1 from public.items i join public.profiles p on p.id = auth.uid()
               where i.id = price_suggestions.item_id and i.org_id = p.org_id));

create policy "prices: org update"
on public.price_suggestions for update to authenticated
using (exists (select 1 from public.items i join public.profiles p on p.id = auth.uid()
               where i.id = price_suggestions.item_id and i.org_id = p.org_id))
with check (exists (select 1 from public.items i join public.profiles p on p.id = auth.uid()
               where i.id = price_suggestions.item_id and i.org_id = p.org_id));

create policy "prices: org delete"
on public.price_suggestions for delete to authenticated
using (exists (select 1 from public.items i join public.profiles p on p.id = auth.uid()
               where i.id = price_suggestions.item_id and i.org_id = p.org_id));
