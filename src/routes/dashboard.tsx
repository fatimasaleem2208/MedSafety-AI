import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Panel, SectionLabel, SeverityPill, Disclaimer } from "@/components/Bits";
import { buildTodaySchedule, useApp } from "@/lib/app-store";
import { buildSafetyAlerts } from "@/lib/safety";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — MedSafety AI" },
      { name: "description", content: "Your medication overview, today's doses, and safety summary in one console." },
      { property: "og:title", content: "Dashboard — MedSafety AI" },
      { property: "og:description", content: "Your medication overview, today's doses, and safety summary." },
    ],
  }),
  component: Dashboard,
});

const QUICK = [
  { n: "01", title: "Search Medicine", meta: "A–Z database", to: "/medicines" },
  { n: "02", title: "Check Interaction", meta: "Pairwise + multi", to: "/interactions" },
  { n: "03", title: "Upload Prescription", meta: "JPG · PNG · PDF", to: "/prescription" },
  { n: "04", title: "Analyze Lab Report", meta: "Reference ranges", to: "/lab-reports" },
  { n: "05", title: "Ask AI Assistant", meta: "Grounded answers", to: "/assistant" },
  { n: "06", title: "Set Reminder", meta: "Dose schedule", to: "/reminders" },
] as const;

function Dashboard() {
  const { profile, reminders, doseLog, logDose } = useApp();
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const t = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(t);
  }, []);

  const schedule = useMemo(() => (now ? buildTodaySchedule(reminders, doseLog, now) : []), [reminders, doseLog, now]);
  const alerts = useMemo(() => buildSafetyAlerts(reminders, profile.allergies, schedule), [reminders, profile.allergies, schedule]);

  const counts = {
    taken: schedule.filter((s) => s.status === "taken").length,
    upcoming: schedule.filter((s) => s.status === "upcoming").length,
    missed: schedule.filter((s) => s.status === "missed").length,
    due: schedule.filter((s) => s.status === "due").length,
  };

  return (
    <AppShell>
      <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
        <div>
          <SectionLabel>{profile.role === "patient" ? "Patient console" : "Professional console"}</SectionLabel>
          <h1 className="font-sans text-ink text-2xl sm:text-3xl font-semibold tracking-tight mt-1.5">
            Welcome back, {profile.name.split(" ")[0]}
          </h1>
          <p className="font-sans text-sm text-inksoft mt-1.5">Manage your medicines and stay informed about your treatment.</p>
        </div>
        <div className="flex items-center gap-2 font-mono text-[11px] text-inksoft">
          <span className="px-2.5 py-1.5 rounded-md bg-panel ring-1 ring-ink/10">{reminders.length} active medications</span>
        </div>
      </div>

      <div className="grid lg:grid-cols-12 gap-4">
        <div className="lg:col-span-8 space-y-4">
          <Panel>
            <SectionLabel>Quick actions</SectionLabel>
            <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-3 mt-3">
              {QUICK.map((q) => (
                <Link
                  key={q.n}
                  to={q.to}
                  className="rounded-lg bg-panel2 ring-1 ring-ink/10 p-4 hover:ring-brand/40 transition-colors block"
                >
                  <span className="font-mono text-[11px] text-brand">{q.n}</span>
                  <p className="font-sans text-ink font-medium mt-2 text-[15px]">{q.title}</p>
                  <p className="font-mono text-[10px] text-inksoft mt-0.5">{q.meta}</p>
                </Link>
              ))}
            </div>
          </Panel>

          <Panel>
            <div className="flex items-center justify-between mb-3">
              <SectionLabel>Today&apos;s dose schedule</SectionLabel>
              <span className="font-mono text-[11px] text-inksoft">
                {counts.taken} taken · {counts.due} due · {counts.upcoming} upcoming · {counts.missed} missed
              </span>
            </div>
            {schedule.length === 0 ? (
              <p className="font-mono text-[11px] text-inksoft py-6 text-center">Loading today&apos;s schedule…</p>
            ) : (
              <div className="divide-y divide-ink/10">
                {schedule.map((s) => (
                  <div key={s.key} className="flex items-center gap-4 py-3">
                    <span className={`font-mono text-sm w-16 shrink-0 ${s.status === "missed" ? "text-risk" : "text-ink"}`}>{s.time}</span>
                    <div className="min-w-0 flex-1">
                      <p className="font-sans text-sm text-ink font-medium">
                        {s.reminder.medicineName} {s.reminder.dose}
                      </p>
                      <p className="font-mono text-[10px] text-inksoft">
                        {s.reminder.food === "after" ? "After food" : s.reminder.food === "before" ? "Before food" : "Any time"} ·{" "}
                        {s.reminder.frequency}
                      </p>
                    </div>
                    {s.status === "due" || s.status === "missed" ? (
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => logDose(s.key, "taken")}
                          className="px-2.5 py-1 rounded-md bg-brand text-seam font-mono text-[10px] uppercase tracking-wide"
                        >
                          Taken
                        </button>
                        <button
                          onClick={() => logDose(s.key, "skipped")}
                          className="px-2.5 py-1 rounded-md ring-1 ring-ink/15 text-inksoft font-mono text-[10px] uppercase tracking-wide"
                        >
                          Skip
                        </button>
                      </div>
                    ) : (
                      <SeverityPill severity={s.status === "taken" ? "safe" : s.status === "skipped" ? "caution" : "none"}>
                        {s.status === "taken" ? "Taken" : s.status === "skipped" ? "Skipped" : s.status === "snoozed" ? "Snoozed" : "Upcoming"}
                      </SeverityPill>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Panel>
        </div>

        <div className="lg:col-span-4 space-y-4">
          <Panel>
            <div className="flex items-center justify-between mb-3">
              <SectionLabel>Safety summary</SectionLabel>
              <Link to="/safety" className="font-mono text-[10px] text-brand hover:underline">
                Open safety center
              </Link>
            </div>
            <div className="space-y-2">
              {alerts.slice(0, 4).map((a) => (
                <div
                  key={a.id}
                  className={`flex items-start gap-3 p-3 rounded-lg bg-background ring-1 ${
                    a.level === "risk" ? "ring-risk/25" : a.level === "caution" ? "ring-caution/20" : "ring-safe/20"
                  }`}
                >
                  <span
                    className={`size-2 rounded-full shrink-0 mt-1.5 ${
                      a.level === "risk" ? "bg-risk" : a.level === "caution" ? "bg-caution" : "bg-safe"
                    }`}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-sans text-sm text-ink">{a.title}</p>
                    <p className="font-mono text-[10px] text-inksoft mt-0.5">{a.detail}</p>
                  </div>
                  <SeverityPill severity={a.level}>
                    {a.level === "risk" ? "High Risk" : a.level === "caution" ? "Caution" : "Safe"}
                  </SeverityPill>
                </div>
              ))}
            </div>
          </Panel>

          <Panel>
            <SectionLabel>Medication overview</SectionLabel>
            <div className="mt-3 space-y-1.5">
              {reminders.map((r) => (
                <Link
                  key={r.id}
                  to="/medicines/$medicineId"
                  params={{ medicineId: r.medicineId }}
                  className="flex items-center justify-between px-3 py-2 rounded-md bg-panel2 ring-1 ring-ink/10 hover:ring-brand/40 transition-colors"
                >
                  <span className="font-sans text-sm text-ink">{r.medicineName}</span>
                  <span className="font-mono text-[10px] text-inksoft">{r.dose}</span>
                </Link>
              ))}
            </div>
          </Panel>
        </div>
      </div>

      <Disclaimer />
    </AppShell>
  );
}
