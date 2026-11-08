import { MedicalDocumentUploader } from "@/components/MedicalDocumentUploader";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { Disclaimer, EmptyState, PageHeader, Panel, SectionLabel, SeverityPill, SourceTag } from "@/components/Bits";
import { extractDocument } from "@/lib/ai.functions";
import { downloadCsv } from "@/lib/download-csv";

export const Route = createFileRoute("/lab-reports")({
  head: () => ({
    meta: [
      { title: "Lab Report Analyzer — MedSafety AI" },
      { name: "description", content: "Upload a laboratory report to see results against reference ranges with abnormal values explained simply." },
      { property: "og:title", content: "Lab Report Analyzer — MedSafety AI" },
      { property: "og:description", content: "Educational explanations of lab results and flagged abnormal values." },
    ],
  }),
  component: LabPage,
});

type Row = { test?: string; result?: string; unit?: string; range?: string; status?: string; explanation?: string };

const ACCEPT = "image/jpeg,image/png,image/webp,application/pdf,text/plain";
const MAX_BYTES = 8 * 1024 * 1024;

function statusSeverity(status?: string) {
  const s = (status ?? "").toLowerCase();
  if (s === "high" || s === "low") return "caution" as const;
  if (s === "critical") return "risk" as const;
  return "safe" as const;
}

function LabPage() {
  const extract = useServerFn(extractDocument);
  
  const [busy, setBusy] = useState(false);
  const [rows, setRows] = useState<Row[] | null>(null);
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
    setRows(null);
    try {
      const text = file.type === "text/plain" ? (await file.text()).slice(0, 20000) : "";
      const imageDataUrl = (file.type.startsWith("image/") || file.type === "application/pdf") ? await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(new Error("Cannot read image"));
        reader.readAsDataURL(file);
      }) : undefined;
      const res = await extract({ data: { kind: "lab", fileName: file.name, text, imageDataUrl } });
      if (!res.ok) {
        toast.error(res.message ?? "Analysis failed.");
        return;
      }
      const parsed = res.data as { rows?: Row[]; summary?: string };
      setRows(parsed.rows ?? []);
      setSummary(parsed.summary ?? "");
    } catch {
      toast.error("The report could not be analysed. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  const abnormal = (rows ?? []).filter((r) => statusSeverity(r.status) !== "safe");

  return (
    <AppShell>
      <PageHeader
        label="Document analysis"
        title="Lab Report Analyzer"
        description="Upload a laboratory report. Test names, results, units and reference ranges are extracted, with abnormal values flagged and explained."
      />

      <div className="grid lg:grid-cols-12 gap-4">
        <Panel className="lg:col-span-4">
          <SectionLabel>Upload lab report</SectionLabel>
          <MedicalDocumentUploader kind="lab report" busy={busy} onAnalyze={handleFile} />
          {busy && <p className="font-mono text-[11px] text-brand mt-3">Reading results…</p>}
          {rows && (
            <p className="font-mono text-[11px] text-inksoft mt-4">
              {rows.length} tests · {abnormal.length} outside reference range
            </p>
          )}
        </Panel>

        <div className="lg:col-span-8 space-y-4">
          {rows === null ? (
            <EmptyState title="No report analysed yet." hint="Upload a lab report to see the extracted results table." />
          ) : (
            <>
              <Panel>
                <div className="flex items-center justify-between mb-3">
                  <SectionLabel>Extracted results</SectionLabel>
                  <SourceTag kind="ai" />
                </div>
                <button type="button" className="mb-3 rounded-md ring-1 ring-ink/20 px-3 py-1.5 text-xs text-ink hover:bg-panel2" onClick={() => downloadCsv("lab-results-review.csv", ["Test", "Result", "Unit", "Reference range", "Status", "Explanation"], rows.map((r) => [r.test ?? "", r.result ?? "", r.unit ?? "", r.range ?? "", r.status ?? "", r.explanation ?? ""]))}>Download results CSV</button>
                <p className="mb-3 text-xs text-caution">AI flags are preliminary; ranges may depend on the laboratory, age, and patient circumstances. Verify with the report and clinician.</p>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="font-mono text-[10px] uppercase tracking-wide text-inksoft">
                        <th className="py-2 pr-4 font-normal">Test</th>
                        <th className="py-2 pr-4 font-normal">Result</th>
                        <th className="py-2 pr-4 font-normal">Unit</th>
                        <th className="py-2 pr-4 font-normal">Reference range</th>
                        <th className="py-2 font-normal">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-ink/10">
                      {rows.map((r, i) => (
                        <tr key={i}>
                          <td className="py-2.5 pr-4 font-sans text-sm text-ink">{r.test}</td>
                          <td className="py-2.5 pr-4 font-mono text-sm text-ink">{r.result}</td>
                          <td className="py-2.5 pr-4 font-mono text-[11px] text-inksoft">{r.unit}</td>
                          <td className="py-2.5 pr-4 font-mono text-[11px] text-inksoft">{r.range}</td>
                          <td className="py-2.5">
                            <SeverityPill severity={statusSeverity(r.status)}>{r.status ?? "Normal"}</SeverityPill>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {summary && <p className="font-sans text-sm text-inksoft mt-4 text-pretty">{summary}</p>}
              </Panel>

              {abnormal.length > 0 && (
                <Panel>
                  <SectionLabel>What the abnormal results mean</SectionLabel>
                  <div className="mt-3 space-y-3">
                    {abnormal.map((r, i) => (
                      <div key={i} className="rounded-lg bg-panel2 ring-1 ring-ink/10 p-4">
                        <div className="flex items-center justify-between gap-2">
                          <h3 className="font-sans text-ink font-medium">
                            {r.test} — {r.result} {r.unit}
                          </h3>
                          <SeverityPill severity={statusSeverity(r.status)}>{r.status}</SeverityPill>
                        </div>
                        <p className="font-sans text-sm text-inksoft mt-2 text-pretty">{r.explanation}</p>
                      </div>
                    ))}
                  </div>
                </Panel>
              )}

              <Link
                to="/assistant"
                search={{
                  q: `Explain my lab results in simple language: ${rows
                    .map((r) => `${r.test ?? ""} ${r.result ?? ""} ${r.unit ?? ""} (ref ${r.range ?? "n/a"})`)
                    .join("; ")}`,
                }}
                className="inline-block px-4 py-2 rounded-md bg-brand text-seam text-sm font-medium hover:bg-brand/90 transition-colors"
              >
                Ask AI About This Report
              </Link>
            </>
          )}
        </div>
      </div>

      <Disclaimer>
        This AI explanation is educational and does not provide a diagnosis. Discuss all laboratory results with your doctor.
      </Disclaimer>
    </AppShell>
  );
}
