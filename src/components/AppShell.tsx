import { Link, useNavigate } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import { Logo } from "./Bits";
import { useApp } from "@/lib/app-store";
import { useCareSession } from "@/lib/use-care-session";
import { supabase } from "@/lib/supabase";

const NAV = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/medicines", label: "Medicine A–Z" },
  { to: "/interactions", label: "Interactions" },
  { to: "/prescription", label: "Prescription" },
  { to: "/lab-reports", label: "Lab Reports" },
  { to: "/reminders", label: "Reminders" },
  { to: "/care", label: "Family Care" },
  { to: "/pharmacist", label: "Pharmacist" },
  { to: "/assistant", label: "AI Assistant" },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const { profile, signOut } = useApp();
  const { user } = useCareSession();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const initial = (user?.user_metadata?.full_name || user?.email || "M").trim().charAt(0).toUpperCase() || "M";

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b border-ink/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center gap-6">
          <Logo />
          <nav className="hidden xl:flex items-center gap-0.5 flex-1">
            {NAV.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="px-2.5 py-1.5 rounded-md text-sm font-medium text-inksoft hover:text-ink transition-colors"
                activeProps={{ className: "px-2.5 py-1.5 rounded-md text-sm font-medium text-ink bg-panel ring-1 ring-ink/10" }}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-2">
            <div className="relative">
              <button
                onClick={() => setOpen((v) => !v)}
                className="size-9 grid place-items-center rounded-lg bg-panel2 ring-1 ring-ink/10 font-sans text-sm text-ink font-medium hover:ring-brand/40 transition-colors"
                aria-label="Profile and settings"
              >
                {initial}
              </button>
              {open && (
                <div className="absolute right-0 mt-2 w-52 rounded-lg bg-panel ring-1 ring-ink/10 p-1.5 shadow-xl">
                  <p className="px-2.5 py-2 font-mono text-[10px] uppercase tracking-[0.18em] text-inksoft">{user ? `Signed in: ${user.email}` : "Not signed in"}</p>
                  <Link to="/profile" onClick={() => setOpen(false)} className="block px-2.5 py-2 rounded-md text-sm text-ink hover:bg-panel2">
                    Profile & settings
                  </Link>
                  <Link to="/pharmacist" onClick={() => setOpen(false)} className="block px-2.5 py-2 rounded-md text-sm text-ink hover:bg-panel2">
                    Pharmacist dashboard
                  </Link>

                  <button
                    onClick={() => {
                      setOpen(false);
                      signOut();
                      void supabase?.auth.signOut();
                      navigate({ to: "/" });
                    }}
                    className="w-full text-left px-2.5 py-2 rounded-md text-sm text-inksoft hover:bg-panel2 hover:text-ink"
                  >
                    {user ? "Sign out" : "Back to landing"}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="xl:hidden border-t border-ink/10 overflow-x-auto">
          <div className="flex items-center gap-1 px-4 py-2 min-w-max">
            {NAV.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="px-2.5 py-1 rounded-md text-xs font-medium text-inksoft whitespace-nowrap"
                activeProps={{ className: "px-2.5 py-1 rounded-md text-xs font-medium text-ink bg-panel ring-1 ring-ink/10 whitespace-nowrap" }}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">{children}</main>

      <footer className="border-t border-ink/10 mt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 flex flex-wrap items-center justify-between gap-3">
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-inksoft">MedSafety AI · Smart Medication Safety for Everyone</p>
          <p className="font-mono text-[10px] text-inksoft/70 max-w-[60ch]">
            Educational information only — not a diagnosis. Always verify with a qualified healthcare professional.
          </p>
        </div>
      </footer>
    </div>
  );
}
