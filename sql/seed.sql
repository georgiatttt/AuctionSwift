-- One org
insert into public.organizations (id, name) values
('00000000-0000-0000-0000-000000000001','Acme Auctions')
on conflict (id) do nothing;

-- Link your auth user to the org
insert into public.profiles (id, org_id, email, role)
values ('AUTH_USER_ID_HERE','00000000-0000-0000-0000-000000000001','ahmmedurrazee@gmail.com','admin')
on conflict (id) do nothing;

-- Two items
insert into public.items (id, org_id, title, brand, model, year, ai_description, status, created_by)
values
(gen_random_uuid(),'00000000-0000-0000-0000-000000000001','Canon AE-1 film camera','Canon','AE-1',1976,'Classic 35mm SLR. Works; clean cosmetics.','published','AUTH_USER_ID_HERE'),
(gen_random_uuid(),'00000000-0000-0000-0000-000000000001','Nikon F3 body','Nikon','F3',1980,'Pro 35mm SLR. Meter ok; minor brassing.','draft','AUTH_USER_ID_HERE');

-- One comp row for Canon
insert into public.comps (item_id, source, source_url, sold_price, sold_at, notes)
select id,'ebay','https://example.com/ae1-1',235.00,'2025-09-21','Good condition'
from public.items where model='AE-1' limit 1;

-- One stored suggestion
insert into public.price_suggestions (item_id, min_price, max_price, why)
select id,210,260,'Similar AE-1 sales last 90 days'
from public.items where model='AE-1' limit 1;
