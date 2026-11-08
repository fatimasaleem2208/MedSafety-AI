-- MedSafety AI Phase 3: run once in Supabase SQL Editor.
-- Development/testing only. Use synthetic medical information.
create table if not exists public.family_members (
 id uuid primary key default gen_random_uuid(), owner_id uuid not null references auth.users(id) on delete cascade,
 full_name text not null check (char_length(full_name) between 1 and 100),
 relationship text not null check (relationship in ('Self','Parent','Child','Grandparent','Spouse','Sibling','Other')),
 birth_year integer check (birth_year between 1900 and 2100), allergies text not null default '',
 notes text not null default '', created_at timestamptz not null default now(),
 unique (id, owner_id)
);
create table if not exists public.care_reminders (
 id uuid primary key default gen_random_uuid(), owner_id uuid not null references auth.users(id) on delete cascade,
 member_id uuid not null, medicine_name text not null check (char_length(medicine_name) between 1 and 140),
 dosage text not null check (char_length(dosage) between 1 and 80),
 time_of_day time not null, instructions text not null default '', active boolean not null default true,
 created_at timestamptz not null default now(),
 unique (id,owner_id),
 constraint reminder_member_owner_fk foreign key (member_id,owner_id) references public.family_members(id,owner_id) on delete cascade
);
create table if not exists public.care_dose_logs (
 id uuid primary key default gen_random_uuid(), owner_id uuid not null references auth.users(id) on delete cascade,
 reminder_id uuid not null, scheduled_date date not null,
 status text not null check (status in ('taken','skipped')),
 logged_at timestamptz not null default now(),
 unique (reminder_id, scheduled_date),
 constraint dose_owner_fk foreign key (reminder_id,owner_id) references public.care_reminders(id,owner_id) on delete cascade
);
create table if not exists public.care_roles (
 user_id uuid primary key references auth.users(id) on delete cascade,
 role text not null default 'patient' check (role in ('patient','pharmacist','admin'))
);
create table if not exists public.pharmacist_reviews (
 id uuid primary key default gen_random_uuid(), submitted_by uuid not null references auth.users(id) on delete cascade,
 medication_summary text not null check (char_length(medication_summary) between 1 and 4000),
 risk_flags text not null default '', status text not null default 'pending' check (status in ('pending','in_review','completed')),
 reviewer_notes text, created_at timestamptz not null default now()
);
-- RLS on every table. Backend policies, NOT client-side UI, enforce access.
alter table public.family_members enable row level security;
alter table public.care_reminders enable row level security;
alter table public.care_dose_logs enable row level security;
alter table public.care_roles enable row level security;
alter table public.pharmacist_reviews enable row level security;
revoke all on public.family_members,public.care_reminders,public.care_dose_logs,public.care_roles,public.pharmacist_reviews from anon,authenticated;
grant select,insert,update,delete on public.family_members,public.care_reminders,public.care_dose_logs to authenticated;
grant select on public.care_roles to authenticated;
grant select,insert on public.pharmacist_reviews to authenticated;
grant update(status,reviewer_notes) on public.pharmacist_reviews to authenticated;
create policy "family read own" on public.family_members for select to authenticated using ((select auth.uid())=owner_id);
create policy "family insert own" on public.family_members for insert to authenticated with check ((select auth.uid())=owner_id);
create policy "family update own" on public.family_members for update to authenticated using ((select auth.uid())=owner_id) with check ((select auth.uid())=owner_id);
create policy "family delete own" on public.family_members for delete to authenticated using ((select auth.uid())=owner_id);
create policy "reminder read own" on public.care_reminders for select to authenticated using ((select auth.uid())=owner_id);
create policy "reminder insert own" on public.care_reminders for insert to authenticated with check ((select auth.uid())=owner_id);
create policy "reminder update own" on public.care_reminders for update to authenticated using ((select auth.uid())=owner_id) with check ((select auth.uid())=owner_id);
create policy "reminder delete own" on public.care_reminders for delete to authenticated using ((select auth.uid())=owner_id);
create policy "dose read own" on public.care_dose_logs for select to authenticated using ((select auth.uid())=owner_id);
create policy "dose insert own" on public.care_dose_logs for insert to authenticated with check ((select auth.uid())=owner_id);
create policy "dose update own" on public.care_dose_logs for update to authenticated using ((select auth.uid())=owner_id) with check ((select auth.uid())=owner_id);
create policy "dose delete own" on public.care_dose_logs for delete to authenticated using ((select auth.uid())=owner_id);
-- Users may see only their own role. No client writes to roles.
create policy "role read own" on public.care_roles for select to authenticated using ((select auth.uid())=user_id);
-- Reviews are intentionally not auto-created from scan results; patient must explicitly submit a summary.
create policy "reviews read submitter or pharmacist" on public.pharmacist_reviews for select to authenticated using (
 (select auth.uid())=submitted_by or exists (
  select 1 from public.care_roles cr where cr.user_id=(select auth.uid()) and cr.role in ('pharmacist','admin')
 )
);
create policy "reviews insert own pending" on public.pharmacist_reviews for insert to authenticated with check ((select auth.uid())=submitted_by and status='pending' and reviewer_notes is null);
-- Only professional accounts may edit review statuses; assignment is done by project owner in SQL Editor.
create policy "reviews pharmacist update" on public.pharmacist_reviews for update to authenticated using (
 exists(select 1 from public.care_roles cr where cr.user_id=(select auth.uid()) and cr.role in ('pharmacist','admin'))
) with check (
 exists(select 1 from public.care_roles cr where cr.user_id=(select auth.uid()) and cr.role in ('pharmacist','admin'))
);
create index if not exists idx_family_owner on public.family_members(owner_id);
create index if not exists idx_reminders_owner on public.care_reminders(owner_id);
create index if not exists idx_dose_owner on public.care_dose_logs(owner_id);
create index if not exists idx_reviews_submitter on public.pharmacist_reviews(submitted_by);
-- IMPORTANT: No public role-registration policy. NEVER grant pharmacist access based on signup form.
-- Demo pharmacist approval (SQL Editor as trusted project admin, after identity/license verification):
-- insert into public.care_roles(user_id,role) values ('VERIFIED_USER_UUID','pharmacist')
-- on conflict (user_id) do update set role='pharmacist';
