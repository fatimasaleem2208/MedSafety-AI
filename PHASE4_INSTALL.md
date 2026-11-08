# MedSafety AI Phase 4: navigation, settings, pharmacist onboarding

This ZIP contains **only changed or new files**. Install into your existing working MedSafety-AI folder, where `package.json` resides. Back up your project first.

1. Extract the ZIP. Copy the extracted `MedSafety-AI/src` folder **into your existing MedSafety-AI directory**, merging folders and replacing only matching files. Don't replace `.env.local`, `package.json`, or your Gemini/scanner code.
2. Open Supabase Dashboard > SQL Editor > New query. Paste and run `PHASE4_PHARMACIST_APPLICATIONS.sql` from the ZIP. **Do not rerun the Phase 3 SQL.**
3. Stop the current terminal (Ctrl+C), then `npm run dev` from the actual project folder.
4. Confirm About/Safety are gone from navigation; Profile & settings opens `/profile` and supports updating name/password and Chrome notification permission.
5. Open `/pharmacist`. Non-pharmacists see an **Apply as a pharmacist** link leading to `/pharmacist-access`.
6. A professional signs up with the normal `/auth` route, then submits licence details through `/pharmacist-access` (one application per user).
7. A trusted Supabase project admin independently checks registration credentials, then uses the *commented* SQL examples in the migration to approve and grant `care_roles.role='pharmacist'`. Only approved accounts can access review requests.

**Security:** The application form never grants pharmacist access. RLS prevents one user reading other applicants' forms. The browser only uses the publishable key, never the service-role/secret key. The dashboard uses both UI checks and existing database RLS. Do not use real patient data in this development project; independently verify all SQL policies and access paths before production.

**Note:** We intentionally removed About and Safety menu links, rather than creating their pages, as requested. Profile & settings now has its own route.
