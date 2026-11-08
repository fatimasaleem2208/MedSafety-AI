import { Mic, MicOff, Volume2, Square } from "lucide-react";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useRef, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Disclaimer, PageHeader, Panel, SectionLabel, SourceTag } from "@/components/Bits";
import { MEDICINES, searchMedicines } from "@/data/medicines";
import { INTERACTIONS } from "@/data/interactions";
import { askAssistant } from "@/lib/ai.functions";

export const Route = createFileRoute("/assistant")({
  validateSearch: (search: Record<string, unknown>) => ({
    q: typeof search["q"] === "string" ? search["q"].slice(0, 400) : undefined,
  }),
  head: () => ({
    meta: [
      { title: "AI Medication Assistant — MedSafety AI" },
      { name: "description", content: "Ask questions about medicines, prescriptions, interactions and side effects — grounded in the MedSafety medicine database." },
      { property: "og:title", content: "AI Medication Assistant — MedSafety AI" },
      { property: "og:description", content: "Educational, database-grounded answers about medication safety." },
    ],
  }),
  component: AssistantPage,
});

type Msg = { role: "user" | "assistant"; content: string; at: string };

const PROMPTS = [
  { label: "Medicine Information", q: "What is metformin used for and how should I take it?" },
  { label: "Drug Interaction", q: "Can I take ciprofloxacin with metformin?" },
  { label: "Side Effects", q: "What are the common side effects of amoxicillin?" },
  { label: "Prescription Explanation", q: "What does PRN mean on a prescription?" },
  { label: "Lab Report Explanation", q: "My HbA1c is 8.2% — what does that mean in simple terms?" },
];

function buildContext(question: string) {
  const hits = searchMedicines(question).slice(0, 3);
  const pool = hits.length ? hits : MEDICINES.filter((m) => question.toLowerCase().includes(m.generic.toLowerCase().split(" ")[0]!));
  const meds = (pool.length ? pool : []).slice(0, 3);

  const medBlocks = meds.map((m) =>
    [
      `MEDICINE: ${m.generic} (brands: ${m.brands.join(", ")})`,
      `Class: ${m.drugClass} | Category: ${m.category}`,
      `Forms/strengths: ${m.forms.join(", ")} — ${m.strengths.join(", ")}`,
      `Indications: ${m.indications.join("; ")}`,
      `Adult dosing: ${m.adultDosing}`,
      `Paediatric dosing: ${m.pediatricDosing}`,
      `Common side effects: ${m.commonSideEffects.join("; ")}`,
      `Serious effects: ${m.seriousEffects.join("; ")}`,
      `Contraindications: ${m.contraindications.join("; ")}`,
      `Precautions: ${m.precautions.join("; ")}`,
      `Interactions: ${m.interactions.join("; ")}`,
      `Food: ${m.foodInteractions}`,
      `Pregnancy/lactation: ${m.pregnancy}`,
      `Counseling: ${m.counseling.join("; ")}`,
    ].join("\n"),
  );

  const ids = meds.map((m) => m.id);
  const ints = INTERACTIONS.filter((i) => ids.includes(i.a) || ids.includes(i.b))
    .slice(0, 6)
    .map((i) => `INTERACTION: ${i.a} + ${i.b} — ${i.severity}. ${i.description} Effect: ${i.clinicalEffect} Advice: ${i.recommendation}`);

  return [...medBlocks, ...ints].join("\n\n");
}

