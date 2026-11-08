import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Disclaimer, EmptyState, PageHeader, Panel, SectionLabel } from "@/components/Bits";
import { ALPHABET, CATEGORIES, searchMedicines } from "@/data/medicines";

export const Route = createFileRoute("/medicines/")({
  head: () => ({
    meta: [
      { title: "Medicine A–Z — MedSafety AI" },
      {
        name: "description",
        content: "Search an A–Z medicine database by generic name, brand name, drug class or therapeutic category.",
      },
      { property: "og:title", content: "Medicine A–Z — MedSafety AI" },
      { property: "og:description", content: "Browse structured medicine monographs by letter, category or search." },
    ],
  }),
  component: MedicineIndex,
});

function MedicineIndex() {
  const [query, setQuery] = useState("");
  const [letter, setLetter] = useState<string | undefined>();
  const [category, setCategory] = useState<string | undefined>();

  const results = useMemo(() => searchMedicines(query, letter, category), [query, letter, category]);
  const suggestions = useMemo(() => (query.trim().length > 1 ? results.slice(0, 5) : []), [query, results]);

  return (
    <AppShell>
      <PageHeader
        label="Medicine database"
        title="Search Medicines"
        description="An expandable A–Z reference of medicines with dosing, side effects, interactions and counseling points."
      />

      <Panel className="mb-4">
        <div className="relative">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            maxLength={80}
            placeholder="Search medicine by generic name or brand name…"
            className="w-full rounded-lg bg-panel2 ring-1 ring-ink/10 px-4 py-3 text-sm text-ink outline-none focus:ring-brand/50"
          />
          {suggestions.length > 0 && (
            <div className="absolute z-20 left-0 right-0 mt-1.5 rounded-lg bg-panel2 ring-1 ring-ink/10 p-1.5 shadow-xl">
              {suggestions.map((m) => (
                <Link
                  key={m.id}
                  to="/medicines/$medicineId"
                  params={{ medicineId: m.id }}
                  className="flex items-center justify-between px-2.5 py-2 rounded-md hover:bg-panel"
                >
                  <span className="font-sans text-sm text-ink">{m.generic}</span>
                  <span className="font-mono text-[10px] text-inksoft">{m.category}</span>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="mt-4 flex flex-wrap gap-1">
          <button
            onClick={() => setLetter(undefined)}
            className={`px-2 h-7 grid place-items-center rounded-md font-mono text-[11px] ${!letter ? "bg-brand text-seam" : "bg-panel2 text-inksoft hover:text-ink"}`}
          >
            All
          </button>
          {ALPHABET.map((l) => (
            <button
              key={l}
              onClick={() => setLetter(letter === l ? undefined : l)}
              className={`size-7 grid place-items-center rounded-md font-mono text-[11px] ${
                letter === l ? "bg-brand text-seam" : "bg-panel2 text-inksoft hover:text-ink"
              }`}
            >
              {l}
            </button>
          ))}
        </div>

        <div className="mt-3 flex flex-wrap gap-1.5">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(category === c ? undefined : c)}
              className={`px-2.5 py-1 rounded-md font-mono text-[10px] uppercase tracking-wide ring-1 ${
                category === c ? "bg-brand/15 text-brand ring-brand/30" : "bg-panel2 text-inksoft ring-ink/10 hover:text-ink"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </Panel>

      <div className="flex items-center justify-between mb-3">
        <SectionLabel>{results.length} medicines</SectionLabel>
        {(letter || category || query) && (
          <button
            onClick={() => {
              setLetter(undefined);
              setCategory(undefined);
              setQuery("");
            }}
            className="font-mono text-[10px] text-brand hover:underline"
          >
            Clear filters
          </button>
        )}
      </div>

      {results.length === 0 ? (
        <EmptyState title="No medicines matched that search." hint="Try a generic name such as Metformin, or clear the filters." />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {results.map((m) => (
            <Link
              key={m.id}
              to="/medicines/$medicineId"
              params={{ medicineId: m.id }}
              className="rounded-xl bg-panel ring-1 ring-ink/10 p-4 hover:ring-brand/40 transition-colors"
            >
              <div className="flex items-start justify-between gap-3">
                <h2 className="font-sans text-ink font-semibold text-[15px]">{m.generic}</h2>
                <span className="font-mono text-[10px] text-brand shrink-0">{m.generic.charAt(0)}</span>
              </div>
              <p className="font-mono text-[10px] text-inksoft mt-1">{m.drugClass}</p>
              <p className="font-sans text-sm text-inksoft mt-2 line-clamp-2">{m.indications.slice(0, 3).join(" · ")}</p>
              <p className="font-mono text-[10px] text-inksoft/80 mt-3">{m.brands.slice(0, 3).join(", ")}</p>
            </Link>
          ))}
        </div>
      )}

      <Disclaimer />
    </AppShell>
  );
}
