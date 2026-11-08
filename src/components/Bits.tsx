import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import type { Severity } from "@/data/interactions";
import { cn } from "@/lib/utils";

export function Logo({ withText = true }: { withText?: boolean }) {
  return (
    <Link to="/" className="flex items-center gap-2.5 shrink-0">
      <span className="size-8 grid place-items-center rounded-lg bg-brand text-seam ring-1 ring-brand/40">
        <span className="font-sans text-sm font-semibold leading-none">M</span>
      </span>
      {withText && (
        <span className="font-sans text-ink font-semibold tracking-tight text-[15px]">
          MedSafety <span className="text-brand">AI</span>
        </span>
      )}
    </Link>
  );
}

export function Panel({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("rounded-xl bg-panel ring-1 ring-ink/10 p-4", className)}>{children}</div>;
}

export function SectionLabel({ children }: { children: ReactNode }) {
  return <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-inksoft">{children}</p>;
}

export function PageHeader({ label, title, description, action }: { label: string; title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
      <div>
        <SectionLabel>{label}</SectionLabel>
        <h1 className="font-sans text-ink text-2xl sm:text-3xl font-semibold tracking-tight mt-1.5">{title}</h1>
        {description && <p className="font-sans text-sm text-inksoft mt-1.5 max-w-[70ch] text-pretty">{description}</p>}
      </div>
      {action}
    </div>
  );
}

const severityStyles: Record<Severity | "safe" | "caution" | "risk", string> = {
  none: "text-safe bg-safe/15 ring-safe/25",
  safe: "text-safe bg-safe/15 ring-safe/25",
  moderate: "text-caution bg-caution/15 ring-caution/25",
  caution: "text-caution bg-caution/15 ring-caution/25",
  major: "text-risk bg-risk/15 ring-risk/25",
  risk: "text-risk bg-risk/15 ring-risk/25",
};

export function SeverityPill({ severity, children }: { severity: keyof typeof severityStyles; children: ReactNode }) {
  return (
    <span
      className={cn(
        "shrink-0 px-2 py-0.5 rounded-md font-mono text-[10px] uppercase tracking-wide ring-1",
        severityStyles[severity],
      )}
    >
      {children}
    </span>
  );
}

export function Disclaimer({ children }: { children?: ReactNode }) {
  return (
    <p className="mt-6 font-mono text-[10px] leading-relaxed text-inksoft/80">
      {children ??
        "This information is for educational purposes and does not replace professional medical advice. Verify all details with your pharmacist or prescriber."}
    </p>
  );
}

export function SourceTag({ kind }: { kind: "database" | "ai" }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md font-mono text-[10px] uppercase tracking-wide ring-1",
        kind === "database" ? "text-brand bg-brand/10 ring-brand/25" : "text-caution bg-caution/10 ring-caution/25",
      )}
    >
      <span className={cn("size-1.5 rounded-full", kind === "database" ? "bg-brand" : "bg-caution")} />
      {kind === "database" ? "Database information" : "AI-generated explanation"}
    </span>
  );
}

export function EmptyState({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="rounded-lg bg-panel2 ring-1 ring-ink/10 p-8 text-center">
      <p className="font-sans text-sm text-ink">{title}</p>
      {hint && <p className="font-mono text-[11px] text-inksoft mt-1.5">{hint}</p>}
    </div>
  );
}
