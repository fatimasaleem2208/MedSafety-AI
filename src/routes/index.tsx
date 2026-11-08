import { createFileRoute, Link } from "@tanstack/react-router";
import { Logo } from "@/components/Bits";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "MedSafety AI — Smart Medication Safety Platform" },
      {
        name: "description",
        content:
          "Safer medicines. Smarter decisions. Better care. An AI-powered platform for medicine information, drug interactions, prescription and lab report explanation, and reminders.",
      },
      { property: "og:title", content: "MedSafety AI — Smart Medication Safety Platform" },
      {
        property: "og:description",
        content: "Safer medicines. Smarter decisions. Better care. Medication safety for patients and healthcare professionals.",
      },
    ],
  }),
  component: Landing,
});

const FEATURES = [
  { n: "01", icon: "◉", title: "Medicine Information", body: "Structured A–Z monographs with dosing, side effects, and counseling points." },
  { n: "02", icon: "⇄", title: "Drug Interaction Checker", body: "Grade pairwise and multi-drug interactions with severity and precautions." },
  { n: "03", icon: "∞", title: "AI Medication Assistant", body: "Plain-language answers grounded in the verified medicine database." },
  { n: "04", icon: "▢", title: "Prescription Analysis", body: "Read a script into strength, dose, frequency, and route — then explain it." },
  { n: "05", icon: "∧", title: "Lab Report Explanation", body: "Flag abnormal values and interpret them against reference ranges." },
  { n: "06", icon: "⏱", title: "Medication Reminders", body: "A daily dose schedule with taken, skipped, and missed tracking." },
];

