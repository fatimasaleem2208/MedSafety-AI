import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const LOVABLE_MODEL = "google/gemini-3.7-flash";
const OPENAI_MODEL = "gpt-4o-mini";
// New Gemini API projects often cannot access the older 2.5 models.
// Set GEMINI_MODEL in .env.local to an exact model listed for your own API key.
const GEMINI_MODEL = process.env["GEMINI_MODEL"]?.trim() || "gemini-3.5-flash-lite";
const GATEWAY = "https://ai.gateway.lovable.dev/v1/chat/completions";

const SAFETY_RULES = `You are the MedSafety AI Assistant, an educational medication-safety assistant.
Rules you must always follow:
- Give clear, simple, plain-language explanations. Avoid unnecessary jargon; explain any term you must use.
- You provide EDUCATIONAL information only. You never diagnose, never prescribe, and never claim to replace a doctor or pharmacist.
- Encourage the user to confirm anything important with their pharmacist or prescriber.
- If the question describes a possible emergency (chest pain, trouble breathing, severe bleeding, suspected overdose, anaphylaxis, stroke symptoms, suicidal thoughts), begin the answer by advising urgent/emergency medical attention.
- Prefer the structured database context supplied below over your own recall. If the context does not cover something, say so plainly instead of inventing medication facts.
- Keep answers under about 250 words unless the user asks for detail. Use short paragraphs or bullet points.`;

const ChatInput = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().min(1).max(4000),
      }),
    )
    .min(1)
    .max(30),
  context: z.string().max(12000).default(""),
  language: z.enum(["en", "ur", "roman"]).default("en"),
  task: z
    .enum(["chat", "prescription", "lab", "counseling"])
    .default("chat"),
});

const TASK_PROMPT: Record<string, string> = {
  chat: "Answer the user's medication question.",
  speech: "Convert Roman Urdu into fluent Urdu script for spoken playback. Output ONLY the faithful conversion; preserve drug names, quantities and units. Do not answer questions or add advice.",
  prescription:
    "The user has uploaded a prescription. Explain, in simple everyday language, what each medicine is for and how it should be taken. Add a note that OCR/AI extraction can contain errors and details must be verified with the pharmacist or prescriber.",
  lab: "The user has uploaded a laboratory report. Explain each flagged/abnormal result in simple language, what the reference range means, and general reasons a value can be outside range. Do not diagnose. State clearly this is educational only.",
  counseling:
    "Produce concise medication counseling points suitable for a pharmacist to share with a patient.",
};

type ChatMessage = { role: "system" | "user" | "assistant"; content: string | Array<{ type: "text"; text: string } | { type: "image_url"; image_url: { url: string } }> };

// Server-only Gemini adapter. Never send the API key to the browser.
async function callGemini(messages: ChatMessage[], apiKey: string) {
  const systemInstruction = messages.filter((m) => m.role === "system").map((m) => typeof m.content === "string" ? m.content : "").join("\n\n");
  const contents = messages.filter((m) => m.role !== "system").map((m) => {
    const rawParts = typeof m.content === "string" ? [{ type: "text" as const, text: m.content }] : m.content;
    const parts = rawParts.map((part) => {
      if (part.type === "text") return { text: part.text };
      const found = /^data:(image\/(?:jpeg|png|webp)|application\/pdf);base64,([A-Za-z0-9+/=]+)$/.exec(part.image_url.url);
      if (!found) throw new Error("Unsupported document format supplied for Gemini.");
      return { inlineData: { mimeType: found[1], data: found[2] } };
    });
    return { role: m.role === "assistant" ? "model" : "user", parts };
  });

  try {
    if (!/^[a-zA-Z0-9._-]+$/.test(GEMINI_MODEL)) {
      return { ok: false as const, status: 400, message: "Invalid GEMINI_MODEL setting. Use a model ID from Google AI Studio (for example, gemini-3.5-flash-lite)." };
    }
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemInstruction }] },
        contents,
        generationConfig: { temperature: 0.2, maxOutputTokens: 2048 },
      }),
    });
    if (!res.ok) {
      // Do not expose the raw upstream body (which could include sensitive data).
      const errorBody = await res.json().catch(() => ({})) as { error?: { message?: string; status?: string } };
      const status = errorBody.error?.status;
      if (res.status === 429) return { ok: false as const, status: 429, message: "Gemini free-tier request limit or quota reached. Check your project limits in Google AI Studio and retry later." };
      if (res.status === 400) return { ok: false as const, status: 400, message: "Gemini rejected this request. Check the selected model and uploaded file format." };
      if (res.status === 401 || res.status === 403) return { ok: false as const, status: res.status, message: "Gemini API access denied. Check GEMINI_API_KEY, project access, and regional eligibility in Google AI Studio." };
      if (res.status === 404) return { ok: false as const, status: 404, message: `Gemini model ${GEMINI_MODEL} is not available to this API key. In Google AI Studio, check which models allow generateContent, then set GEMINI_MODEL in .env.local and restart the server.` };
      console.error("Gemini API request failed", { httpStatus: res.status, providerStatus: status });
      return { ok: false as const, status: res.status, message: "Gemini could not process this request. Please try again later." };
    }
    const response = await res.json() as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> ; promptFeedback?: { blockReason?: string } };
    const answer = response.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("").trim() ?? "";
    if (!answer) return { ok: false as const, status: 422, message: response.promptFeedback?.blockReason ? "Gemini declined this request for safety reasons." : "Gemini returned no readable response. Try rephrasing your question." };
    return { ok: true as const, status: 200, message: answer };
  } catch (error) {
    console.error("Gemini connection error", error instanceof Error ? error.message : "unknown");
    return { ok: false as const, status: 503, message: "Could not contact Gemini. Check your internet connection and server logs." };
  }
}

