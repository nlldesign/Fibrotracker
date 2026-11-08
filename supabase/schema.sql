-- ============================================================================
-- FIBROCARE - SCHEMA SQL PARA SUPABASE (PostgreSQL 17 + RLS LGPD)
-- ============================================================================

create schema if not exists private;

-- 1. Tabela de Perfil Clínico da Paciente
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text,
  diagnosis_year int,
  continuous_medications text[] default '{}',
  doctor_name text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 2. Tabela Principal de Registros Diários
create table if not exists public.daily_records (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  record_date date not null,
  pain int not null check (pain >= 0 and pain <= 10),
  spoons int not null default 3 check (spoons >= 1 and spoons <= 5),
  sleep text not null check (sleep in ('bom', 'leve', 'insonia')),
  fog text not null check (fog in ('claro', 'leve', 'intenso')),
  body_zones text[] not null default '{}',
  pain_qualities text[] not null default '{}',
  triggers text[] not null default '{}',
  relief_actions text[] not null default '{}',
  cycle_status text not null check (cycle_status in ('green', 'yellow', 'red')),
  notes text default '',
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (user_id, record_date)
);

-- Índices para consultas rápidas de calendário e relatórios
create index if not exists idx_daily_records_user_date
  on public.daily_records (user_id, record_date desc);

-- 3. Segurança LGPD: Row Level Security (RLS)
alter table public.profiles enable row level security;
alter table public.daily_records enable row level security;

grant select, insert, update, delete on table public.profiles to authenticated;
grant select, insert, update, delete on table public.daily_records to authenticated;

create policy "profiles_select_own"
  on public.profiles for select
  to authenticated
  using ((select auth.uid()) = id);

create policy "profiles_insert_own"
  on public.profiles for insert
  to authenticated
  with check ((select auth.uid()) = id);

create policy "profiles_update_own"
  on public.profiles for update
  to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

create policy "profiles_delete_own"
  on public.profiles for delete
  to authenticated
  using ((select auth.uid()) = id);

create policy "daily_records_select_own"
  on public.daily_records for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "daily_records_insert_own"
  on public.daily_records for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "daily_records_update_own"
  on public.daily_records for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "daily_records_delete_own"
  on public.daily_records for delete
  to authenticated
  using ((select auth.uid()) = user_id);

-- 4. Trigger em schema privado para criar perfil automaticamente
create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)))
  on conflict (id) do nothing;
  return new;
end;
$$;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure private.handle_new_user();
