-- Design templates (PRD § 03 "Manage products & templates", § 06 "Template-driven editing").
-- Element positions are fractions of the product's safe area (see src/modules/designer/templates.ts).
create table if not exists public.design_templates (
  id             uuid primary key default gen_random_uuid(),
  division_slug  text not null,
  product_id     text references public.products (id) on delete cascade,
  name           text not null check (char_length(name) between 1 and 80),
  elements       jsonb not null default '[]'::jsonb,
  is_active      boolean not null default true,
  created_by     text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index if not exists design_templates_division_idx on public.design_templates (division_slug) where is_active;

drop trigger if exists design_templates_updated_at on public.design_templates;
create trigger design_templates_updated_at before update on public.design_templates
  for each row execute function public.set_updated_at();

alter table public.design_templates enable row level security;
drop policy if exists "Active templates are public" on public.design_templates;
create policy "Active templates are public" on public.design_templates for select using (is_active);
grant select on public.design_templates to anon, authenticated;
grant all on public.design_templates to service_role;
