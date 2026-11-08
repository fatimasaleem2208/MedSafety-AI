import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { supabase } from "@/lib/supabase";
import { useCareSession } from "@/lib/use-care-session";
import { Logo } from "@/components/Bits";

export const Route = createFileRoute("/auth")({ component: AuthPage });
function AuthPage() {
  const navigate = useNavigate();
  const { user } = useCareSession();
  const [signup, setSignup] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!supabase) return;
    setBusy(true); setMessage("");
    const result = signup
      ? await supabase.auth.signUp({ email: email.trim(), password, options: { data: { full_name: name.trim() } } })
      : await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setBusy(false);
    if (result.error) { setMessage(result.error.message); return; }
    if (signup && !result.data.session) {
      setMessage("Check your email for the confirmation link, then sign in."); return;
    }
    void navigate({ to: "/care" });
  }
  return <div className="min-h-screen bg-background flex items-center justify-center p-6"><div className="w-full max-w-md rounded-2xl bg-panel ring-1 ring-ink/10 p-7 space-y-5">
    <Logo />
    <h1 className="text-2xl font-semibold text-ink">{signup ? "Create a secure account" : "Sign in to MedSafety AI"}</h1>
    {!supabase ? <p className="text-risk">Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY in .env.local and restart.</p>
      : user ? <div className="space-y-3"><p className="text-ink">Signed in as {user.email}</p><a className="text-brand underline" href="/care">Open family care workspace</a></div> :
      <form className="space-y-3" onSubmit={submit}>
        {signup && <label className="block text-sm text-ink">Name<input className="mt-1 w-full bg-panel2 p-3 rounded-lg" required minLength={2} value={name} onChange={e=>setName(e.target.value)} /></label>}
        <label className="block text-sm text-ink">Email<input type="email" required autoComplete="email" className="mt-1 w-full bg-panel2 p-3 rounded-lg" value={email} onChange={e=>setEmail(e.target.value)} /></label>
        <label className="block text-sm text-ink">Password<input type="password" required minLength={8} autoComplete={signup ? "new-password" : "current-password"} className="mt-1 w-full bg-panel2 p-3 rounded-lg" value={password} onChange={e=>setPassword(e.target.value)} /></label>
        {message && <p role="alert" className="text-sm text-caution">{message}</p>}
        <button disabled={busy} className="w-full rounded-lg bg-brand text-seam p-3 disabled:opacity-50">{busy ? "Please wait…" : signup ? "Sign up" : "Sign in"}</button>
        <button type="button" className="w-full text-sm text-brand" onClick={()=>{setSignup(!signup);setMessage("");}}>{signup ? "Already have an account? Sign in" : "Need an account? Sign up"}</button>
      </form>}
    <p className="text-xs text-inksoft">Development environment: use fictional health records until security and clinical reviews are complete.</p>
  </div></div>;
}
