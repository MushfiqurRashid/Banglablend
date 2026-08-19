-- Premium recipe publishing fields, structured ingredient/method sections, and image storage.

alter table public.recipes
  add column bangla_title text,
  add column story text,
  add column category text,
  add column cuisine text not null default 'Bangladeshi',
  add column total_minutes int check (total_minutes >= 0),
  add column inactive_minutes int check (inactive_minutes >= 0),
  add column yield_text text,
  add column image_wide jsonb,
  add column image_square jsonb,
  add column image_credit text,
  add column serving_suggestions text[] not null default '{}',
  add column tips text[] not null default '{}',
  add column storage_notes text,
  add column safety_notes text,
  add column author_display text,
  add column published_at timestamptz,
  add column featured boolean not null default false,
  add column sort_order int not null default 0;

alter table public.recipe_ingredients
  add column display_amount text,
  add column group_label text not null default 'Ingredients',
  add column group_sort_order int not null default 0;

alter table public.recipe_steps
  add column section_label text not null default 'Method',
  add column section_sort_order int not null default 0;

create index recipes_published_sort_idx
  on public.recipes (featured desc, sort_order, published_at desc)
  where verified = true and verification_status = 'verified';

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('recipe-images', 'recipe-images', true, 10485760, array['image/jpeg', 'image/png', 'image/webp', 'image/avif'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "staff manage recipe images" on storage.objects for all
  using (bucket_id = 'recipe-images' and has_permission('content', 'manage'))
  with check (bucket_id = 'recipe-images' and has_permission('content', 'manage'));

comment on column public.recipes.story is 'Short editorial introduction shown above the recipe method.';
comment on column public.recipes.image_wide is 'JSON image object optimized for a 16:9 hero crop.';
comment on column public.recipes.image_square is 'JSON image object optimized for a 1:1 structured-data and social crop.';
comment on column public.recipe_ingredients.display_amount is 'Human-readable quantity such as “6 pieces (700–800 g)”; amount/unit remain available for future scaling.';

-- Replace both ordered collections atomically so an invalid row cannot leave a recipe half-saved.
create or replace function public.replace_recipe_structure(
  target_recipe_id uuid,
  ingredient_rows jsonb,
  step_rows jsonb
)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if not public.has_permission('content', 'manage') then
    raise exception 'Insufficient permission to edit recipe structure';
  end if;
  if jsonb_typeof(ingredient_rows) <> 'array' or jsonb_typeof(step_rows) <> 'array' then
    raise exception 'Recipe ingredients and steps must be arrays';
  end if;

  delete from public.recipe_ingredients where recipe_id = target_recipe_id;
  insert into public.recipe_ingredients (
    recipe_id, ingredient_id, display_amount, amount, unit, imperial_amount, imperial_unit,
    note, group_label, group_sort_order, sort_order
  )
  select
    target_recipe_id, row_data.ingredient_id, nullif(row_data.display_amount, ''),
    row_data.amount, nullif(row_data.unit, ''), row_data.imperial_amount,
    nullif(row_data.imperial_unit, ''), nullif(row_data.note, ''),
    row_data.group_label, row_data.group_sort_order, row_data.sort_order
  from jsonb_to_recordset(ingredient_rows) as row_data(
    ingredient_id uuid,
    display_amount text,
    amount numeric,
    unit text,
    imperial_amount numeric,
    imperial_unit text,
    note text,
    group_label text,
    group_sort_order int,
    sort_order int
  );

  delete from public.recipe_steps where recipe_id = target_recipe_id;
  insert into public.recipe_steps (
    recipe_id, instruction, timer_minutes, section_label, section_sort_order, sort_order
  )
  select
    target_recipe_id, row_data.instruction, row_data.timer_minutes,
    row_data.section_label, row_data.section_sort_order, row_data.sort_order
  from jsonb_to_recordset(step_rows) as row_data(
    instruction text,
    timer_minutes int,
    section_label text,
    section_sort_order int,
    sort_order int
  );
end;
$$;

revoke all on function public.replace_recipe_structure(uuid, jsonb, jsonb) from public;
grant execute on function public.replace_recipe_structure(uuid, jsonb, jsonb) to authenticated;

-- Create editable CMS drafts for the launch collection. The storefront's reviewed launch data
-- remains the public fallback until staff add relational ingredients/steps and verify each record.
insert into public.recipes (
  title, bangla_title, slug, language, summary, story, category, servings, prep_minutes,
  cook_minutes, total_minutes, inactive_minutes, yield_text, difficulty, library_sections,
  dietary_tags, hero_image, image_wide, image_square, image_credit, author_display,
  verification_status, verified, featured, sort_order, source_notes
)
values
  ('Rui Shorshe Jhal', 'রুই সর্ষে ঝাল', 'rui-shorshe-jhal', 'en',
   'Tender rohu in a sharp, golden mustard gravy, finished with green chillies and a final thread of raw mustard oil.',
   'Mustard does the expressive work in this restrained fish curry. Keep the heat gentle once the paste enters the pan.',
   'Fish & seafood', 4, 30, 20, 50, 15, '6 pieces, serving 4', 'moderate',
   array['traditional'::recipe_library_section, 'everyday-cooking'::recipe_library_section], array['Dairy-free', 'Gluten-free'],
   jsonb_build_object('url', '/images/recipes/rui-shorshe-jhal.webp', 'alt', 'Rohu fish pieces in golden mustard gravy with green chillies'),
   jsonb_build_object('url', '/images/recipes/rui-shorshe-jhal-wide.webp', 'alt', 'Rohu fish pieces in golden mustard gravy with green chillies'),
   jsonb_build_object('url', '/images/recipes/rui-shorshe-jhal-square.webp', 'alt', 'Rohu fish pieces in golden mustard gravy with green chillies'),
   'Bangla Blend Kitchen', 'Bangla Blend Kitchen', 'draft', false, true, 10, 'Launch recipe transcribed and editorially reviewed from Recipes.docx.'),
  ('Loitta Shutki Bhuna', 'লইট্টা শুঁটকি ভুনা', 'loitta-shutki-bhuna', 'en',
   'Dried Bombay duck cooked slowly with deeply browned onion, garlic, mustard oil and green chilli until intensely savoury and dry.',
   'Careful washing softens the salinity of loitta shutki, while slow bhuna cooking turns its bold aroma into something rounded and rich.',
   'Fish & seafood', 4, 30, 35, 65, 15, 'Serves 4', 'moderate', array['traditional'::recipe_library_section], array['Dairy-free', 'Gluten-free'],
   jsonb_build_object('url', '/images/recipes/loitta-shutki-bhuna.webp', 'alt', 'Dry loitta shutki bhuna with caramelized onions and chillies'),
   jsonb_build_object('url', '/images/recipes/loitta-shutki-bhuna-wide.webp', 'alt', 'Dry loitta shutki bhuna with caramelized onions and chillies'),
   jsonb_build_object('url', '/images/recipes/loitta-shutki-bhuna-square.webp', 'alt', 'Dry loitta shutki bhuna with caramelized onions and chillies'),
   'Bangla Blend Kitchen, generated for this collection', 'Bangla Blend Kitchen', 'draft', false, true, 20, 'Launch recipe transcribed and editorially reviewed from Recipes.docx. Replacement image generated to avoid unverified source rights.'),
  ('Muri Ghonto', 'মুড়িঘণ্ট', 'muri-ghonto', 'en',
   'Aromatic short-grain rice, potato and fried rohu fish head cooked together into a moist, celebratory Bengali classic.',
   'Frying the fish head well and toasting the rice before simmering build the dish’s distinctive depth and gently nutty aroma.',
   'Fish & seafood', 4, 30, 45, 75, 15, 'Serves 4', 'advanced', array['traditional'::recipe_library_section], array['Gluten-free'],
   jsonb_build_object('url', '/images/recipes/muri-ghonto.webp', 'alt', 'Muri Ghonto with aromatic rice, potato and fried rohu fish head'),
   jsonb_build_object('url', '/images/recipes/muri-ghonto-wide.webp', 'alt', 'Muri Ghonto with aromatic rice, potato and fried rohu fish head'),
   jsonb_build_object('url', '/images/recipes/muri-ghonto-square.webp', 'alt', 'Muri Ghonto with aromatic rice, potato and fried rohu fish head'),
   'Bangla Blend Kitchen, generated for this collection', 'Bangla Blend Kitchen', 'draft', false, false, 30, 'Launch recipe transcribed and editorially reviewed from Recipes.docx. Replacement image generated because the source image was watermarked.'),
  ('Tel Koi', 'তেল কই', 'tel-koi', 'en',
   'Koi fish simmered simply with nigella, green chilli and mustard oil in a light, aromatic gravy.',
   'The short ingredient list is the point: fresh koi, good mustard oil and careful cooking create a dish with clarity and warmth.',
   'Fish & seafood', 4, 25, 20, 45, 15, '6 fish, serving 4', 'moderate', array['traditional'::recipe_library_section, 'everyday-cooking'::recipe_library_section], array['Dairy-free', 'Gluten-free'],
   jsonb_build_object('url', '/images/recipes/tel-koi.webp', 'alt', 'Koi fish in a mustard-oil gravy with green chillies'),
   jsonb_build_object('url', '/images/recipes/tel-koi-wide.webp', 'alt', 'Koi fish in a mustard-oil gravy with green chillies'),
   jsonb_build_object('url', '/images/recipes/tel-koi-square.webp', 'alt', 'Koi fish in a mustard-oil gravy with green chillies'),
   'Bangla Blend Kitchen', 'Bangla Blend Kitchen', 'draft', false, false, 40, 'Launch recipe transcribed and editorially reviewed from Recipes.docx.'),
  ('Chital Macher Muitha', 'চিতল মাছের মুইঠা', 'chital-macher-muitha', 'en',
   'Soft chital fish dumplings gently simmered in an aromatic onion-and-spice curry.',
   'Chital muitha is a patient cook’s dish: the springy fish flesh is shaped, poached, fried and then rested in a fragrant gravy.',
   'Fish & seafood', 5, 45, 50, 95, null, 'Serves 4–5', 'advanced', array['traditional'::recipe_library_section], array['Gluten-free'],
   jsonb_build_object('url', '/images/recipes/chital-macher-muitha.webp', 'alt', 'Chital fish dumplings in aromatic onion gravy'),
   jsonb_build_object('url', '/images/recipes/chital-macher-muitha-wide.webp', 'alt', 'Chital fish dumplings in aromatic onion gravy'),
   jsonb_build_object('url', '/images/recipes/chital-macher-muitha-square.webp', 'alt', 'Chital fish dumplings in aromatic onion gravy'),
   'Bangla Blend Kitchen', 'Bangla Blend Kitchen', 'draft', false, false, 50, 'Launch recipe transcribed and editorially reviewed from Recipes.docx.'),
  ('Chicken Achar', 'মুরগির আচার', 'chicken-achar', 'en',
   'A punchy, achar-style chicken preparation with mustard oil, panch phoron, garlic and fresh lemon.',
   'This is cooked chicken inspired by achar, not a shelf-stable pickle. Its sour-spicy masala makes a vivid accompaniment to rice or flatbread.',
   'Pantry', 6, 25, 35, 60, 60, 'About 1 kg, serving 6', 'moderate', array['everyday-cooking'::recipe_library_section], array['Dairy-free', 'Gluten-free'],
   jsonb_build_object('url', '/images/recipes/chicken-achar.webp', 'alt', 'Achar-style chicken with mustard oil and whole spices'),
   jsonb_build_object('url', '/images/recipes/chicken-achar-wide.webp', 'alt', 'Achar-style chicken with mustard oil and whole spices'),
   jsonb_build_object('url', '/images/recipes/chicken-achar-square.webp', 'alt', 'Achar-style chicken with mustard oil and whole spices'),
   'Bangla Blend Kitchen', 'Bangla Blend Kitchen', 'draft', false, false, 60, 'Launch recipe transcribed from Recipes.docx. Unsafe room-temperature storage advice was removed and replaced with current cooked-poultry guidance.'),
  ('Traditional Bangladeshi Cholar Dal', 'ছোলার ডাল', 'cholar-dal', 'en',
   'Thick split Bengal gram scented with coconut, raisins, whole spices and ghee—a festive dal with gentle sweetness.',
   'Cholar dal sits between savoury and celebratory, its split gram kept intact and enriched with small bursts of coconut and raisin.',
   'Vegetarian', 6, 20, 40, 60, 60, 'Serves 5–6', 'easy', array['traditional'::recipe_library_section, 'everyday-cooking'::recipe_library_section], array['Vegetarian', 'Gluten-free'],
   jsonb_build_object('url', '/images/recipes/cholar-dal.webp', 'alt', 'Thick cholar dal with coconut, raisins and green chillies'),
   jsonb_build_object('url', '/images/recipes/cholar-dal-wide.webp', 'alt', 'Thick cholar dal with coconut, raisins and green chillies'),
   jsonb_build_object('url', '/images/recipes/cholar-dal-square.webp', 'alt', 'Thick cholar dal with coconut, raisins and green chillies'),
   'Bangla Blend Kitchen, generated for this collection', 'Bangla Blend Kitchen', 'draft', false, false, 70, 'Launch recipe transcribed and editorially reviewed from Recipes.docx. Replacement image corrects the original whole-chickpea mismatch.'),
  ('Date-Molasses Beef Bhuna', 'খেজুরের গুড়ের গরুর মাংস ভুনা', 'date-molasses-beef-bhuna', 'en',
   'Slow-cooked beef bhuna balanced with a restrained spoonful of date molasses for a dark, glossy finish.',
   'Date molasses does not make this bhuna sweet; used carefully, it rounds the heat and deepens the caramel notes of browned onion.',
   'Meat & poultry', 6, 30, 105, 135, 30, 'Serves 6', 'advanced', array['traditional'::recipe_library_section], array['Dairy-free', 'Gluten-free'],
   jsonb_build_object('url', '/images/recipes/date-molasses-beef-bhuna.webp', 'alt', 'Dark date-molasses beef bhuna with caramelized onion'),
   jsonb_build_object('url', '/images/recipes/date-molasses-beef-bhuna-wide.webp', 'alt', 'Dark date-molasses beef bhuna with caramelized onion'),
   jsonb_build_object('url', '/images/recipes/date-molasses-beef-bhuna-square.webp', 'alt', 'Dark date-molasses beef bhuna with caramelized onion'),
   'Bangla Blend Kitchen', 'Bangla Blend Kitchen', 'draft', false, true, 80, 'Launch recipe transcribed and editorially reviewed from Recipes.docx.'),
  ('Haor-Style Duck Bhuna', 'হাওর-স্টাইল হাঁস ভুনা', 'haor-duck-bhuna', 'en',
   'Country duck cooked low and slow with onion, pepper and whole spices until tender and richly coated.',
   'Patient cooking lets the duck’s richness mingle with browned onion, green chilli and roasted cumin for a thick bhuna finish.',
   'Meat & poultry', 5, 35, 90, 125, 60, 'Serves 4–6', 'advanced', array['traditional'::recipe_library_section], array['Dairy-free option', 'Gluten-free'],
   jsonb_build_object('url', '/images/recipes/haor-duck-bhuna.webp', 'alt', 'Dark dry-style duck bhuna with green chillies'),
   jsonb_build_object('url', '/images/recipes/haor-duck-bhuna-wide.webp', 'alt', 'Dark dry-style duck bhuna with green chillies'),
   jsonb_build_object('url', '/images/recipes/haor-duck-bhuna-square.webp', 'alt', 'Dark dry-style duck bhuna with green chillies'),
   'Bangla Blend Kitchen, generated for this collection', 'Bangla Blend Kitchen', 'draft', false, true, 90, 'Launch recipe transcribed and editorially reviewed from Recipes.docx. Image generated because the source document had none.')
on conflict (slug, language) do nothing;
