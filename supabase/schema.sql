-- DOMPET PT AI - Supabase schema tahap 1
-- Jalankan di Supabase SQL Editor atau via Supabase CLI.
-- Storage bucket yang disiapkan: transaction-proofs, company-logos, backups.
-- Policy storage di bawah masih development-friendly untuk user authenticated.
-- Production: batasi path per company_id/user_id dan validasi role lewat policy tambahan.

create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  app_name text not null default 'DOMPET PT AI',
  tagline text,
  logo_url text,
  primary_color text not null default '#b9c7e4',
  theme_mode text not null default 'dark' check (theme_mode in ('dark', 'light', 'system')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.users_profile (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique references auth.users(id) on delete set null,
  company_id uuid not null references public.companies(id) on delete cascade,
  name text not null,
  email text not null,
  role text not null check (role in ('Super Admin', 'Finance', 'Manager', 'Staff', 'Viewer')),
  status text not null default 'active' check (status in ('active', 'inactive', 'invited')),
  created_at timestamptz not null default now(),
  unique (company_id, email)
);

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  code text not null,
  name text not null,
  pic_name text,
  budget numeric(18,2) not null default 0 check (budget >= 0),
  status text not null default 'active' check (status in ('active', 'hold', 'completed')),
  start_date date,
  end_date date,
  created_at timestamptz not null default now(),
  unique (company_id, code)
);

create table if not exists public.accounts (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  name text not null,
  bank_name text,
  account_number text,
  type text not null check (type in ('bank', 'cash', 'petty_cash', 'ewallet')),
  opening_balance numeric(18,2) not null default 0,
  current_balance numeric(18,2) not null default 0,
  status text not null default 'active' check (status in ('active', 'inactive')),
  created_at timestamptz not null default now()
);

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  name text not null,
  type text not null check (type in ('income', 'expense', 'petty_cash')),
  group_name text not null,
  status text not null default 'active' check (status in ('active', 'inactive')),
  created_at timestamptz not null default now(),
  unique (company_id, name, type)
);

create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  project_id uuid references public.projects(id) on delete set null,
  account_id uuid references public.accounts(id) on delete set null,
  category_id uuid references public.categories(id) on delete set null,
  transaction_no text not null,
  type text not null check (type in ('income', 'expense')),
  date date not null,
  title text not null,
  vendor_or_source text,
  payment_method text,
  amount numeric(18,2) not null check (amount >= 0),
  tax_amount numeric(18,2) not null default 0 check (tax_amount >= 0),
  note text,
  proof_url text,
  status text not null default 'draft' check (status in ('draft', 'pending', 'approved', 'paid', 'rejected')),
  ai_category text,
  ai_risk text,
  created_by uuid references public.users_profile(id) on delete set null,
  approved_by uuid references public.users_profile(id) on delete set null,
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_id, transaction_no)
);

