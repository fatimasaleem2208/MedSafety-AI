import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { AppShell } from "@/components/AppShell";
import { supabase } from "@/lib/supabase";
import { useCareSession } from "@/lib/use-care-session";

export const Route = createFileRoute("/pharmacist-access")({ component: PharmacistAccess });

type Application = { id: string; status: string; created_at: string; reviewer_message: string | null };
function PharmacistAccess() {
  const { user, loading } = useCareSession();
  const [fullName, setFullName] = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");
  const [registrationAuthority, setRegistrationAuthority] = useState("");
  const [workplace, setWorkplace] = useState("");
  const [professionalEmail, setProfessionalEmail] = useState("");
  const [application, setApplication] = useState<Application | null>(null);
  const [role, setRole] = useState("patient");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [fetched, setFetched] = useState(false);
  useEffect(() => {
    if (!supabase || !user) { setFetched(false); return; }
    let valid = true;
    void Promise.all([
      supabase.from("pharmacist_applications").select("id,status,created_at,reviewer_message").eq("user_id",user.id).order("created_at",{ascending:false}).limit(1).maybeSingle(),
      supabase.from("care_roles").select("role").eq("user_id",user.id).maybeSingle()
    ]).then(([a,r])=>{if (!valid) return; if (a.error) setError(a.error.message); else setApplication(a.data); if (r.error) setError(r.error.message); else setRole(r.data?.role ?? "patient"); setFetched(true);});
    return ()=>{ valid=false; };
  }, [user?.id]);
  async function submit(e: FormEvent) {
    e.preventDefault(); if (!user || !supabase) return;
    setBusy(true); setError("");
    const { data, error: err } = await supabase.from("pharmacist_applications").insert({ user_id:user.id, full_name:fullName.trim(), license_number:licenseNumber.trim(), registration_authority:registrationAuthority.trim(), workplace:workplace.trim(), professional_email:professionalEmail.trim(), status:"pending" }).select("id,status,created_at,reviewer_message").single();
    setBusy(false); if (err) setError(err.message); else setApplication(data);
  }
  return <AppShell><div className="max-w-2xl mx-auto space-y-5"><h1 className="text-3xl font-semibold">Pharmacist professional access</h1><p className="text-inksoft">Licensed pharmacists can create an account, submit their professional details, and wait for administrator verification before accessing patient review requests.</p>
    {loading ? <p>Checking account…</p> : !user ? <section className="rounded-xl bg-panel p-6 space-y-3"><h2 className="text-xl font-semibold">Step 1 — Create or sign in to your account</h2><p>Use the same secure MedSafety AI email/password login as patients. After signing in, return here to apply.</p><Link to="/auth" className="inline-block rounded-lg bg-brand px-4 py-2 text-seam">Sign in / Sign up</Link></section> : <>
      <section className="rounded-xl bg-panel p-6 space-y-3"><p className="text-sm">Signed in as <strong>{user.email}</strong></p>{(role==="pharmacist" || role==="admin") ? <><p className="text-sm">Your professional account is approved.</p><Link to="/pharmacist" className="text-brand underline">Open pharmacist dashboard</Link></> : !fetched ? <p>Checking approval…</p> : application ? <><h2 className="text-xl font-semibold">Application: {application.status}</h2><p className="text-sm">Submitted {new Date(application.created_at).toLocaleDateString()}.</p><p className="text-sm text-inksoft">An administrator must verify your professional registration before granting access. You cannot approve your own application.</p>{application.reviewer_message && <p className="text-sm">Administrator note: {application.reviewer_message}</p>}</> : <><h2 className="text-xl font-semibold">Step 2 — Request pharmacist verification</h2><form onSubmit={submit} className="space-y-3">
        <label className="block text-sm">Full legal name<input required maxLength={120} className="mt-1 w-full bg-panel2 rounded-lg p-3" value={fullName} onChange={e=>setFullName(e.target.value)}/></label>
        <label className="block text-sm">Pharmacy registration / licence number<input required maxLength={100} className="mt-1 w-full bg-panel2 rounded-lg p-3" value={licenseNumber} onChange={e=>setLicenseNumber(e.target.value)}/></label>
        <label className="block text-sm">Registration authority and country<input required maxLength={160} className="mt-1 w-full bg-panel2 rounded-lg p-3" value={registrationAuthority} onChange={e=>setRegistrationAuthority(e.target.value)} placeholder="e.g. Provincial Pharmacy Council, Pakistan"/></label>
        <label className="block text-sm">Workplace / pharmacy<input required maxLength={160} className="mt-1 w-full bg-panel2 rounded-lg p-3" value={workplace} onChange={e=>setWorkplace(e.target.value)}/></label>
        <label className="block text-sm">Professional contact email<input type="email" required maxLength={254} className="mt-1 w-full bg-panel2 rounded-lg p-3" value={professionalEmail} onChange={e=>setProfessionalEmail(e.target.value)}/></label>
        <p className="text-xs text-inksoft">Do not upload identity documents or patient data here. Verification is carried out outside this demo through the professional licensing authority.</p><button disabled={busy} className="rounded-lg bg-brand px-4 py-2 text-seam disabled:opacity-50">{busy?"Submitting…":"Submit verification request"}</button></form></> }</section>
    </>}{error && <p role="alert" className="rounded-lg bg-panel p-3 text-risk">{error} {error.includes("relation") || error.includes("schema") ? "Run PHASE4_PHARMACIST_APPLICATIONS.sql in Supabase SQL Editor first." : ""}</p>}
    <p className="text-xs text-inksoft">This is a test workflow, not a clinical credential verification service. Access is granted only after independent verification by a trusted administrator.</p>
  </div></AppShell>;
}
