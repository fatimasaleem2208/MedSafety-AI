# MedSafety AI — bundled scanner and safety upgrade

## Included fixes
- Prescription scanner: JPG, PNG, WebP, TXT **and PDF** analysis using your configured Gemini model. Both scanned and text PDFs are provided as PDF bytes to Gemini (up to the existing 8 MB limit).
- Lab report scanner: same PDF support, including multi-page documents when the selected model permits.
- Both scanners: stricter AI response schema validation; unclear/empty results no longer presented as successful extraction.
- Prescription and lab results: client-side CSV export for clinician/pharmacist review (not a verified medical record).
- Interactions checker: removed unsafe reassurance when a pair is absent from the limited local dataset.
- Existing chatbot, languages, camera and voice code are preserved unchanged.

## Install (only changed files)
Merge the `src` folder in this archive into the **root of your existing, working MedSafety-AI project**, preserving folder paths. Replace same-name files. Do NOT replace `.env.local` or delete any other project files.

In VS Code use **File > Open Folder** and select the folder containing BOTH `package.json` and `src/routes`. Do NOT run `npm run dev` from the Downloads root.

Your existing `.env.local` stays unchanged and should contain your working Gemini key/model:
```
GEMINI_API_KEY=<your own secret key>
GEMINI_MODEL=<the model that already works in your account>
```

Restart server with `Ctrl+C` and `npm run dev`.

## Test plan
1. Upload a fictional sample prescription PDF; verify extracted items against the document.
2. Upload a fictional sample multi-page lab PDF; verify every row and reference range.
3. Test image and camera capture to ensure no regressions.
4. Download CSV and inspect rows in spreadsheet software.
5. Test a medicine pair missing from the local database; check it no longer says the combination is confirmed safe.

## Safety and privacy
Do NOT upload real patient records to the Gemini free tier. Free-tier data policies and data processing terms need independent review. AI extraction is fallible, and medication instructions or abnormal lab results must be verified by a qualified professional. Local CSV exports contain medical information; store them securely.

## Limitations
No live Gemini API test is performed (requires your private API key). This is an educational prototype, not a certified clinical decision support system. PDF support requires a Gemini model that accepts PDFs and works for your API project. It does not provide guaranteed OCR accuracy or validated interaction coverage.
