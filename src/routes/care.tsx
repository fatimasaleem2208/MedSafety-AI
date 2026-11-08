import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { AppShell } from "@/components/AppShell";
import { supabase } from "@/lib/supabase";
import { useCareSession } from "@/lib/use-care-session";

export const Route = createFileRoute("/care")({ component: CarePage });
type Member = { id: string; full_name: string; relationship: string; birth_year: number | null; allergies: string; notes: string; };
type ReminderRow = { id: string; member_id: string; medicine_name: string; dosage: string; time_of_day: string; instructions: string; active: boolean; };
type DoseRow = { id: string; reminder_id: string; scheduled_date: string; status: "taken" | "skipped"; };
const field = "w-full rounded-lg bg-panel2 ring-1 ring-ink/10 px-3 py-2 text-ink";
const action = "rounded-lg bg-brand text-seam px-4 py-2 text-sm disabled:opacity-50";
function CarePage() {
  const { user, loading, configured } = useCareSession();
  const [members, setMembers] = useState<Member[]>([]);
  const [reminders, setReminders] = useState<ReminderRow[]>([]);
  const [doseLogs, setDoseLogs] = useState<DoseRow[]>([]);
  const [name, setName] = useState(""); const [relation, setRelation] = useState("Self");
  const [year, setYear] = useState(""); const [allergies, setAllergies] = useState("");
  const [memberId, setMemberId] = useState(""); const [medicine, setMedicine] = useState("");
  const [dosage, setDosage] = useState(""); const [time, setTime] = useState("08:00");
  const [permission, setPermission] = useState("default");
  const [reviewText, setReviewText] = useState(""); const [reviewFlags, setReviewFlags] = useState("");
  const [reviewConsent, setReviewConsent] = useState(false);
  const [error, setError] = useState(""); const [busy, setBusy] = useState(false);
  const today = new Date().toLocaleDateString("en-CA");
  async function refresh() {
    if (!supabase || !user) return;
    const [m, r, d] = await Promise.all([
      supabase.from("family_members").select("id,full_name,relationship,birth_year,allergies,notes").order("created_at"),
      supabase.from("care_reminders").select("id,member_id,medicine_name,dosage,time_of_day,instructions,active").order("time_of_day"),
      supabase.from("care_dose_logs").select("id,reminder_id,scheduled_date,status").eq("scheduled_date",today),
    ]);
    if (m.error || r.error || d.error) { setError(m.error?.message || r.error?.message || d.error?.message || "Unable to load records"); return; }
    setError(""); setMembers(m.data ?? []); setReminders(r.data ?? []); setDoseLogs(d.data ?? []);
    setMemberId(v=>v || m.data?.[0]?.id || "");
  }
  useEffect(()=>{ if(user) void refresh(); },[user?.id]);
  async function addMember(e:FormEvent) {
    e.preventDefault(); if(!supabase || !user) return;
    setBusy(true);
    const {error:err}=await supabase.from("family_members").insert({owner_id:user.id,full_name:name.trim(),relationship:relation,birth_year:year?Number(year):null,allergies:allergies.trim(),notes:""});
    setBusy(false); if(err) {setError(err.message);return;} setName("");setYear("");setAllergies("");void refresh();
  }
  async function addReminder(e:FormEvent) {
    e.preventDefault(); if(!supabase || !user || !memberId) return;
    setBusy(true);
    const {error:err}=await supabase.from("care_reminders").insert({owner_id:user.id,member_id:memberId,medicine_name:medicine.trim(),dosage:dosage.trim(),time_of_day:time,instructions:"",active:true});
    setBusy(false); if(err){setError(err.message);return;} setMedicine("");setDosage("");void refresh();
  }
  async function mark(reminderId:string,status:"taken"|"skipped") {
    if(!supabase || !user) return;
    const {error:err}=await supabase.from("care_dose_logs").upsert({owner_id:user.id,reminder_id:reminderId,scheduled_date:today,status},{onConflict:"reminder_id,scheduled_date"});
    if(err) setError(err.message); else void refresh();
  }
  async function stop(id:string) { if(!supabase) return; const {error:err}=await supabase.from("care_reminders").update({active:false}).eq("id",id); if(err)setError(err.message); else void refresh(); }
  async function submitReview(e:FormEvent) {
    e.preventDefault(); if(!supabase || !user || !reviewConsent) return;
    setBusy(true);
    const {error:err}=await supabase.from("pharmacist_reviews").insert({submitted_by:user.id,medication_summary:reviewText.trim(),risk_flags:reviewFlags.trim(),status:"pending"});
    setBusy(false); if(err){setError(err.message);return;}
    setReviewText("");setReviewFlags("");setReviewConsent(false);setError("");
    alert("Review request submitted. Do not use this feature for emergencies.");
  }
  async function notify() { if(typeof Notification==="undefined") return setPermission("unsupported"); const p=await Notification.requestPermission(); setPermission(p); }
  useEffect(()=>{
    if(!user || typeof Notification==="undefined" || Notification.permission!=="granted") return;
    const notified=new Set<string>();
    const check=()=>{const clock=new Date().toTimeString().slice(0,5); for(const r of reminders.filter(x=>x.active)) {const key=r.id+today; if(r.time_of_day.slice(0,5)===clock && !notified.has(key) && !doseLogs.some(d=>d.reminder_id===r.id)){new Notification("Medicine reminder",{body:`${r.medicine_name} — ${r.dosage}`});notified.add(key);}}};
    check();const timer=setInterval(check,30000);return()=>clearInterval(timer);
  },[reminders,doseLogs,user?.id,today]);
  return <AppShell><div className="space-y-6">
    <div><h1 className="text-3xl font-semibold text-ink">Family Health Tree & Reminders</h1><p className="text-inksoft mt-2">Cloud-backed care workspace for your account. Only use fictional data during testing.</p></div>
    {!configured ? <p className="text-risk">Add the Supabase URL and publishable key to .env.local, then restart.</p> : loading ? <p>Checking session…</p> : !user ? <div className="rounded-lg bg-panel p-5"><p className="mb-3">Sign in to access your private family records.</p><Link to="/auth" className={action}>Sign in</Link></div> : <>
    <p className="text-xs text-inksoft">Signed in as {user.email} · <button className="underline" onClick={()=>void supabase?.auth.signOut()}>Sign out</button></p>
    {error && <div role="alert" className="rounded-lg p-3 bg-risk/10 text-risk">{error}</div>}
    <div className="grid lg:grid-cols-2 gap-5">
      <section className="rounded-xl bg-panel ring-1 ring-ink/10 p-5 space-y-4"><h2 className="text-xl font-semibold">Family members</h2>
        {members.length===0 ? <p className="text-inksoft text-sm">Add a fictional family member to begin.</p>:<ul className="space-y-2">{members.map(m=><li key={m.id} className="rounded-lg bg-panel2 p-3"><b>{m.full_name}</b> · {m.relationship}{m.birth_year?` · Born ${m.birth_year}`:""}<p className="text-xs text-inksoft">Allergies: {m.allergies||"Not recorded"}</p></li>)}</ul>}
        <form onSubmit={addMember} className="space-y-2"><h3 className="font-semibold">Add family member</h3><input required maxLength={100} className={field} placeholder="Name" value={name} onChange={e=>setName(e.target.value)}/><select className={field} value={relation} onChange={e=>setRelation(e.target.value)}>{["Self","Parent","Child","Grandparent","Spouse","Sibling","Other"].map(x=><option key={x}>{x}</option>)}</select><input type="number" min="1900" max="2100" className={field} placeholder="Birth year (optional)" value={year} onChange={e=>setYear(e.target.value)}/><input className={field} maxLength={500} placeholder="Allergies (optional)" value={allergies} onChange={e=>setAllergies(e.target.value)}/><button disabled={busy} className={action}>Save family member</button></form>
      </section>
      <section className="rounded-xl bg-panel ring-1 ring-ink/10 p-5 space-y-4"><h2 className="text-xl font-semibold">Medication schedule</h2><p className="text-xs text-inksoft">Browser notifications work only while this page remains open and Chrome permits notifications. Not a medical-grade alarm.</p><button type="button" className="rounded-lg border border-ink/20 p-2" onClick={()=>void notify()}>Enable Chrome notifications</button>{permission!=="default"&&<span className="text-sm ml-2">{permission}</span>}
        <form className="space-y-2" onSubmit={addReminder}><select required className={field} value={memberId} onChange={e=>setMemberId(e.target.value)}><option value="">Choose family member</option>{members.map(m=><option key={m.id} value={m.id}>{m.full_name}</option>)}</select><input required maxLength={140} className={field} placeholder="Medicine name" value={medicine} onChange={e=>setMedicine(e.target.value)}/><input required maxLength={80} className={field} placeholder="Dose (e.g. 500 mg)" value={dosage} onChange={e=>setDosage(e.target.value)}/><input type="time" className={field} value={time} onChange={e=>setTime(e.target.value)} required/><button className={action} disabled={busy||!memberId}>Save reminder</button></form>
        <h3 className="font-semibold">Today ({today})</h3><ul className="space-y-3">{reminders.filter(r=>r.active).map(r=>{const log=doseLogs.find(d=>d.reminder_id===r.id);return <li key={r.id} className="rounded-lg bg-panel2 p-3 space-y-2"><p className="font-medium">{r.time_of_day.slice(0,5)} · {r.medicine_name} — {r.dosage}</p><p className="text-xs text-inksoft">{members.find(m=>m.id===r.member_id)?.full_name} · {log ? `Marked ${log.status}` : "Not logged"}</p><div className="flex flex-wrap gap-2"><button type="button" className="text-sm underline" onClick={()=>void mark(r.id,"taken")}>Taken</button><button type="button" className="text-sm underline" onClick={()=>void mark(r.id,"skipped")}>Skipped</button><button type="button" className="text-sm underline text-risk" onClick={()=>void stop(r.id)}>Deactivate</button></div></li>})}</ul>
      </section>
    </div>
    <section className="rounded-xl bg-panel ring-1 ring-ink/10 p-5 space-y-3">
      <h2 className="text-xl font-semibold">Request a pharmacist review</h2>
      <p className="text-sm text-inksoft">Only share a short fictional medication summary for testing. This is not an emergency or live clinical consultation.</p>
      <form onSubmit={submitReview} className="space-y-2 max-w-2xl">
        <textarea className={field} rows={3} minLength={2} maxLength={4000} required value={reviewText} onChange={e=>setReviewText(e.target.value)} placeholder="Medicine names and doses (fictional test data)"/>
        <textarea className={field} rows={2} maxLength={4000} value={reviewFlags} onChange={e=>setReviewFlags(e.target.value)} placeholder="Interaction or allergy concerns"/>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={reviewConsent} onChange={e=>setReviewConsent(e.target.checked)}/> I choose to submit this summary for pharmacist review.</label>
        <button disabled={busy||!reviewConsent} className={action}>Submit review request</button>
      </form>
    </section></>}
  </div></AppShell>;
}
