import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { Disclaimer, Panel, SectionLabel, SourceTag } from "@/components/Bits";
import { getMedicine, MEDICINES } from "@/data/medicines";

export const Route = createFileRoute("/medicines/$medicineId")({
  loader: ({ params }) => {
    const med = getMedicine(params.medicineId);
    if (!med) throw notFound();
    return { med };
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return { meta: [{ title: "Medicine not found — MedSafety AI" }, { name: "robots", content: "noindex" }] };
    }
    const { med } = loaderData;
    return {
      meta: [
        { title: `${med.generic} — Medicine information | MedSafety AI` },
        { name: "description", content: `${med.generic} (${med.drugClass}): uses, dosing, side effects, interactions and counseling points.` },
        { property: "og:title", content: `${med.generic} — Medicine information` },
        { property: "og:description", content: `Uses, dosing, side effects and interactions for ${med.generic}.` },
      ],
    };
  },
  notFoundComponent: () => (
    <AppShell>
      <p className="font-sans text-ink">That medicine is not in the database yet.</p>
      <Link to="/medicines" className="font-mono text-[11px] text-brand hover:underline">
        Back to Medicine A–Z
      </Link>
    </AppShell>
  ),
  errorComponent: () => (
    <AppShell>
      <p className="font-sans text-ink">This medicine profile could not be loaded.</p>
    </AppShell>
  ),
  component: MedicineDetail,
});

function List({ items }: { items: string[] }) {
  return (
    <ul className="mt-2 space-y-1.5">
      {items.map((i) => (
        <li key={i} className="font-sans text-sm text-inksoft flex gap-2">
          <span className="text-brand mt-0.5">·</span>
          <span className="text-pretty">{i}</span>
        </li>
      ))}
    </ul>
  );
}

function Block({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <Panel>
      <SectionLabel>{label}</SectionLabel>
      {children}
    </Panel>
  );
}

function MedicineDetail() {
  const { med } = Route.useLoaderData();
  const related = MEDICINES.filter((m) => m.category === med.category && m.id !== med.id).slice(0, 4);

  return (
    <AppShell>
      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div>
          <SectionLabel>Medicine profile</SectionLabel>
          <h1 className="font-sans text-ink text-2xl sm:text-3xl font-semibold tracking-tight mt-1.5">{med.generic}</h1>
          <p className="font-mono text-[11px] text-inksoft mt-2">
            {med.drugClass} · {med.category}
          </p>
          <p className="font-sans text-sm text-inksoft mt-1">Brands: {med.brands.join(", ")}</p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <SourceTag kind="database" />
          <Link
            to="/assistant"
            search={{ q: `Explain ${med.generic} in simple language.` }}
            className="px-3.5 py-2 rounded-md bg-brand text-seam text-sm font-medium hover:bg-brand/90 transition-colors"
          >
            Ask AI about this medicine
          </Link>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <Block label="At a glance">
          <dl className="mt-3 space-y-2.5">
            {[
              ["Dosage forms", med.forms.join(", ")],
              ["Strengths", med.strengths.join(", ")],
              ["Route", med.routes.join(", ")],
              ["Therapeutic category", med.category],
            ].map(([k, v]) => (
              <div key={k} className="flex flex-col">
                <dt className="font-mono text-[10px] uppercase tracking-wide text-inksoft">{k}</dt>
                <dd className="font-sans text-sm text-ink">{v}</dd>
              </div>
            ))}
          </dl>
        </Block>

        <Block label="Indications / uses">
          <List items={med.indications} />
        </Block>

        <Block label="Dosing">
          <p className="font-mono text-[10px] uppercase tracking-wide text-inksoft mt-3">Adults</p>
          <p className="font-sans text-sm text-ink mt-1 text-pretty">{med.adultDosing}</p>
          <p className="font-mono text-[10px] uppercase tracking-wide text-inksoft mt-3">Children</p>
          <p className="font-sans text-sm text-ink mt-1 text-pretty">{med.pediatricDosing}</p>
        </Block>

        <Block label="Common side effects">
          <List items={med.commonSideEffects} />
        </Block>

        <Block label="Serious adverse effects">
          <List items={med.seriousEffects} />
        </Block>

        <Block label="Contraindications">
          <List items={med.contraindications} />
        </Block>

        <Block label="Precautions">
          <List items={med.precautions} />
        </Block>

        <Block label="Drug interactions">
          <List items={med.interactions} />
          <Link to="/interactions" className="inline-block mt-3 font-mono text-[10px] text-brand hover:underline">
            Run a full interaction check →
          </Link>
        </Block>

        <Block label="Food, pregnancy & storage">
          <p className="font-mono text-[10px] uppercase tracking-wide text-inksoft mt-3">Food interactions</p>
          <p className="font-sans text-sm text-ink mt-1 text-pretty">{med.foodInteractions}</p>
          <p className="font-mono text-[10px] uppercase tracking-wide text-inksoft mt-3">Pregnancy / lactation</p>
          <p className="font-sans text-sm text-ink mt-1 text-pretty">{med.pregnancy}</p>
          <p className="font-mono text-[10px] uppercase tracking-wide text-inksoft mt-3">Storage</p>
          <p className="font-sans text-sm text-ink mt-1 text-pretty">{med.storage}</p>
        </Block>

        <Panel className="lg:col-span-3">
          <SectionLabel>Patient counseling points</SectionLabel>
          <div className="grid sm:grid-cols-3 gap-3 mt-3">
            {med.counseling.map((c) => (
              <div key={c} className="rounded-lg bg-panel2 ring-1 ring-ink/10 p-3">
                <p className="font-sans text-sm text-ink text-pretty">{c}</p>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      {related.length > 0 && (
        <div className="mt-4">
          <SectionLabel>More in {med.category}</SectionLabel>
          <div className="mt-3 flex flex-wrap gap-2">
            {related.map((r) => (
              <Link
                key={r.id}
                to="/medicines/$medicineId"
                params={{ medicineId: r.id }}
                className="px-3 py-1.5 rounded-md bg-panel ring-1 ring-ink/10 font-sans text-sm text-ink hover:ring-brand/40"
              >
                {r.generic}
              </Link>
            ))}
          </div>
        </div>
      )}

      <Disclaimer>
        This information is for educational purposes and does not replace professional medical advice. It is general medicine
        information, not personalised advice for your situation.
      </Disclaimer>
    </AppShell>
  );
}