create table if not exists public.approvals (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  transaction_id uuid not null references public.transactions(id) on delete cascade,
  requested_by uuid references public.users_profile(id) on delete set null,
  approved_by uuid references public.users_profile(id) on delete set null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected', 'revision_requested')),
  note text,
  ai_risk text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.debts (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  project_id uuid references public.projects(id) on delete set null,
  vendor_name text not null,
  invoice_no text,
  invoice_date date,
  due_date date,
  total_amount numeric(18,2) not null default 0 check (total_amount >= 0),
  paid_amount numeric(18,2) not null default 0 check (paid_amount >= 0),
  status text not null default 'unpaid' check (status in ('unpaid', 'partial', 'paid', 'overdue')),
  note text,
  created_at timestamptz not null default now()
);

create table if not exists public.receivables (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  project_id uuid references public.projects(id) on delete set null,
  client_name text not null,
  invoice_no text,
  invoice_date date,
  due_date date,
  total_amount numeric(18,2) not null default 0 check (total_amount >= 0),
  received_amount numeric(18,2) not null default 0 check (received_amount >= 0),
  status text not null default 'unpaid' check (status in ('unpaid', 'partial', 'paid', 'overdue')),
  note text,
  created_at timestamptz not null default now()
);

create table if not exists public.petty_cash (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  account_id uuid references public.accounts(id) on delete set null,
  transaction_id uuid references public.transactions(id) on delete set null,
  type text not null check (type in ('top_up', 'expense', 'adjustment')),
  amount numeric(18,2) not null default 0 check (amount >= 0),
  note text,
  proof_url text,
  created_at timestamptz not null default now()
);

alter table if exists public.debts add column if not exists note text;
alter table if exists public.receivables add column if not exists note text;
alter table if exists public.petty_cash add column if not exists proof_url text;

create table if not exists public.activity_logs (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  user_id uuid references public.users_profile(id) on delete set null,
  module text not null,
  action text not null,
  target_id uuid,
  description text,
  device_info text,
  ip_address text,
  created_at timestamptz not null default now()
);

create table if not exists public.backups (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  file_url text not null,
  backup_type text not null default 'manual' check (backup_type in ('manual', 'scheduled', 'restore_point')),
  created_by uuid references public.users_profile(id) on delete set null,
  created_at timestamptz not null default now()
);

drop trigger if exists set_companies_updated_at on public.companies;
create trigger set_companies_updated_at before update on public.companies for each row execute function public.set_updated_at();

drop trigger if exists set_transactions_updated_at on public.transactions;
create trigger set_transactions_updated_at before update on public.transactions for each row execute function public.set_updated_at();

drop trigger if exists set_approvals_updated_at on public.approvals;
create trigger set_approvals_updated_at before update on public.approvals for each row execute function public.set_updated_at();

create index if not exists users_profile_company_id_idx on public.users_profile(company_id);
create index if not exists projects_company_id_status_idx on public.projects(company_id, status);
create index if not exists accounts_company_id_status_idx on public.accounts(company_id, status);
create index if not exists categories_company_id_type_idx on public.categories(company_id, type);
create index if not exists transactions_company_id_date_idx on public.transactions(company_id, date desc);
create index if not exists transactions_project_id_idx on public.transactions(project_id);
create index if not exists transactions_account_id_idx on public.transactions(account_id);
create index if not exists transactions_status_idx on public.transactions(status);
create index if not exists approvals_company_id_status_idx on public.approvals(company_id, status);
create index if not exists debts_company_id_due_idx on public.debts(company_id, due_date);
create index if not exists receivables_company_id_due_idx on public.receivables(company_id, due_date);
create index if not exists activity_logs_company_id_created_idx on public.activity_logs(company_id, created_at desc);

-- Bootstrap fallback: email JWT dipakai agar seed profile dengan auth_user_id null tetap bisa dibaca.
-- Production: isi users_profile.auth_user_id dengan UUID Supabase Auth setelah user dibuat.
create or replace function public.current_company_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select company_id
  from public.users_profile
  where (auth_user_id = auth.uid() or email = (auth.jwt() ->> 'email'))
    and status = 'active'
  limit 1
$$;

create or replace function public.current_user_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role
  from public.users_profile
  where (auth_user_id = auth.uid() or email = (auth.jwt() ->> 'email'))
    and status = 'active'
  limit 1
$$;

create or replace function public.has_company_role(allowed_roles text[])
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.users_profile
    where (auth_user_id = auth.uid() or email = (auth.jwt() ->> 'email'))
      and status = 'active'
      and company_id = public.current_company_id()
      and role = any(allowed_roles)
  )
$$;

alter table public.companies enable row level security;
alter table public.users_profile enable row level security;
alter table public.projects enable row level security;
alter table public.accounts enable row level security;
alter table public.categories enable row level security;
alter table public.transactions enable row level security;
alter table public.approvals enable row level security;
alter table public.debts enable row level security;
alter table public.receivables enable row level security;
alter table public.petty_cash enable row level security;
alter table public.activity_logs enable row level security;
alter table public.backups enable row level security;

-- RLS tahap 1H: isolasi company aktif dan role dasar.
-- TODO production: pecah role lebih granular per kolom, ownership created_by, approval limit nominal, dan audit IP/device.

drop policy if exists "company members read company" on public.companies;
drop policy if exists "super admins update company" on public.companies;
drop policy if exists "company read companies" on public.companies;
drop policy if exists "super admin update companies" on public.companies;
create policy "company read companies" on public.companies
for select to authenticated
using (id = public.current_company_id());
create policy "super admin update companies" on public.companies
for update to authenticated
using (id = public.current_company_id() and public.has_company_role(array['Super Admin']))
with check (id = public.current_company_id() and public.has_company_role(array['Super Admin']));

