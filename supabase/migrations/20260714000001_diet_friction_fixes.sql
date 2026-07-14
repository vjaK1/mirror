-- Friction fixes after real-world testing (2026-07-14).
-- 1) Missing foods: scrambled/fried eggs, blackberries (+ raspberries).
--    Scrambled egg and blackberries verified live against USDA FDC.
-- 2) Natural-unit portions: portion_name/portion_grams let the UI offer
--    "2 eggs" style counts; grams stay the stored source of truth.

alter table public.foods
  add column portion_name text,
  add column portion_grams numeric;

insert into public.foods
  (name, brand, source, kcal, protein_g, carbs_g, fat_g, fibre_g, sodium_mg, potassium_mg, iron_mg, calcium_mg, portion_name, portion_grams)
values
  ('Egg, scrambled', null, 'usda', 149, 9.99, 1.61, 11.0, 0, 145, 132, 1.31, 66, 'egg', 61),
  ('Egg, fried', null, 'usda', 196, 13.6, 0.83, 14.8, 0, 207, 152, 1.89, 62, 'egg', 46),
  ('Blackberries', null, 'usda', 43, 1.39, 9.61, 0.49, 5.3, 1, 162, 0.62, 29, null, null),
  ('Raspberries', null, 'usda', 52, 1.2, 11.9, 0.65, 6.5, 1, 151, 0.69, 25, null, null);

update public.foods set portion_name = 'egg', portion_grams = 50
  where name in ('Egg, whole, raw', 'Egg, whole, boiled') and user_id is null;
update public.foods set portion_name = 'egg white', portion_grams = 33
  where name = 'Egg white, raw' and user_id is null;
update public.foods set portion_name = 'slice', portion_grams = 40
  where name in ('Bread, white', 'Bread, wholemeal') and user_id is null;
update public.foods set portion_name = 'wrap', portion_grams = 45
  where name = 'Wrap, plain flour' and user_id is null;
update public.foods set portion_name = 'biscuit', portion_grams = 15
  where name = 'Weet-Bix' and user_id is null;
update public.foods set portion_name = 'cake', portion_grams = 9
  where name = 'Rice cakes' and user_id is null;
update public.foods set portion_name = 'scoop', portion_grams = 30
  where name = 'Whey protein powder' and user_id is null;
update public.foods set portion_name = 'bar', portion_grams = 60
  where name = 'Protein bar' and user_id is null;
update public.foods set portion_name = 'bar', portion_grams = 35
  where name = 'Muesli bar' and user_id is null;
update public.foods set portion_name = 'can', portion_grams = 95
  where name = 'Tuna, canned in springwater, drained' and user_id is null;
update public.foods set portion_name = 'banana', portion_grams = 120
  where name = 'Banana' and user_id is null;
