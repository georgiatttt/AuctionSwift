create or replace view public.item_summary as
select 
  i.id,
  i.title,
  i.brand,
  i.model,
  i.status,
  i.start_price,
  i.reserve_price,
  i.hammer_price,
  (
    select json_agg(row_to_json(c)) 
    from (
      select source, source_url, sold_price, sold_at, notes
      from public.comps 
      where item_id = i.id
      order by sold_at desc nulls last
    ) c
  ) as comps,
  (
    select row_to_json(s)
    from (
      select min_price, max_price, method, why, created_at
      from public.price_suggestions 
      where item_id = i.id
      order by created_at desc
      limit 1
    ) s
  ) as latest_suggestion
from public.items i;