drop policy if exists "company members read profiles" on public.users_profile;
drop policy if exists "super admins manage profiles" on public.users_profile;
drop policy if exists "company read profiles" on public.users_profile;
drop policy if exists "super admin insert profiles" on public.users_profile;
drop policy if exists "super admin update profiles" on public.users_profile;
drop policy if exists "super admin delete profiles" on public.users_profile;
create policy "company read profiles" on public.users_profile
for select to authenticated
using (auth_user_id = auth.uid() or email = (auth.jwt() ->> 'email') or company_id = public.current_company_id());
create policy "super admin insert profiles" on public.users_profile
for insert to authenticated
with check (company_id = public.current_company_id() and public.has_company_role(array['Super Admin']));
create policy "super admin update profiles" on public.users_profile
for update to authenticated
using (company_id = public.current_company_id() and public.has_company_role(array['Super Admin']))
with check (company_id = public.current_company_id() and public.has_company_role(array['Super Admin']));
create policy "super admin delete profiles" on public.users_profile
for delete to authenticated
using (company_id = public.current_company_id() and public.has_company_role(array['Super Admin']));

drop policy if exists "company crud projects" on public.projects;
drop policy if exists "company read projects" on public.projects;
drop policy if exists "finance insert projects" on public.projects;
drop policy if exists "finance update projects" on public.projects;
drop policy if exists "super admin delete projects" on public.projects;
create policy "company read projects" on public.projects
for select to authenticated
using (company_id = public.current_company_id());
create policy "finance insert projects" on public.projects
for insert to authenticated
with check (company_id = public.current_company_id() and public.has_company_role(array['Super Admin','Finance']));
create policy "finance update projects" on public.projects
for update to authenticated
using (company_id = public.current_company_id() and public.has_company_role(array['Super Admin','Finance']))
with check (company_id = public.current_company_id() and public.has_company_role(array['Super Admin','Finance']));
create policy "super admin delete projects" on public.projects
for delete to authenticated
using (company_id = public.current_company_id() and public.has_company_role(array['Super Admin']));

drop policy if exists "company crud accounts" on public.accounts;
drop policy if exists "company read accounts" on public.accounts;
drop policy if exists "finance insert accounts" on public.accounts;
drop policy if exists "finance update accounts" on public.accounts;
drop policy if exists "super admin delete accounts" on public.accounts;
create policy "company read accounts" on public.accounts
for select to authenticated
using (company_id = public.current_company_id());
create policy "finance insert accounts" on public.accounts
for insert to authenticated
with check (company_id = public.current_company_id() and public.has_company_role(array['Super Admin','Finance']));
create policy "finance update accounts" on public.accounts
for update to authenticated
using (company_id = public.current_company_id() and public.has_company_role(array['Super Admin','Finance']))
with check (company_id = public.current_company_id() and public.has_company_role(array['Super Admin','Finance']));
create policy "super admin delete accounts" on public.accounts
for delete to authenticated
using (company_id = public.current_company_id() and public.has_company_role(array['Super Admin']));

drop policy if exists "company crud categories" on public.categories;
drop policy if exists "company read categories" on public.categories;
drop policy if exists "finance insert categories" on public.categories;
drop policy if exists "finance update categories" on public.categories;
drop policy if exists "super admin delete categories" on public.categories;
create policy "company read categories" on public.categories
for select to authenticated
using (company_id = public.current_company_id());
create policy "finance insert categories" on public.categories
for insert to authenticated
with check (company_id = public.current_company_id() and public.has_company_role(array['Super Admin','Finance']));
create policy "finance update categories" on public.categories
for update to authenticated
using (company_id = public.current_company_id() and public.has_company_role(array['Super Admin','Finance']))
with check (company_id = public.current_company_id() and public.has_company_role(array['Super Admin','Finance']));
create policy "super admin delete categories" on public.categories
for delete to authenticated
using (company_id = public.current_company_id() and public.has_company_role(array['Super Admin']));

