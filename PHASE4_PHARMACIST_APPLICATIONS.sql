-- Phase 4: run once, as Supabase project owner, in SQL Editor. Do not rerun Phase 3 SQL.
-- Collect only professional information for DEVELOPMENT TESTING, not identity documents.
create table if not exists public.pharmacist_applications (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null unique references auth.users(id) on delete cascade,
 full_name text not null check (char_length(full_name) between 2 and 120),
 license_number text not null check (char_length(license_number) between 1 and 100),
 registration_authority text not null check (char_length(registration_authority) between 2 and 160),
 workplace text not null check (char_length(workplace) between 2 and 160),
 professional_email text not null check (char_length(professional_email) between 3 and 254),
 status text not null default 'pending' check (status in ('pending','approved','rejected')),
 reviewer_message text,
 created_at timestamptz not null default now()
);
alter table public.pharmacist_applications enable row level security;
revoke all on public.pharmacist_applications from anon, authenticated;
grant select, insert on public.pharmacist_applications to authenticated;
-- Safe to re-run policy section without errors using drop policy if exists.
drop policy if exists "pharmacist application read own" on public.pharmacist_applications;
create policy "pharmacist application read own" on public.pharmacist_applications
 for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists "pharmacist application create own pending" on public.pharmacist_applications;
create policy "pharmacist application create own pending" on public.pharmacist_applications
 for insert to authenticated with check ((select auth.uid()) = user_id and status = 'pending' and reviewer_message is null);
create index if not exists idx_pharmacist_applications_status on public.pharmacist_applications(status);

-- ADMINISTRATOR ONLY: inspect applications through Supabase dashboard or SQL Editor:
-- select id,user_id,full_name,license_number,registration_authority,workplace,professional_email,status
-- from public.pharmacist_applications order by created_at desc;
-- After independently verifying the licence with the relevant licensing authority:
-- begin;
-- update public.pharmacist_applications set status='approved' where user_id='VERIFIED_USER_UUID' and status='pending';
-- insert into public.care_roles(user_id,role) values ('VERIFIED_USER_UUID','pharmacist')
-- on conflict (user_id) do update set role='pharmacist';
-- commit;
-- DO NOT approve applicants solely because they submitted a form.
