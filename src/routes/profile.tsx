import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { AppShell } from "@/components/AppShell";
import { useCareSession } from "@/lib/use-care-session";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/profile")({ component: ProfilePage });

function ProfilePage() {
  const { user, loading } = useCareSession();
  const navigate = useNavigate();
  const [name, setName] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [notificationState, setNotificationState] = useState("");

  async function saveName(e: FormEvent) {
    e.preventDefault();
    if (!supabase || !user) return;
    const value = (name ?? user.user_metadata?.full_name ?? "").trim();
    if (value.length < 2 || value.length > 100) { setNotice("Name must be between 2 and 100 characters."); return; }
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ data: { full_name: value } });
    setBusy(false);
    setNotice(error ? error.message : "Name saved. Refresh the page to see it in the menu.");
  }
  async function changePassword(e: FormEvent) {
    e.preventDefault();
    if (!supabase || !user || password.length < 8) return;
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    setPassword("");
    setNotice(error ? error.message : "Password updated. Supabase may require additional verification.");
  }
  async function enableAlerts() {
    if (typeof window === "undefined" || !("Notification" in window)) {
      setNotificationState("Notifications aren't supported in this browser."); return;
    }
    const result = await Notification.requestPermission();
    setNotificationState(result === "granted" ? "Notifications allowed. Reminders still require an open browser tab." : "Notifications not allowed. Review Chrome site permissions.");
  }
  async function exit() {
    await supabase?.auth.signOut();
    void navigate({ to: "/auth" });
  }
  return <AppShell><div className="mx-auto max-w-2xl space-y-6">
    <header><h1 className="text-3xl font-semibold">Profile & settings</h1><p className="text-inksoft">Manage your MedSafety AI account and browser preferences.</p></header>
    {loading ? <p>Checking your account…</p> : !user ? <section className="rounded-xl bg-panel p-6"><p>Sign in to view your profile and settings.</p><Link className="text-brand underline" to="/auth">Sign in or create an account</Link></section> : <>
      <section className="rounded-xl bg-panel p-6 space-y-4"><h2 className="text-xl font-semibold">Account</h2><p className="text-sm">Email: <strong>{user.email}</strong></p><p className="text-xs text-inksoft">Your email is managed by Supabase authentication.</p><form onSubmit={saveName} className="space-y-3"><label className="block text-sm">Display name<input className="mt-1 block w-full rounded-lg bg-panel2 p-3" value={name ?? (user.user_metadata?.full_name ?? "")} onChange={e=>setName(e.target.value)} maxLength={100} required /></label><button disabled={busy} className="rounded-lg bg-brand px-4 py-2 text-seam disabled:opacity-50">Save name</button></form></section>
      <section className="rounded-xl bg-panel p-6 space-y-3"><h2 className="text-xl font-semibold">Password</h2><form onSubmit={changePassword} className="space-y-3"><label className="block text-sm">New password<input type="password" minLength={8} required autoComplete="new-password" className="mt-1 block w-full rounded-lg bg-panel2 p-3" value={password} onChange={e=>setPassword(e.target.value)} /></label><button disabled={busy} className="rounded-lg border border-ink/20 px-4 py-2">Change password</button></form></section>
      <section className="rounded-xl bg-panel p-6 space-y-3"><h2 className="text-xl font-semibold">Notifications</h2><p className="text-sm text-inksoft">Allow Chrome notifications for medication reminders. Browser-only reminders do not run when the browser or laptop is closed.</p><button onClick={()=>void enableAlerts()} className="rounded-lg border border-ink/20 px-4 py-2">Request notification permission</button>{notificationState && <p role="status" className="text-sm">{notificationState}</p>}</section>
      <section className="rounded-xl bg-panel p-6 space-y-3"><h2 className="text-xl font-semibold">Privacy and sessions</h2><p className="text-sm text-inksoft">Use fictional health information while this application is being tested. Signing out clears your Supabase session on this device; it does not delete stored records.</p><button onClick={()=>void exit()} className="rounded-lg border border-ink/20 px-4 py-2">Sign out</button></section>
      {notice && <p role="status" className="rounded-lg bg-panel p-3 text-sm">{notice}</p>}
    </>}
  </div></AppShell>;
}
