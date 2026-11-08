# MedSafety AI — Phase 3 (ONLY changed/new files)

## Before you begin
- This ZIP is an **overlay**, not the full project. Make a backup of your WORKING MedSafety AI project first.
- Copy the folders/files from inside `MedSafety-AI/` into your existing MedSafety AI directory, keeping the same relative paths. Merge folders; do not delete unrelated files.
- **This update replaces `src/routes/auth.tsx`** (the previous demo sign-in) and changes `src/components/AppShell.tsx`. Other scanner, Gemini and camera code is untouched.
- Copy `.env.phase3.example` values **into your existing `.env.local`**. Preserve `GEMINI_API_KEY` and your working `GEMINI_MODEL`.

## Create Supabase
1. Go to https://supabase.com/dashboard and create a project. Keep its database password private.
2. Project dashboard -> **SQL Editor** -> New query. Paste the **entire** `PHASE3_SUPABASE.sql`, then Run. Check that all five tables appear in Table Editor.
3. Project dashboard -> **Connect / API Keys** (labels can vary). Copy the **Project URL** and the **publishable key** (or legacy anon key), NOT the `service_role`/secret key.
4. In your existing project root `.env.local`, add:

```dotenv
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=YOUR_PUBLISHABLE_KEY
```

5. In Supabase -> Authentication -> Providers -> Email, enable Email sign-in. Confirm the email validation / confirmation settings and Site URL / redirect URLs for your local site (e.g., http://localhost:8080). For testing, use a real email you control **but fictional health records**.
6. In VS Code, open the directory that contains `package.json` AND `src/routes`, not your Downloads directory. Run `npm install` then `npm run dev`.
7. Open `/auth` to sign up / sign in, `/care` to add fictional family members and medicine reminders, and `/pharmacist` to verify access is denied to ordinary users.

### How pharmacist role approval works
The UI cannot grant professional access. A trusted project administrator verifies credentials out of band and runs this query **manually** in the Supabase SQL Editor, substituting a verified user's UUID from Authentication -> Users:

```sql
insert into public.care_roles(user_id,role)
values ('VERIFIED_USER_UUID','pharmacist')
on conflict (user_id) do update set role='pharmacist';
```

Do not do this for unverified accounts. Log out/in (or reload) to test `/pharmacist` again. Patients may explicitly submit a review request through `/care`. Scanner results are never shared automatically.

### Chrome medication notifications
On `/care`, click **Enable Chrome notifications** and allow access in Chrome. Alerts run only while the page is open, the browser permits notifications, and the computer is awake. They are NOT push messages, background alarms, or reliable clinical medication reminders. Medication entry and taken/skipped history **are** stored in Supabase for logged-in accounts. The older `/reminders` page is unchanged and still uses local browser storage; use `/care` for cloud reminders.

### Security & limitations
- API publishable keys are intended for client access with correctly configured Row Level Security (RLS). **Never** put a Supabase service-role/secret key in `VITE_` variables or frontend code.
- RLS keeps family, reminder and dose records owner-scoped. Pharmacist reviews are separately protected by a trusted database role. Do not add public role-assignment policies.
- This migration has not been run against your actual Supabase account; verify policies with two test accounts (A must not access B's records) before real use.
- Your existing demo `useApp()` profile and old `/reminders` page are NOT automatically migrated to Supabase. The new secure family data lives in `/care`. Legacy pages still contain demo/local storage and are not a secure end-to-end patient system.
- Signup authentication is real but this is not a completed clinical product: no verified professional onboarding flow, encrypted file vault, audit logging, medical-device validation or background reminder service. Do not upload real patient information yet.
- Gemini/Google third-party AI privacy requirements remain separate from Supabase RLS.

### Test checklist
- [ ] Sign up and confirm email, sign in, sign out.
- [ ] Add two fictional family members (e.g., parent and child) and ensure both reappear after refresh.
- [ ] Add a reminder; mark a dose Taken then Skipped; refresh and check persistence.
- [ ] Confirm ordinary users cannot open professional review records.
- [ ] Use a second test account and confirm it cannot see the first account's family members.
- [ ] Test existing Gemini English/Urdu/Roman Urdu, camera, PDF scans, and CSV export.
- [ ] Confirm Chrome notification limitation is understood.

## If `npm run dev` says `src/routes` missing
You're running in the wrong folder. In the terminal `cd` into your original MedSafety AI folder containing `package.json` and `src/routes`.
