/** Export reviewed extraction results locally. No document data is uploaded for this export. */
export function downloadCsv(filename: string, headers: string[], rows: string[][]) {
  const escape = (value: string) => `"${String(value ?? "").replace(/"/g, '""')}"`;
  // BOM helps spreadsheet programs display Urdu correctly.
  const csv = "\uFEFF" + [headers, ...rows].map((row) => row.map(escape).join(",")).join("\r\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