async function callGateway(body: { model: string; messages: unknown[] }, apiKey: string, provider: "openai" | "lovable") {
  const isOpenAI = provider === "openai";
  const res = await fetch(isOpenAI ? "https://api.openai.com/v1/chat/completions" : GATEWAY, {
    method: "POST",
    headers: isOpenAI
      ? { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` }
      : { "Content-Type": "application/json", "Lovable-API-Key": apiKey, "X-Lovable-AIG-SDK": "fetch" },
    body: JSON.stringify({ ...body, model: isOpenAI ? OPENAI_MODEL : LOVABLE_MODEL }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    let message = text;
    try {
      const parsed = JSON.parse(text) as { error?: { message?: string }; message?: string };
      message = parsed.error?.message ?? parsed.message ?? text;
    } catch {
      /* keep raw text */
    }
    if (res.status === 429) {
      return { ok: false as const, status: 429, message: "The assistant is rate limited right now. Please try again in a moment." };
    }
    if (res.status === 402) {
      return { ok: false as const, status: 402, message: message || "AI credits are exhausted for this workspace." };
    }
    return { ok: false as const, status: res.status, message: message || "The assistant is unavailable right now." };
  }

  const data = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
  return { ok: true as const, status: 200, message: data.choices?.[0]?.message?.content?.trim() ?? "" };
}

export const askAssistant = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => ChatInput.parse(input))
  .handler(async ({ data }) => {
    const geminiKey = process.env["GEMINI_API_KEY"];
    const openAIKey = process.env["OPENAI_API_KEY"];
    const lovableKey = process.env["LOVABLE_API_KEY"];
    const apiKey = geminiKey || openAIKey || lovableKey;
    const provider = geminiKey ? "gemini" : openAIKey ? "openai" : "lovable";
    if (!apiKey) {
      return { ok: false, message: "AI service not configured. Add GEMINI_API_KEY to .env.local or your deployment's server environment and restart/redeploy." };
    }

    const system = [
      SAFETY_RULES,
      TASK_PROMPT[data.task] ?? TASK_PROMPT["chat"],
      data.language === "ur" ? "Answer in clear Urdu script. Preserve medicine names and dose units accurately." : data.language === "roman" ? "Answer in understandable Roman Urdu. Preserve medicine names and dose units accurately." : "Answer in English.",
      data.context
        ? `\n--- VERIFIED DATABASE CONTEXT (prefer this) ---\n${data.context}\n--- END CONTEXT ---`
        : "\nNo database context was retrieved for this question. Answer generally and say the platform database does not hold this entry.",
    ].join("\n\n");

    const messages: ChatMessage[] = [{ role: "system", content: system }, ...data.messages];
    const result = provider === "gemini"
      ? await callGemini(messages, apiKey)
      : await callGateway({ model: provider === "openai" ? OPENAI_MODEL : LOVABLE_MODEL, messages }, apiKey, provider);

    return { ok: result.ok, message: result.message };
  });

const ExtractInput = z.object({
  kind: z.enum(["prescription", "lab"]),
  fileName: z.string().max(200),
  text: z.string().max(20000).default(""),
  imageDataUrl: z.string().max(12000000).optional(),
});

export const extractDocument = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => ExtractInput.parse(input))
  .handler(async ({ data }) => {
    const geminiKey = process.env["GEMINI_API_KEY"];
    const openAIKey = process.env["OPENAI_API_KEY"];
    const lovableKey = process.env["LOVABLE_API_KEY"];
    const apiKey = geminiKey || openAIKey || lovableKey;
    const provider = geminiKey ? "gemini" : openAIKey ? "openai" : "lovable";
    if (!apiKey) return { ok: false, message: "AI service not configured. Add GEMINI_API_KEY to .env.local or your deployment's server environment and restart/redeploy." };

    const schemaHint =
      data.kind === "prescription"
        ? `Return STRICT JSON: {"items":[{"medicine":"","strength":"","dose":"","frequency":"","route":"","duration":"","prn":"","instructions":"","explanation":""}],"summary":""}
Never infer a missing or unclear dose, duration, route or frequency. "explanation" must be a one-sentence plain-language explanation, not a new dosing instruction.`
        : `Return STRICT JSON: {"rows":[{"test":"","result":"","unit":"","range":"","status":"Normal|Low|High|Critical|Unknown","explanation":""}],"summary":""}
Use the exact reference range printed on the report; do not substitute generic ranges. Mark unclear values as Unknown, not Normal. "explanation" is only needed for abnormal rows and must be educational, never a diagnosis.`;

    if (!data.imageDataUrl && !data.text.trim()) {
      return { ok: false, message: "No readable document content was provided. Please upload a clear PDF, image, or text file." };
    }
    const source = data.text
      ? `Document text supplied by the user:\n${data.text}`
      : `Read the attached medical document (PDF or image). Extract ONLY visibly legible information, including from all pages. Leave uncertain fields blank; never invent medicines, doses, results or reference ranges.`;
    if (data.imageDataUrl && !/^data:(?:image\/(?:jpeg|png|webp)|application\/pdf);base64,[A-Za-z0-9+/=]+$/.test(data.imageDataUrl)) {
      return { ok: false, message: "Unsupported file format. Use PDF, JPG, PNG, or WebP." };
    }

    const messages: ChatMessage[] = [
      {
        role: "system",
        content: `${SAFETY_RULES}\n\nYou extract only facts actually visible in medical documents, never fabricate content. If text is illegible leave fields blank. ${schemaHint}\nRespond with JSON only — no markdown fences, no commentary.`,
      },
      { role: "user", content: data.imageDataUrl
        ? [{ type: "text", text: source }, { type: "image_url", image_url: { url: data.imageDataUrl } }]
        : source },
    ];
    if (data.imageDataUrl?.startsWith("data:application/pdf;") && provider !== "gemini") {
      return { ok: false, message: "PDF analysis requires GEMINI_API_KEY. Configure Gemini or upload a clear page image." };
    }
    const result = provider === "gemini"
      ? await callGemini(messages, apiKey)
      : await callGateway({ model: provider === "openai" ? OPENAI_MODEL : LOVABLE_MODEL, messages }, apiKey, provider);

    if (!result.ok) return { ok: false, message: result.message };

    const cleaned = result.message.replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();
    try {
      const parsed: unknown = JSON.parse(cleaned);
      const Field = z.string().nullish().transform((v) => v ?? "");
      const prescriptionSchema = z.object({
        items: z.array(z.object({ medicine: Field, strength: Field, dose: Field, frequency: Field, route: Field, duration: Field, prn: Field, instructions: Field, explanation: Field })).max(80).default([]),
        summary: Field,
      });
      const labSchema = z.object({
        rows: z.array(z.object({ test: Field, result: Field, unit: Field, range: Field, status: Field, explanation: Field })).max(150).default([]),
        summary: Field,
      });
      const checked = data.kind === "prescription" ? prescriptionSchema.parse(parsed) : labSchema.parse(parsed);
      if (("items" in checked && checked.items.length === 0) || ("rows" in checked && checked.rows.length === 0)) {
        return { ok: false, message: "No readable medical entries were found. Try a clearer scan or PDF." };
      }
      return { ok: true, data: checked };
    } catch {
      return { ok: false, message: "The analysis could not be read. Please try uploading the document again." };
    }
  });