drop policy if exists "company crud transactions" on public.transactions;
drop policy if exists "company read transactions" on public.transactions;
drop policy if exists "finance staff insert transactions" on public.transactions;
drop policy if exists "finance manager update transactions" on public.transactions;
drop policy if exists "finance delete transactions" on public.transactions;
create policy "company read transactions" on public.transactions
for select to authenticated
using (company_id = public.current_company_id());
create policy "finance staff insert transactions" on public.transactions
for insert to authenticated
with check (
  company_id = public.current_company_id()
  and (
    public.has_company_role(array['Super Admin','Finance'])
    or (public.has_company_role(array['Staff']) and status in ('draft','pending'))
  )
);
create policy "finance manager update transactions" on public.transactions
for update to authenticated
using (company_id = public.current_company_id() and public.has_company_role(array['Super Admin','Finance','Manager']))
with check (company_id = public.current_company_id() and public.has_company_role(array['Super Admin','Finance','Manager']));
create policy "finance delete transactions" on public.transactions
for delete to authenticated
using (company_id = public.current_company_id() and public.has_company_role(array['Super Admin','Finance']));

drop policy if exists "company crud approvals" on public.approvals;
drop policy if exists "company read approvals" on public.approvals;
drop policy if exists "finance staff insert approvals" on public.approvals;
drop policy if exists "manager update approvals" on public.approvals;
drop policy if exists "finance delete approvals" on public.approvals;
create policy "company read approvals" on public.approvals
for select to authenticated
using (company_id = public.current_company_id());
create policy "finance staff insert approvals" on public.approvals
for insert to authenticated
with check (company_id = public.current_company_id() and public.has_company_role(array['Super Admin','Finance','Staff']));
create policy "manager update approvals" on public.approvals
for update to authenticated
using (company_id = public.current_company_id() and public.has_company_role(array['Super Admin','Manager']))
with check (company_id = public.current_company_id() and public.has_company_role(array['Super Admin','Manager']));
create policy "finance delete approvals" on public.approvals
for delete to authenticated
using (company_id = public.current_company_id() and public.has_company_role(array['Super Admin','Finance']));

drop policy if exists "company crud debts" on public.debts;
drop policy if exists "company read debts" on public.debts;
drop policy if exists "finance insert debts" on public.debts;
drop policy if exists "finance update debts" on public.debts;
drop policy if exists "super admin delete debts" on public.debts;
create policy "company read debts" on public.debts
for select to authenticated
using (company_id = public.current_company_id());
create policy "finance insert debts" on public.debts
for insert to authenticated
with check (company_id = public.current_company_id() and public.has_company_role(array['Super Admin','Finance']));
create policy "finance update debts" on public.debts
for update to authenticated
using (company_id = public.current_company_id() and public.has_company_role(array['Super Admin','Finance']))
with check (company_id = public.current_company_id() and public.has_company_role(array['Super Admin','Finance']));
create policy "super admin delete debts" on public.debts
for delete to authenticated
using (company_id = public.current_company_id() and public.has_company_role(array['Super Admin']));

drop policy if exists "company crud receivables" on public.receivables;
drop policy if exists "company read receivables" on public.receivables;
drop policy if exists "finance insert receivables" on public.receivables;
drop policy if exists "finance update receivables" on public.receivables;
drop policy if exists "super admin delete receivables" on public.receivables;
create policy "company read receivables" on public.receivables
for select to authenticated
using (company_id = public.current_company_id());
create policy "finance insert receivables" on public.receivables
for insert to authenticated
with check (company_id = public.current_company_id() and public.has_company_role(array['Super Admin','Finance']));
create policy "finance update receivables" on public.receivables
for update to authenticated
using (company_id = public.current_company_id() and public.has_company_role(array['Super Admin','Finance']))
with check (company_id = public.current_company_id() and public.has_company_role(array['Super Admin','Finance']));
create policy "super admin delete receivables" on public.receivables
for delete to authenticated
using (company_id = public.current_company_id() and public.has_company_role(array['Super Admin']));

drop policy if exists "company crud petty cash" on public.petty_cash;
drop policy if exists "company read petty cash" on public.petty_cash;
drop policy if exists "finance staff insert petty cash" on public.petty_cash;
drop policy if exists "finance update petty cash" on public.petty_cash;
drop policy if exists "super admin delete petty cash" on public.petty_cash;
create policy "company read petty cash" on public.petty_cash
for select to authenticated
using (company_id = public.current_company_id());
create policy "finance staff insert petty cash" on public.petty_cash
for insert to authenticated
with check (
  company_id = public.current_company_id()
  and (
    public.has_company_role(array['Super Admin','Finance'])
    or (public.has_company_role(array['Staff']) and type = 'expense')
  )
);
create policy "finance update petty cash" on public.petty_cash
for update to authenticated
using (company_id = public.current_company_id() and public.has_company_role(array['Super Admin','Finance']))
with check (company_id = public.current_company_id() and public.has_company_role(array['Super Admin','Finance']));
create policy "super admin delete petty cash" on public.petty_cash
for delete to authenticated
using (company_id = public.current_company_id() and public.has_company_role(array['Super Admin']));

