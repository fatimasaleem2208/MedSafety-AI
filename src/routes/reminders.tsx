import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { Disclaimer, EmptyState, PageHeader, Panel, SectionLabel, SeverityPill } from "@/components/Bits";
import { MEDICINES } from "@/data/medicines";
import { buildTodaySchedule, useApp, type Reminder } from "@/lib/app-store";

export const Route = createFileRoute("/reminders")({
  head: () => ({
    meta: [
      { title: "Medication Reminders — MedSafety AI" },
      { name: "description", content: "Schedule medication reminders and track taken, skipped and missed doses across the day." },
      { property: "og:title", content: "Medication Reminders — MedSafety AI" },
      { property: "og:description", content: "Today's dose schedule with taken, skip and snooze controls." },
    ],
  }),
  component: RemindersPage,
});

const EMPTY = {
  medicineId: MEDICINES[0]!.id,
  dose: "",
  frequency: "Once daily",
  times: "08:00",
  startDate: new Date().toISOString().slice(0, 10),
  endDate: "",
  food: "any" as Reminder["food"],
  instructions: "",
};

function RemindersPage() {
  const { reminders, doseLog, addReminder, updateReminder, removeReminder, logDose } = useApp();
  const [form, setForm] = useState(EMPTY);
  const [editing, setEditing] = useState<string | null>(null);
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const t = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(t);
  }, []);

  const schedule = useMemo(() => (now ? buildTodaySchedule(reminders, doseLog, now) : []), [reminders, doseLog, now]);

  const buckets = {
    due: schedule.filter((s) => s.status === "due"),
    upcoming: schedule.filter((s) => s.status === "upcoming"),
    completed: schedule.filter((s) => s.status === "taken"),
    missed: schedule.filter((s) => s.status === "missed" || s.status === "skipped"),
  };

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const med = MEDICINES.find((m) => m.id === form.medicineId);
    if (!med) return;
    const times = form.times
      .split(",")
      .map((t) => t.trim())
      .filter((t) => /^\d{2}:\d{2}$/.test(t));
    if (!times.length) {
      toast.error("Add at least one valid time, e.g. 08:00");
      return;
    }
    if (!form.dose.trim()) {
      toast.error("Enter the dose, e.g. 500 mg");
      return;
    }
    const payload = {
      medicineId: med.id,
      medicineName: med.generic,
      dose: form.dose.trim().slice(0, 40),
      frequency: form.frequency,
      times,
      startDate: form.startDate,
      endDate: form.endDate,
      food: form.food,
      instructions: form.instructions.trim().slice(0, 200),
    };
    if (editing) {
      updateReminder(editing, payload);
      toast.success("Reminder updated.");
    } else {
      addReminder(payload);
      toast.success("Reminder added to today's schedule.");
    }
    setForm(EMPTY);
    setEditing(null);
  }

  return (
    <AppShell>
      <PageHeader
        label="Reminders"
        title="Medication Reminders"
        description="Set the medicine, dose, timing and food instructions. Doses appear on today's schedule so nothing is missed."
      />

      <div className="grid lg:grid-cols-12 gap-4">
        <Panel className="lg:col-span-5">
          <SectionLabel>{editing ? "Edit reminder" : "Add medicine"}</SectionLabel>
          <form onSubmit={submit} className="mt-3 space-y-3">
            <div>
              <label htmlFor="med" className="font-mono text-[10px] uppercase tracking-wide text-inksoft">
                Medicine
              </label>
              <select
                id="med"
                value={form.medicineId}
                onChange={(e) => setForm({ ...form, medicineId: e.target.value })}
                className="mt-1 w-full rounded-lg bg-panel2 ring-1 ring-ink/10 px-3 py-2.5 text-sm text-ink outline-none focus:ring-brand/50"
              >
                {MEDICINES.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.generic}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="dose" className="font-mono text-[10px] uppercase tracking-wide text-inksoft">
                  Dose
                </label>
                <input
                  id="dose"
                  value={form.dose}
                  maxLength={40}
                  onChange={(e) => setForm({ ...form, dose: e.target.value })}
                  placeholder="500 mg"
                  className="mt-1 w-full rounded-lg bg-panel2 ring-1 ring-ink/10 px-3 py-2.5 text-sm text-ink outline-none focus:ring-brand/50"
                />
              </div>
              <div>
                <label htmlFor="freq" className="font-mono text-[10px] uppercase tracking-wide text-inksoft">
                  Frequency
                </label>
                <select
                  id="freq"
                  value={form.frequency}
                  onChange={(e) => setForm({ ...form, frequency: e.target.value })}
                  className="mt-1 w-full rounded-lg bg-panel2 ring-1 ring-ink/10 px-3 py-2.5 text-sm text-ink outline-none focus:ring-brand/50"
                >
                  {["Once daily", "Twice daily", "Three times daily", "Every other day", "As needed (PRN)"].map((f) => (
                    <option key={f}>{f}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="times" className="font-mono text-[10px] uppercase tracking-wide text-inksoft">
                Times (24h, comma separated)
              </label>
              <input
                id="times"
                value={form.times}
                maxLength={60}
                onChange={(e) => setForm({ ...form, times: e.target.value })}
                placeholder="08:00, 20:00"
                className="mt-1 w-full rounded-lg bg-panel2 ring-1 ring-ink/10 px-3 py-2.5 text-sm text-ink outline-none focus:ring-brand/50"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="start" className="font-mono text-[10px] uppercase tracking-wide text-inksoft">
                  Start date
                </label>
                <input
                  id="start"
                  type="date"
                  value={form.startDate}
                  onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                  className="mt-1 w-full rounded-lg bg-panel2 ring-1 ring-ink/10 px-3 py-2.5 text-sm text-ink outline-none focus:ring-brand/50"
                />
              </div>
              <div>
                <label htmlFor="end" className="font-mono text-[10px] uppercase tracking-wide text-inksoft">
                  End date
                </label>
                <input
                  id="end"
                  type="date"
                  value={form.endDate}
                  onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                  className="mt-1 w-full rounded-lg bg-panel2 ring-1 ring-ink/10 px-3 py-2.5 text-sm text-ink outline-none focus:ring-brand/50"
                />
              </div>
            </div>

            <div>
              <span className="font-mono text-[10px] uppercase tracking-wide text-inksoft">Food</span>
              <div className="mt-1 flex gap-1.5">
                {(["before", "after", "any"] as const).map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setForm({ ...form, food: f })}
                    className={`px-3 py-1.5 rounded-md font-mono text-[10px] uppercase tracking-wide ring-1 ${
                      form.food === f ? "bg-brand/15 text-brand ring-brand/30" : "bg-panel2 text-inksoft ring-ink/10"
                    }`}
                  >
                    {f === "any" ? "Any time" : `${f} food`}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label htmlFor="notes" className="font-mono text-[10px] uppercase tracking-wide text-inksoft">
                Special instructions
              </label>
              <textarea
                id="notes"
                value={form.instructions}
                maxLength={200}
                rows={2}
                onChange={(e) => setForm({ ...form, instructions: e.target.value })}
                className="mt-1 w-full rounded-lg bg-panel2 ring-1 ring-ink/10 px-3 py-2.5 text-sm text-ink outline-none focus:ring-brand/50 resize-none"
              />
            </div>

            <div className="flex gap-2">
              <button type="submit" className="px-4 py-2 rounded-md bg-brand text-seam text-sm font-medium hover:bg-brand/90">
                {editing ? "Save changes" : "Add reminder"}
              </button>
              {editing && (
                <button
                  type="button"
                  onClick={() => {
                    setEditing(null);
                    setForm(EMPTY);
                  }}
                  className="px-4 py-2 rounded-md ring-1 ring-ink/15 text-inksoft text-sm hover:text-ink"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </Panel>

        <div className="lg:col-span-7 space-y-4">
          <Panel>
            <SectionLabel>Today&apos;s schedule</SectionLabel>
            {schedule.length === 0 ? (
              <p className="font-mono text-[11px] text-inksoft py-6 text-center">Loading schedule…</p>
            ) : (
              <div className="mt-3 space-y-4">
                {(
                  [
                    ["Due now", buckets.due],
                    ["Upcoming", buckets.upcoming],
                    ["Completed", buckets.completed],
                    ["Missed / skipped", buckets.missed],
                  ] as const
                ).map(([label, items]) =>
                  items.length === 0 ? null : (
                    <div key={label}>
                      <p className="font-mono text-[10px] uppercase tracking-wide text-inksoft mb-1.5">
                        {label} ({items.length})
                      </p>
                      <div className="space-y-1.5">
                        {items.map((s) => (
                          <div key={s.key} className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-panel2 ring-1 ring-ink/10">
                            <span className="font-mono text-sm text-ink w-14 shrink-0">{s.time}</span>
                            <div className="min-w-0 flex-1">
                              <p className="font-sans text-sm text-ink">
                                {s.reminder.medicineName} {s.reminder.dose}
                              </p>
                              <p className="font-mono text-[10px] text-inksoft">{s.reminder.instructions || s.reminder.frequency}</p>
                            </div>
                            {s.status === "taken" || s.status === "skipped" ? (
                              <SeverityPill severity={s.status === "taken" ? "safe" : "caution"}>
                                {s.status === "taken" ? "Taken" : "Skipped"}
                              </SeverityPill>
                            ) : (
                              <div className="flex gap-1.5">
                                <button
                                  onClick={() => logDose(s.key, "taken")}
                                  className="px-2.5 py-1 rounded-md bg-brand text-seam font-mono text-[10px] uppercase"
                                >
                                  Taken
                                </button>
                                <button
                                  onClick={() => logDose(s.key, "skipped")}
                                  className="px-2.5 py-1 rounded-md ring-1 ring-ink/15 text-inksoft font-mono text-[10px] uppercase"
                                >
                                  Skip
                                </button>
                                <button
                                  onClick={() => {
                                    logDose(s.key, "snoozed");
                                    toast("Snoozed for 15 minutes.");
                                  }}
                                  className="px-2.5 py-1 rounded-md ring-1 ring-ink/15 text-inksoft font-mono text-[10px] uppercase"
                                >
                                  Snooze
                                </button>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ),
                )}
              </div>
            )}
          </Panel>

          <Panel>
            <SectionLabel>All reminders</SectionLabel>
            {reminders.length === 0 ? (
              <div className="mt-3">
                <EmptyState title="No reminders yet." hint="Add a medicine on the left to start your schedule." />
              </div>
            ) : (
              <div className="mt-3 space-y-1.5">
                {reminders.map((r) => (
                  <div key={r.id} className="flex flex-wrap items-center gap-3 px-3 py-2.5 rounded-lg bg-panel2 ring-1 ring-ink/10">
                    <div className="min-w-0 flex-1">
                      <p className="font-sans text-sm text-ink">
                        {r.medicineName} · {r.dose}
                      </p>
                      <p className="font-mono text-[10px] text-inksoft">
                        {r.frequency} · {r.times.join(", ")} ·{" "}
                        {r.food === "any" ? "any time" : `${r.food} food`}
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setEditing(r.id);
                        setForm({
                          medicineId: r.medicineId,
                          dose: r.dose,
                          frequency: r.frequency,
                          times: r.times.join(", "),
                          startDate: r.startDate,
                          endDate: r.endDate,
                          food: r.food,
                          instructions: r.instructions,
                        });
                      }}
                      className="px-2.5 py-1 rounded-md ring-1 ring-ink/15 text-inksoft font-mono text-[10px] uppercase hover:text-ink"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => {
                        removeReminder(r.id);
                        toast.success("Reminder deleted.");
                      }}
                      className="px-2.5 py-1 rounded-md ring-1 ring-ink/15 text-inksoft font-mono text-[10px] uppercase hover:text-risk"
                    >
                      Delete
                    </button>
                  </div>
                ))}
              </div>
            )}
          </Panel>
        </div>
      </div>

      <Disclaimer>
        Reminders are a memory aid only. Never change a dose or stop a medicine based on this app without speaking to your
        prescriber.
      </Disclaimer>
    </AppShell>
  );
}
