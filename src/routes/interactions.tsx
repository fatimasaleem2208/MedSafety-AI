import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Disclaimer, EmptyState, PageHeader, Panel, SectionLabel, SeverityPill, SourceTag } from "@/components/Bits";
import { findInteraction, severityLabel, type Severity } from "@/data/interactions";
import { getMedicine, MEDICINES, searchMedicines } from "@/data/medicines";
import { useApp } from "@/lib/app-store";

export const Route = createFileRoute("/interactions")({
  head: () => ({
    meta: [
      { title: "Drug Interaction Checker — MedSafety AI" },
      { name: "description", content: "Check two or more medicines for moderate and major drug interactions with clinical guidance." },
      { property: "og:title", content: "Drug Interaction Checker — MedSafety AI" },
      { property: "og:description", content: "Categorised interaction results with severity, clinical effect and monitoring advice." },
    ],
  }),
  component: InteractionsPage,
});

type Pair = { a: string; b: string; severity: Severity; description: string; clinicalEffect: string; recommendation: string; monitoring: string };

function InteractionsPage() {
  const { reminders } = useApp();
  const [selected, setSelected] = useState<string[]>([]);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Pair[] | null>(null);

  const suggestions = useMemo(
    () => (query.trim() ? searchMedicines(query).filter((m) => !selected.includes(m.id)).slice(0, 6) : []),
    [query, selected],
  );

  function add(id: string) {
    setSelected((s) => (s.includes(id) ? s : [...s, id]));
    setQuery("");
    setResults(null);
  }

  function check() {
    const pairs: Pair[] = [];
    for (let i = 0; i < selected.length; i++) {
      for (let j = i + 1; j < selected.length; j++) {
        const a = selected[i]!;
        const b = selected[j]!;
        const found = findInteraction(a, b);
        pairs.push({
          a,
          b,
          severity: found?.severity ?? "none",
          description: found?.description ?? "No interaction entry was found in this limited local database. This does NOT establish that the combination is safe.",
          clinicalEffect: found?.clinicalEffect ?? "Not evaluated by this database.",
          recommendation: found?.recommendation ?? "Ask a pharmacist to check a comprehensive and current interaction reference.",
          monitoring: found?.monitoring ?? "Professional review may still be needed.",
        });
      }
    }
    pairs.sort((x, y) => {
      const order: Record<Severity, number> = { major: 0, moderate: 1, none: 2 };
      return order[x.severity] - order[y.severity];
    });
    setResults(pairs);
  }

  const grouped = {
    major: results?.filter((r) => r.severity === "major") ?? [],
    moderate: results?.filter((r) => r.severity === "moderate") ?? [],
    none: results?.filter((r) => r.severity === "none") ?? [],
  };

  return (
    <AppShell>
      <PageHeader
        label="Interaction checker"
        title="Check Drug Interactions"
        description="Add two or more medicines to screen every pair for documented interactions, clinical effects and monitoring advice."
        action={<SourceTag kind="database" />}
      />

      <Panel className="mb-4">
        <SectionLabel>Medicines to check</SectionLabel>
        <div className="flex flex-wrap gap-2 mt-3">
          {selected.map((id) => (
            <span key={id} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-brand/10 ring-1 ring-brand/25">
              <span className="font-sans text-sm text-ink">{getMedicine(id)?.generic}</span>
              <button
                aria-label={`Remove ${getMedicine(id)?.generic}`}
                onClick={() => {
                  setSelected((s) => s.filter((x) => x !== id));
                  setResults(null);
                }}
                className="font-mono text-[11px] text-inksoft hover:text-risk"
              >
                ×
              </button>
            </span>
          ))}
          {selected.length === 0 && <p className="font-mono text-[11px] text-inksoft">No medicines added yet.</p>}
        </div>

        <div className="relative mt-4">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            maxLength={60}
            aria-label="Add a medicine"
            placeholder="Add a medicine — e.g. Metformin, Ciprofloxacin, Amlodipine"
            className="w-full rounded-lg bg-panel2 ring-1 ring-ink/10 px-4 py-3 text-sm text-ink outline-none focus:ring-brand/50"
          />
          {suggestions.length > 0 && (
            <div className="absolute z-20 left-0 right-0 mt-1.5 rounded-lg bg-panel2 ring-1 ring-ink/10 p-1.5 shadow-xl">
              {suggestions.map((m) => (
                <button
                  key={m.id}
                  onClick={() => add(m.id)}
                  className="w-full flex items-center justify-between px-2.5 py-2 rounded-md hover:bg-panel text-left"
                >
                  <span className="font-sans text-sm text-ink">{m.generic}</span>
                  <span className="font-mono text-[10px] text-inksoft">{m.drugClass}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <button
            onClick={check}
            disabled={selected.length < 2}
            className="px-4 py-2 rounded-md bg-brand text-seam text-sm font-medium disabled:opacity-40 hover:bg-brand/90 transition-colors"
          >
            Check Interactions
          </button>
          <button
            onClick={() => {
              setSelected(reminders.map((r) => r.medicineId));
              setResults(null);
            }}
            className="px-4 py-2 rounded-md ring-1 ring-ink/15 text-inksoft text-sm hover:text-ink"
          >
            Use my medication list
          </button>
          <button
            onClick={() => {
              setSelected(["metformin", "ciprofloxacin", "amlodipine"]);
              setResults(null);
            }}
            className="px-4 py-2 rounded-md ring-1 ring-ink/15 text-inksoft text-sm hover:text-ink"
          >
            Load example
          </button>
          {selected.length > 0 && (
            <button
              onClick={() => {
                setSelected([]);
                setResults(null);
              }}
              className="font-mono text-[10px] text-inksoft hover:text-risk"
            >
              Clear all
            </button>
          )}
        </div>
      </Panel>

      {results === null ? (
        <EmptyState title="Add at least two medicines, then run the check." hint="Every pair is screened against the interaction database." />
      ) : (
        <div className="space-y-5">
          {(["major", "moderate", "none"] as const).map((sev) =>
            grouped[sev].length === 0 ? null : (
              <div key={sev}>
                <div className="flex items-center gap-2 mb-2">
                  <SeverityPill severity={sev}>{severityLabel[sev]}</SeverityPill>
                  <span className="font-mono text-[10px] text-inksoft">{grouped[sev].length} pair(s)</span>
                </div>
                <div className="space-y-3">
                  {grouped[sev].map((r) => (
                    <Panel
                      key={`${r.a}-${r.b}`}
                      className={
                        sev === "major" ? "ring-risk/30" : sev === "moderate" ? "ring-caution/25" : "ring-safe/20"
                      }
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <h3 className="font-sans text-ink font-semibold">
                          {getMedicine(r.a)?.generic} + {getMedicine(r.b)?.generic}
                        </h3>
                        <SeverityPill severity={sev}>{severityLabel[sev]}</SeverityPill>
                      </div>
                      <p className="font-sans text-sm text-inksoft mt-2 text-pretty">{r.description}</p>
                      <div className="grid sm:grid-cols-3 gap-3 mt-4">
                        {[
                          ["Clinical effect", r.clinicalEffect],
                          ["Recommended precaution", r.recommendation],
                          ["Monitoring", r.monitoring],
                        ].map(([k, v]) => (
                          <div key={k} className="rounded-lg bg-panel2 ring-1 ring-ink/10 p-3">
                            <p className="font-mono text-[10px] uppercase tracking-wide text-inksoft">{k}</p>
                            <p className="font-sans text-sm text-ink mt-1 text-pretty">{v}</p>
                          </div>
                        ))}
                      </div>
                    </Panel>
                  ))}
                </div>
              </div>
            ),
          )}
        </div>
      )}

      <Disclaimer>
        Interaction screening is educational decision support, never an absolute diagnosis. Every result must be verified by a
        qualified healthcare professional before any medicine is started, stopped or changed. Database covers {MEDICINES.length}{" "}
        medicines.
      </Disclaimer>
    </AppShell>
  );
}