drop policy if exists "company crud logs" on public.activity_logs;
drop policy if exists "company read logs" on public.activity_logs;
drop policy if exists "company insert logs" on public.activity_logs;
drop policy if exists "super admin delete logs" on public.activity_logs;
create policy "company read logs" on public.activity_logs
for select to authenticated
using (company_id = public.current_company_id());
create policy "company insert logs" on public.activity_logs
for insert to authenticated
with check (company_id = public.current_company_id());
create policy "super admin delete logs" on public.activity_logs
for delete to authenticated
using (company_id = public.current_company_id() and public.has_company_role(array['Super Admin']));

drop policy if exists "company crud backups" on public.backups;
drop policy if exists "company read backups" on public.backups;
drop policy if exists "finance insert backups" on public.backups;
drop policy if exists "super admin update backups" on public.backups;
drop policy if exists "super admin delete backups" on public.backups;
create policy "company read backups" on public.backups
for select to authenticated
using (company_id = public.current_company_id());
create policy "finance insert backups" on public.backups
for insert to authenticated
with check (company_id = public.current_company_id() and public.has_company_role(array['Super Admin','Finance']));
create policy "super admin update backups" on public.backups
for update to authenticated
using (company_id = public.current_company_id() and public.has_company_role(array['Super Admin']))
with check (company_id = public.current_company_id() and public.has_company_role(array['Super Admin']));
create policy "super admin delete backups" on public.backups
for delete to authenticated
using (company_id = public.current_company_id() and public.has_company_role(array['Super Admin']));

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('transaction-proofs', 'transaction-proofs', false, 10485760, array['image/jpeg', 'image/png', 'image/webp', 'application/pdf']),
  ('company-logos', 'company-logos', false, 5242880, array['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml']),
  ('backups', 'backups', false, 52428800, array['application/json', 'application/zip'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Storage policy tahap 1H: path wajib diawali company_id, misalnya
-- transaction-proofs/<company_id>/transactions/file.pdf.
-- TODO production: tambahkan limit path user_id, scan mime server-side, dan lifecycle backup.
drop policy if exists "authenticated read dompet storage" on storage.objects;
drop policy if exists "authenticated upload dompet storage" on storage.objects;
drop policy if exists "authenticated update dompet storage" on storage.objects;
drop policy if exists "company read dompet storage" on storage.objects;
drop policy if exists "company upload dompet storage" on storage.objects;
drop policy if exists "company update dompet storage" on storage.objects;
drop policy if exists "company delete dompet storage" on storage.objects;
create policy "company read dompet storage" on storage.objects
for select to authenticated
using (
  bucket_id in ('transaction-proofs', 'company-logos', 'backups')
  and (storage.foldername(name))[1] = public.current_company_id()::text
);
create policy "company upload dompet storage" on storage.objects
for insert to authenticated
with check (
  bucket_id in ('transaction-proofs', 'company-logos', 'backups')
  and (storage.foldername(name))[1] = public.current_company_id()::text
  and (
    (bucket_id = 'transaction-proofs' and public.has_company_role(array['Super Admin','Finance','Staff']))
    or (bucket_id in ('company-logos','backups') and public.has_company_role(array['Super Admin','Finance']))
  )
);
create policy "company update dompet storage" on storage.objects
for update to authenticated
using (
  bucket_id in ('transaction-proofs', 'company-logos', 'backups')
  and (storage.foldername(name))[1] = public.current_company_id()::text
  and public.has_company_role(array['Super Admin','Finance'])
)
with check (
  bucket_id in ('transaction-proofs', 'company-logos', 'backups')
  and (storage.foldername(name))[1] = public.current_company_id()::text
  and public.has_company_role(array['Super Admin','Finance'])
);
create policy "company delete dompet storage" on storage.objects
for delete to authenticated
using (
  bucket_id in ('transaction-proofs', 'company-logos', 'backups')
  and (storage.foldername(name))[1] = public.current_company_id()::text
  and public.has_company_role(array['Super Admin','Finance'])
);