function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <section className="border-b border-ink/10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center gap-8">
          <Logo />
          <nav className="hidden lg:flex items-center gap-1 flex-1">
            <Link to="/dashboard" className="px-3 py-1.5 rounded-md text-sm font-medium text-inksoft hover:text-ink">Dashboard</Link>
            <Link to="/medicines" className="px-3 py-1.5 rounded-md text-sm font-medium text-inksoft hover:text-ink">Medicine A–Z</Link>
            <Link to="/interactions" className="px-3 py-1.5 rounded-md text-sm font-medium text-inksoft hover:text-ink">Interactions</Link>
            <Link to="/assistant" className="px-3 py-1.5 rounded-md text-sm font-medium text-inksoft hover:text-ink">AI Assistant</Link>
            <Link to="/about" className="px-3 py-1.5 rounded-md text-sm font-medium text-inksoft hover:text-ink">About</Link>
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <Link to="/auth" search={{ mode: "login" }} className="px-3 py-2 rounded-md text-sm font-medium text-inksoft hover:text-ink">
              Sign in
            </Link>
            <Link
              to="/auth"
              search={{ mode: "signup" }}
              className="px-3.5 py-2 rounded-md text-sm font-medium bg-brand text-seam hover:bg-brand/90 transition-colors"
            >
              Get Started
            </Link>
          </div>
        </div>
      </section>

      <section>
        <div className="max-w-7xl mx-auto px-6 py-16 lg:py-20 grid lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-7">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-panel ring-1 ring-ink/10 mb-6">
              <span className="size-1.5 rounded-full bg-safe" />
              <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-inksoft">Smart Medication Safety Platform</span>
            </div>
            <h1 className="font-sans text-ink text-4xl sm:text-5xl lg:text-6xl font-semibold leading-none tracking-[-0.02em] max-w-[20ch] text-balance">
              MedSafety AI
            </h1>
            <p className="mt-5 font-sans text-brand text-lg sm:text-xl font-medium max-w-[40ch]">
              Safer medicines. Smarter decisions. Better care.
            </p>
            <p className="mt-4 font-sans text-inksoft text-base max-w-[52ch] text-pretty">
              An AI-powered medication safety platform that helps patients and healthcare professionals understand medicines,
              identify potential drug interactions, manage medications, and access reliable medication information.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                to="/auth"
                search={{ mode: "signup" }}
                className="px-5 py-2.5 rounded-md text-sm font-medium bg-brand text-seam ring-1 ring-brand/40 hover:bg-brand/90 transition-colors"
              >
                Get Started
              </Link>
              <Link to="/medicines" className="px-5 py-2.5 rounded-md text-sm font-medium text-ink ring-1 ring-ink/15 hover:bg-panel transition-colors">
                Explore Medicines
              </Link>
            </div>
            <div className="mt-8 flex items-center gap-6 font-mono text-[11px] text-inksoft">
              <span className="flex items-center gap-1.5"><span className="size-1.5 rounded-full bg-safe" />Safe</span>
              <span className="flex items-center gap-1.5"><span className="size-1.5 rounded-full bg-caution" />Caution</span>
              <span className="flex items-center gap-1.5"><span className="size-1.5 rounded-full bg-risk" />High Risk</span>
            </div>
          </div>

          <div className="lg:col-span-5 rise">
            <div className="rounded-2xl bg-panel ring-1 ring-ink/10 p-3">
              <div className="rounded-xl bg-panel2 ring-1 ring-ink/10 p-4">
                <div className="flex items-center justify-between mb-4">
                  <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-inksoft">Safety Scanner</span>
                  <span className="flex items-center gap-1.5 font-mono text-[10px] text-safe"><span className="size-1.5 rounded-full bg-safe" />Live</span>
                </div>
                <div className="space-y-2">
                  <ScanRow name="Metformin 500mg" meta="Biguanide · Oral" tone="safe" label="Safe" />
                  <ScanRow name="Ciprofloxacin 500mg" meta="Fluoroquinolone · Oral" tone="caution" label="Caution" />
                  <ScanRow name="Warfarin 5mg" meta="Anticoagulant · Oral" tone="risk" label="High Risk" />
                </div>
                <div className="mt-4 pt-3 border-t border-ink/10 flex items-center justify-between">
                  <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-inksoft">Interactions flagged</span>
                  <span className="font-mono text-sm font-medium text-caution">2</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-ink/10">
        <div className="max-w-7xl mx-auto px-6 py-16">
          <div className="mb-8">
            <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-inksoft mb-2">Capabilities</p>
            <h2 className="font-sans text-ink text-2xl sm:text-3xl font-semibold tracking-tight max-w-[40ch] text-balance">
              Every layer of medication safety, in one console
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map((f) => (
              <div key={f.n} className="rise rounded-xl bg-panel ring-1 ring-ink/10 p-5 hover:bg-panel2 transition-colors">
                <div className="flex items-center justify-between mb-4">
                  <span className="font-mono text-[11px] text-brand">{f.n}</span>
                  <span className="size-8 grid place-items-center rounded-lg bg-panel2 ring-1 ring-ink/10 text-brand">{f.icon}</span>
                </div>
                <h3 className="font-sans text-ink font-semibold text-base">{f.title}</h3>
                <p className="mt-1.5 font-sans text-sm text-inksoft max-w-[40ch] text-pretty">{f.body}</p>
              </div>
            ))}
          </div>
          <p className="mt-10 font-mono text-[10px] text-inksoft/70">
            Educational information only — verify all details with your pharmacist or prescriber. Not a diagnosis.
          </p>
        </div>
      </section>
    </div>
  );
}

function ScanRow({ name, meta, tone, label }: { name: string; meta: string; tone: "safe" | "caution" | "risk"; label: string }) {
  const toneClass =
    tone === "safe"
      ? "text-safe bg-safe/15 ring-safe/25"
      : tone === "caution"
        ? "text-caution bg-caution/15 ring-caution/25"
        : "text-risk bg-risk/15 ring-risk/25";
  return (
    <div className="flex items-center justify-between gap-3 py-2.5 px-3 rounded-lg bg-background ring-1 ring-ink/5">
      <div className="min-w-0">
        <p className="font-mono text-[13px] text-ink truncate">{name}</p>
        <p className="font-mono text-[10px] text-inksoft">{meta}</p>
      </div>
      <span className={`shrink-0 px-2 py-0.5 rounded-md font-mono text-[10px] uppercase tracking-wide ring-1 ${toneClass}`}>{label}</span>
    </div>
  );
}
