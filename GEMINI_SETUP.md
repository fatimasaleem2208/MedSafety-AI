# MedSafety AI — Gemini API setup (free-tier development)

## 1. Create your key

Open https://aistudio.google.com/apikey and sign in. Create an API key for an eligible Google AI Studio project. See your project's free-tier model availability and quotas in AI Studio; these vary and are not guaranteed.

**Privacy warning:** Google's Gemini API free tier may use submitted content to improve its products. Use only fictional, synthetic, or fully authorized non-sensitive test data. Do not submit actual patient prescriptions, reports, or personal health information on a free-tier account. Review provider terms and arrange appropriate contractual and technical safeguards before processing real patient information.

## 2. Configure local VS Code

Create a file called **`.env.local`** in the directory with `package.json`:

```env
GEMINI_API_KEY=replace_with_your_real_key
```

Do not prefix the name with `VITE_`, and **do not commit the `.env.local` file**. The `.gitignore` excludes `*.local` files. To avoid confusion, remove or comment out your old `OPENAI_API_KEY` entry if you want only Gemini. If both are set, Gemini takes priority.

Run `npm install`, then `npm run dev`, and restart the server every time you change `.env.local`.

## 3. Test

In the AI Assistant, ask: "What is paracetamol? Reply in simple Urdu." Select Urdu and confirm the response is Urdu script. Try Roman Urdu and English separately. For prescription/lab images, test only with **fabricated sample documents**. The camera/image paths can send image data to Gemini. PDF selection exists but **PDF analysis is not implemented** in this version.

## 4. Configure Vercel

Vercel > Your Project > Settings > Environment Variables > Add `GEMINI_API_KEY` as the name and the key as the value. Select the relevant environments (Production and/or Preview), save, then **redeploy**. Do not put the key in your source files or public configuration.

## 5. Troubleshooting

- **Not configured:** `.env.local` is missing, named incorrectly, in the wrong folder, or the server was not restarted. On Vercel, redeploy after adding the environment variable.
- **403:** API key/project access or regional eligibility issue. Check your project in AI Studio.
- **429:** Gemini project free-tier quota/rate limit exceeded. Check AI Studio usage/rate limits; do not continuously retry.
- **404:** The `gemini-3.5-flash-lite` model is unavailable for your project. Check available models and set `GEMINI_MODEL` in `.env.local` to an actually available suitable model.
- **No response:** Check terminal/Vercel server logs, not browser console alone. Never share your API key in screenshots.

## What changed

Only `src/lib/ai.functions.ts` was changed for provider integration. Gemini runs server-side via the official REST `generateContent` endpoint and supports existing chat history and image-based document analysis. OpenAI and Lovable backend support were preserved as optional fallback configurations. The camera implementation was not modified.


## Gemini model access (November 2026)

New Gemini projects may no longer have access to `gemini-2.5-flash`. The updated default is `gemini-3.5-flash-lite`. Configure this in your **project root** `.env.local`:

```env
GEMINI_API_KEY=your_secret_key_here
GEMINI_MODEL=gemini-3.5-flash-lite
```

If the model is unavailable, visit https://aistudio.google.com/ and check models and rate limits for **the same project/API key**. Change only `GEMINI_MODEL` to a model with `generateContent` support and a free quota for your project; restart `npm run dev`. Do not use image-generation-only, embedding-only, or TTS-only model names for this chatbot.

To see your project's models using PowerShell (replace placeholder LOCALLY, never post output containing the key):

```powershell
$headers = @{ 'x-goog-api-key' = $env:GEMINI_API_KEY }
(Invoke-RestMethod -Uri 'https://generativelanguage.googleapis.com/v1beta/models' -Headers $headers).models | Where-Object { $_.supportedGenerationMethods -contains 'generateContent' } | Select-Object name
```

Your local shell's `$env:GEMINI_API_KEY` is **not** automatically populated by Vite's `.env.local`; set it in the shell temporarily or use AI Studio instead. Never put the key in command history or screenshots.
