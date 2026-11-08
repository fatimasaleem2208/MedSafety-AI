# MedSafety AI — Camera and AI setup (Phase 1 hotfix)

## Camera behavior
The **Take Photo** button now opens an in-page camera preview through `navigator.mediaDevices.getUserMedia()` when supported. Grant browser camera permission, aim at the document, then select **Capture Photo**. The resulting image is previewed before pressing **Analyze Document**. If the browser/device doesn't support direct capture, a device camera fallback is available; some devices may still show an OS chooser. Camera streams are stopped when closing or capturing. Requires HTTPS in deployment or localhost in development. Desktop PCs require a connected camera.

## Chatbot/AI setup
The app now accepts either of these **server-side** environment variables:

- `OPENAI_API_KEY` — preferred if you have an OpenAI API account; uses `gpt-4o-mini` via the OpenAI API.
- `LOVABLE_API_KEY` — retains support for the existing Lovable gateway.

If both exist, OPENAI_API_KEY takes precedence. OpenAI API is a separately billed service from ChatGPT subscriptions. Never use `VITE_` prefix for these secrets, never commit the key, and never paste it into a chat.

### Local VS Code
At the project root, create `.env.local` (not committed):

```
OPENAI_API_KEY=your_actual_key_here
```

Restart `npm run dev` after changing this file. If the application runs server functions in a different configured runtime, ensure that runtime receives the secret. Confirm AI chat, Urdu/Roman Urdu replies and image analysis using non-sensitive sample material.

### Vercel
Open Vercel > project > Settings > Environment Variables. Add `OPENAI_API_KEY` (or `LOVABLE_API_KEY`) to the production and any relevant preview environment, then redeploy. Check server logs if a request fails. Never place a secret in a browser-exposed `VITE_` variable.

### Important limitations
- PDFs can be selected but PDF-to-text/OCR is **not implemented**; PDF analysis remains disabled.
- Browser speech recognition and synthesized voices are dependent on platform support and are not equivalent to a managed Urdu speech API.
- Camera capture and AI calls are code changes, not verified on your device or deployment.
- Do not use real patient information until authentication, data storage and privacy protections are audited.
