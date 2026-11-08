import { MedicalDocumentUploader } from "@/components/MedicalDocumentUploader";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { Disclaimer, EmptyState, PageHeader, Panel, SectionLabel, SourceTag } from "@/components/Bits";
import { extractDocument } from "@/lib/ai.functions";
import { downloadCsv } from "@/lib/download-csv";

export const Route = createFileRoute("/prescription")({
  head: () => ({
    meta: [
      { title: "Prescription Analyzer — MedSafety AI" },
      { name: "description", content: "Upload a prescription and get each medicine, dose, frequency and instruction explained in plain language." },
      { property: "og:title", content: "Prescription Analyzer — MedSafety AI" },
      { property: "og:description", content: "Plain-language explanation of your prescription, verified against the medicine database." },
    ],
  }),
  component: PrescriptionPage,
});

type Item = {
  medicine?: string;
  strength?: string;
  dose?: string;
  frequency?: string;
  route?: string;
  duration?: string;
  prn?: string;
  instructions?: string;
  explanation?: string;
};

const ACCEPT = "image/jpeg,image/png,image/webp,application/pdf,text/plain";
const MAX_BYTES = 8 * 1024 * 1024;

function PrescriptionPage() {
  const extract = useServerFn(extractDocument);
  
  const [busy, setBusy] = useState(false);
  const [items, setItems] = useState<Item[] | null>(null);
  const [summary, setSummary] = useState("");

  async function handleFile(file: File) {
    if (file.size > MAX_BYTES) {
      toast.error("File is too large. Maximum size is 8 MB.");
      return;
    }
    if (!ACCEPT.split(",").includes(file.type)) {
      toast.error("Unsupported file. Upload a JPG, PNG, PDF or text file.");
      return;
    }

    setBusy(true);
    setItems(null);
    try {
      const text = file.type === "text/plain" ? (await file.text()).slice(0, 20000) : "";
      const imageDataUrl = (file.type.startsWith("image/") || file.type === "application/pdf") ? await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(new Error("Cannot read image"));
        reader.readAsDataURL(file);
      }) : undefined;
      const res = await extract({ data: { kind: "prescription", fileName: file.name, text, imageDataUrl } });
      if (!res.ok) {
        toast.error(res.message ?? "Analysis failed.");
        return;
      }
      const parsed = res.data as { items?: Item[]; summary?: string };
      setItems(parsed.items ?? []);
      setSummary(parsed.summary ?? "");
    } catch {
      toast.error("The prescription could not be analysed. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AppShell>
      <PageHeader
        label="Document analysis"
        title="Prescription Analysis"
        description="Upload a prescription image or PDF. Medicines, doses, frequency, route and special instructions are extracted and explained in everyday language."
      />

      <div className="grid lg:grid-cols-12 gap-4">
        <Panel className="lg:col-span-4">
          <SectionLabel>Upload prescription</SectionLabel>
          <MedicalDocumentUploader kind="prescription" busy={busy} onAnalyze={handleFile} />
          {busy && <p className="font-mono text-[11px] text-brand mt-3">Extracting medicines…</p>}
          <p className="font-mono text-[10px] text-inksoft/80 mt-4 leading-relaxed">Check all extracted details against the original document. Images may be sent to the configured AI provider for analysis.</p>
        </Panel>

        <div className="lg:col-span-8 space-y-4">
          {items === null ? (
            <EmptyState
              title="No prescription analysed yet."
              hint="Upload a prescription to see extracted medicines and a plain-language explanation."
            />
          ) : (
            <>
              <Panel>
                <div className="flex items-center justify-between">
                  <SectionLabel>Your prescription</SectionLabel>
                  <SourceTag kind="ai" />
                </div>
                <button type="button" className="mt-2 rounded-md ring-1 ring-ink/20 px-3 py-1.5 text-xs text-ink hover:bg-panel2" onClick={() => downloadCsv("prescription-review.csv", ["Medicine", "Strength", "Dose", "Frequency", "Route", "Duration", "PRN", "Instructions", "Explanation"], items.map((it) => [it.medicine ?? "", it.strength ?? "", it.dose ?? "", it.frequency ?? "", it.route ?? "", it.duration ?? "", it.prn ?? "", it.instructions ?? "", it.explanation ?? ""]))}>Download results CSV</button>
                <p className="mt-2 text-xs text-caution">Unverified AI extraction — do not use as a prescription or dosing instruction. Confirm against the original with a pharmacist.</p>
                {summary && <p className="font-sans text-sm text-inksoft mt-3 text-pretty">{summary}</p>}
                <div className="mt-3 space-y-3">
                  {items.map((it, i) => (
                    <div key={i} className="rounded-lg bg-panel2 ring-1 ring-ink/10 p-4">
                      <div className="flex flex-wrap items-baseline justify-between gap-2">
                        <h3 className="font-sans text-ink font-semibold">
                          {it.medicine} {it.strength}
                        </h3>
                        {it.prn && <span className="font-mono text-[10px] text-caution">{it.prn}</span>}
                      </div>
                      <div className="grid sm:grid-cols-4 gap-3 mt-3">
                        {[
                          ["Dose", it.dose],
                          ["Frequency", it.frequency],
                          ["Route", it.route],
                          ["Duration", it.duration],
                        ].map(([k, v]) => (
                          <div key={k}>
                            <p className="font-mono text-[10px] uppercase tracking-wide text-inksoft">{k}</p>
                            <p className="font-sans text-sm text-ink">{v || "—"}</p>
                          </div>
                        ))}
                      </div>
                      {it.instructions && (
                        <p className="font-sans text-sm text-inksoft mt-3 text-pretty">
                          <span className="text-brand font-mono text-[10px] uppercase tracking-wide mr-2">Instructions</span>
                          {it.instructions}
                        </p>
                      )}
                      {it.explanation && (
                        <p className="font-sans text-sm text-ink mt-2 text-pretty">In simple words: {it.explanation}</p>
                      )}
                    </div>
                  ))}
                </div>
              </Panel>

              <Link
                to="/assistant"
                search={{
                  q: `Explain this prescription in simple language: ${items
                    .map((i) => `${i.medicine ?? ""} ${i.strength ?? ""} ${i.dose ?? ""} ${i.frequency ?? ""}`.trim())
                    .join("; ")}`,
                }}
                className="inline-block px-4 py-2 rounded-md bg-brand text-seam text-sm font-medium hover:bg-brand/90 transition-colors"
              >
                Ask AI About This Prescription
              </Link>
            </>
          )}
        </div>
      </div>

      <Disclaimer>
        OCR and AI extraction may contain errors. Always verify every medicine, dose and instruction with your pharmacist or
        prescriber before taking anything.
      </Disclaimer>
    </AppShell>
  );
}
