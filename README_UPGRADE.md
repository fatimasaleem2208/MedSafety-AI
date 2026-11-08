# MedSafety AI — upgrade notes

## Implemented in this iteration
- Rebranded source UI and metadata to MedSafety AI.
- Added camera capture, gallery upload, PDF selection, file previews, retake / replacement and confirmation-driven analysis to prescription and lab routes.
- Images are now actually transmitted to the configured AI gateway for image-based analysis (rather than just their filename).
- Removed fabricated example medical results when document contents cannot be read.

## Important limitations / next work
- **PDF extraction is not implemented yet.** PDFs can be selected but the Analyze button remains disabled with an explicit explanation. Integrate a server-side PDF/OCR processor before enabling this path.
- The Lovable AI gateway requires `LOVABLE_API_KEY`; this environment has no credential. Image-to-text model capability must be verified against the configured gateway.
- Existing sign-in and local health data are demonstration-only. No production patient accounts, secure family sharing or database have been implemented.
- Added browser-supported speech recognition, speech playback, and English/Urdu/Roman Urdu assistant response selection. Urdu voice quality depends on browser voices; unsupported browsers disable recognition. Family tree remains a future phase.
- Never submit real patient data until authentication, protected storage, provider privacy, and regulatory requirements have been reviewed.

## Run
`npm install` then `npm run dev` (requires network/npm packages), or use the existing Bun workflow.