function AssistantPage() {
  const { q } = Route.useSearch();
  const ask = useServerFn(askAssistant);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [language, setLanguage] = useState<"en" | "ur" | "roman">("en");
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef<{ stop: () => void } | null>(null);
  const [voiceSupported, setVoiceSupported] = useState(false);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [voiceError, setVoiceError] = useState("");
  const [speakingBusy, setSpeakingBusy] = useState(false);
  const [selectedVoice, setSelectedVoice] = useState("");

  useEffect(() => {
    setVoiceSupported(Boolean((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition));
    const updateVoices = () => setAvailableVoices(window.speechSynthesis?.getVoices() ?? []);
    updateVoices();
    window.speechSynthesis?.addEventListener("voiceschanged", updateVoices);
    return () => {
      recognitionRef.current?.stop();
      window.speechSynthesis?.cancel();
      window.speechSynthesis?.removeEventListener("voiceschanged", updateVoices);
    };
  }, []);

  function startListening() {
    if (listening) { recognitionRef.current?.stop(); setListening(false); return; }
    const w = window as any;
    const SpeechRecognition = w.SpeechRecognition || w.webkitSpeechRecognition;
    if (!SpeechRecognition) return;
    const recognizer = new SpeechRecognition();
    recognizer.lang = language === "en" ? "en-US" : "ur-PK";
    recognizer.interimResults = false;
    recognizer.maxAlternatives = 1;
    recognizer.onresult = (event: any) => setInput((prior) => [prior, event.results[0][0].transcript].filter(Boolean).join(" "));
    recognizer.onerror = () => setListening(false);
    recognizer.onend = () => setListening(false);
    recognitionRef.current = recognizer;
    try { recognizer.start(); setListening(true); } catch { setListening(false); }
  }

  async function speak(text: string) {
    if (!("speechSynthesis" in window) || speakingBusy) return;
    setVoiceError("");
    window.speechSynthesis.cancel();
    const voices = window.speechSynthesis.getVoices();
    const preferred = selectedVoice ? voices.find(v => v.voiceURI === selectedVoice) : undefined;
    const urduVoice = voices.find(v => /^ur(?:-|$)/i.test(v.lang));
    const englishVoice = voices.find(v => /^en(?:-|$)/i.test(v.lang));
    const chosen = preferred && (language === "en" ? /^en(?:-|$)/i.test(preferred.lang) : /^ur(?:-|$)/i.test(preferred.lang))
      ? preferred : language === "en" ? englishVoice : urduVoice;
    if (!chosen && language !== "en") {
      setVoiceError("No Urdu speech voice is installed in this browser/device. English speech still works. Install an Urdu TTS voice or connect a cloud Urdu text-to-speech service; the app will not read Urdu with an English voice.");
      return;
    }
    setSpeakingBusy(true);
    try {
      let spokenText = text;
      if (language === "roman") {
        // Roman Urdu is not a TTS language. Convert to Urdu script for Urdu voice playback.
        const translated = await ask({ data: {
          messages: [{role: "user", content: `Convert this Roman Urdu text to natural Urdu script for speech synthesis. Preserve medicine names, numbers, doses, units and meaning exactly. Return ONLY the Urdu script, without explanation:\n\n${text.slice(0, 3500)}`}],
          context: "", task: "speech", language: "ur",
        }});
        if (!translated.ok || !translated.message) throw new Error("Could not prepare Roman Urdu speech.");
        spokenText = translated.message;
      }
      const utterance = new SpeechSynthesisUtterance(spokenText);
      utterance.lang = language === "en" ? "en-US" : "ur-PK";
      if (chosen) utterance.voice = chosen;
      utterance.rate = 0.88;
      utterance.onend = () => setSpeakingBusy(false);
      utterance.onerror = () => { setSpeakingBusy(false); setVoiceError("Speech playback failed on this device."); };
      window.speechSynthesis.speak(utterance);
    } catch {
      setSpeakingBusy(false);
      setVoiceError("Unable to prepare speech. Please try again.");
    }
  }
  const endRef = useRef<HTMLDivElement>(null);
  const sentInitial = useRef(false);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, busy]);

  async function send(text: string) {
    const clean = text.trim().slice(0, 1000);
    if (!clean || busy) return;
    const next: Msg[] = [...messages, { role: "user", content: clean, at: new Date().toISOString() }];
    setMessages(next);
    setInput("");
    setBusy(true);
    try {
      const res = await ask({
        data: {
          messages: next.slice(-12).map((m) => ({ role: m.role, content: m.content })),
          context: buildContext(clean),
          task: "chat",
          language,
        },
      });
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          content: res.ok && res.message ? res.message : res.message || "The assistant is unavailable right now. Please try again.",
          at: new Date().toISOString(),
        },
      ]);
    } catch {
      setMessages((m) => [
        ...m,
        { role: "assistant", content: "Something went wrong reaching the assistant. Please try again.", at: new Date().toISOString() },
      ]);
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    if (q && !sentInitial.current) {
      sentInitial.current = true;
      void send(q);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  return (
    <AppShell>
      <PageHeader
        label="AI assistant"
        title="MedSafety AI Assistant"
        description="Ask questions about medicines, prescriptions, drug interactions, side effects, and medication safety."
        action={
          messages.length > 0 ? (
            <button
              onClick={() => setMessages([])}
              className="px-3.5 py-2 rounded-md ring-1 ring-ink/15 text-inksoft text-sm hover:text-ink"
            >
              Clear chat
            </button>
          ) : undefined
        }
      />

      <div className="grid lg:grid-cols-12 gap-4">
        <Panel className="lg:col-span-8 flex flex-col min-h-[60vh]">
          <div className="flex items-center justify-between">
            <SectionLabel>Conversation</SectionLabel>
            <select aria-label="Assistant response language" value={language} onChange={e => setLanguage(e.target.value as "en" | "ur" | "roman")} className="bg-panel2 text-ink text-xs rounded-md px-2 py-1 ring-1 ring-ink/10">
              <option value="en">English</option><option value="ur">اردو</option><option value="roman">Roman Urdu</option>
            </select>
            <SourceTag kind="ai" />
          </div>

          <div className="mt-2 flex flex-wrap gap-2 items-center text-xs text-inksoft">
            <label htmlFor="tts-voice">Speech voice:</label>
            <select id="tts-voice" value={selectedVoice} onChange={e => setSelectedVoice(e.target.value)} className="bg-panel2 text-ink rounded-md px-2 py-1 ring-1 ring-ink/10">
              <option value="">Automatic</option>
              {availableVoices.filter(v => language === "en" ? /^en(?:-|$)/i.test(v.lang) : /^ur(?:-|$)/i.test(v.lang)).map(v => <option key={v.voiceURI} value={v.voiceURI}>{v.name} ({v.lang})</option>)}
            </select>
            {language !== "en" && !availableVoices.some(v => /^ur(?:-|$)/i.test(v.lang)) && <span>Urdu voice not installed on this device</span>}
          </div>
          {voiceError && <p role="alert" className="mt-2 text-xs text-amber-700">{voiceError}</p>}
          <div className="flex-1 mt-4 space-y-3 overflow-y-auto max-h-[55vh] pr-1">
            {messages.length === 0 && (
              <div className="rounded-lg bg-panel2 ring-1 ring-ink/10 p-4">
                <p className="font-sans text-sm text-ink">
                  Ask me anything about your medicines. I answer using the MedSafety medicine database and always tell you when
                  something needs a pharmacist or doctor.
                </p>
              </div>
            )}
            {messages.map((m, i) => (
              <div key={i} className={m.role === "user" ? "flex justify-end" : "flex justify-start"}>
                <div
                  className={`max-w-[85%] rounded-xl px-4 py-3 ring-1 ${
                    m.role === "user" ? "bg-brand/12 ring-brand/25" : "bg-panel2 ring-ink/10"
                  }`}
                >
                  <p className="font-sans text-sm text-ink whitespace-pre-wrap text-pretty">{m.content}</p>
                  {m.role === "assistant" && <button type="button" onClick={() => void speak(m.content)} disabled={speakingBusy} className="flex gap-1 items-center text-xs text-brand mt-2" aria-label="Read this answer aloud"><Volume2 size={14}/> Listen</button>}
                  <p className="font-mono text-[10px] text-inksoft mt-2">
                    {m.role === "user" ? "You" : "MedSafety AI"} ·{" "}
                    {new Date(m.at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
              </div>
            ))}
            {busy && (
              <div className="flex justify-start">
                <div className="rounded-xl px-4 py-3 bg-panel2 ring-1 ring-ink/10 flex items-center gap-1.5">
                  {[0, 1, 2].map((d) => (
                    <span
                      key={d}
                      className="size-1.5 rounded-full bg-brand animate-pulse"
                      style={{ animationDelay: `${d * 150}ms` }}
                    />
                  ))}
                  <span className="font-mono text-[10px] text-inksoft ml-1.5">Thinking…</span>
                </div>
              </div>
            )}
            <div ref={endRef} />
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              void send(input);
            }}
            className="mt-4 flex gap-2"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              maxLength={1000}
              aria-label="Ask the assistant"
              placeholder="Ask about a medicine, dose, side effect or interaction…"
              className="flex-1 rounded-lg bg-panel2 ring-1 ring-ink/10 px-4 py-3 text-sm text-ink outline-none focus:ring-brand/50"
            />
            <button type="button" onClick={startListening} disabled={!voiceSupported || busy} title={!voiceSupported ? "Voice recognition is unavailable in this browser" : listening ? "Stop recording" : "Speak your question"} aria-label={listening ? "Stop listening" : "Speak question"} className="rounded-lg bg-panel2 ring-1 ring-ink/10 px-3 text-brand disabled:opacity-40">{listening ? <MicOff size={19}/> : <Mic size={19}/>}</button>
            <button type="button" onClick={() => { window.speechSynthesis?.cancel(); setSpeakingBusy(false); }} aria-label="Stop spoken answer" className="rounded-lg bg-panel2 ring-1 ring-ink/10 px-2 text-inksoft"><Square size={15}/></button>
            <button
              type="submit"
              disabled={busy || !input.trim()}
              className="px-4 py-2 rounded-md bg-brand text-seam text-sm font-medium disabled:opacity-40 hover:bg-brand/90 transition-colors"
            >
              Send
            </button>
          </form>
        </Panel>

        <div className="lg:col-span-4 space-y-4">
          <Panel>
            <SectionLabel>Suggested prompts</SectionLabel>
            <div className="mt-3 space-y-2">
              {PROMPTS.map((p) => (
                <button
                  key={p.label}
                  onClick={() => void send(p.q)}
                  disabled={busy}
                  className="w-full text-left rounded-lg bg-panel2 ring-1 ring-ink/10 p-3 hover:ring-brand/40 transition-colors disabled:opacity-50"
                >
                  <p className="font-mono text-[10px] uppercase tracking-wide text-brand">{p.label}</p>
                  <p className="font-sans text-sm text-ink mt-1 text-pretty">{p.q}</p>
                </button>
              ))}
            </div>
          </Panel>

          <Panel>
            <SectionLabel>How answers are produced</SectionLabel>
            <div className="mt-3 space-y-2">
              <SourceTag kind="database" />
              <p className="font-sans text-sm text-inksoft text-pretty">
                Structured monographs and interaction records are retrieved from the platform database and given to the model.
              </p>
              <SourceTag kind="ai" />
              <p className="font-sans text-sm text-inksoft text-pretty">
                The model turns that data into plain-language explanation. It never diagnoses or prescribes.
              </p>
            </div>
          </Panel>
        </div>
      </div>

      <Disclaimer>
        The assistant provides educational information only and does not replace a doctor or pharmacist. In an emergency, seek
        urgent medical care immediately.
      </Disclaimer>
    </AppShell>
  );
}
