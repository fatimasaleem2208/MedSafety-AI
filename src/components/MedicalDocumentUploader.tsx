import { useEffect, useRef, useState } from "react";
import { Camera, FileText, Image as ImageIcon, RotateCcw, X } from "lucide-react";
import { toast } from "sonner";

export const MAX_DOCUMENT_BYTES = 8 * 1024 * 1024;
export type DocumentSelection = { file: File; previewUrl?: string };

export function MedicalDocumentUploader({ onAnalyze, busy, kind }: {
  onAnalyze: (file: File) => Promise<void>;
  busy: boolean;
  kind: "prescription" | "lab report";
}) {
  const pdfRef = useRef<HTMLInputElement>(null);
  const imageRef = useRef<HTMLInputElement>(null);
  const cameraFallbackRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [selected, setSelected] = useState<DocumentSelection | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  function stopCamera() {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setCameraOpen(false);
  }

  useEffect(() => {
    if (!cameraOpen || !streamRef.current || !videoRef.current) return;
    videoRef.current.srcObject = streamRef.current;
    void videoRef.current.play().catch(() => setCameraError("Camera preview could not start. Use the fallback camera button."));
  }, [cameraOpen]);

  useEffect(() => () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
  }, []);

  async function openCamera() {
    if (busy) return;
    setCameraError(null);
    if (!navigator.mediaDevices?.getUserMedia || !window.isSecureContext) {
      // Camera capture through file inputs is the broadly compatible fallback, especially on iOS.
      cameraFallbackRef.current?.click();
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: { facingMode: { ideal: "environment" }, width: { ideal: 1920 }, height: { ideal: 1080 } },
      });
      streamRef.current = stream;
      setCameraOpen(true);
    } catch (error) {
      const name = error instanceof DOMException ? error.name : "";
      setCameraError(name === "NotAllowedError"
        ? "Camera permission was denied. Allow camera access in your browser settings, or use the camera fallback."
        : "Could not open the camera. You can try the device's camera app instead.");
    }
  }

  function takePhoto() {
    const video = videoRef.current;
    if (!video || !video.videoWidth || !video.videoHeight) {
      toast.error("Camera is not ready yet. Please try again.");
      return;
    }
    const canvas = document.createElement("canvas");
    const scale = Math.min(1, 1920 / video.videoWidth);
    canvas.width = Math.round(video.videoWidth * scale);
    canvas.height = Math.round(video.videoHeight * scale);
    const ctx = canvas.getContext("2d");
    if (!ctx) { toast.error("Unable to capture this photo."); return; }
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    canvas.toBlob((blob) => {
      if (!blob) { toast.error("Photo capture failed. Please try again."); return; }
      choose(new File([blob], `${kind.replaceAll(" ", "-")}-${Date.now()}.jpg`, { type: "image/jpeg" }));
      stopCamera();
    }, "image/jpeg", 0.88);
  }

  function choose(file?: File) {
    if (!file) return;
    if (!["application/pdf", "image/jpeg", "image/png", "image/webp", "text/plain"].includes(file.type)) {
      toast.error("Please choose a PDF, JPG, PNG, WebP or TXT file."); return;
    }
    if (file.size > MAX_DOCUMENT_BYTES) { toast.error("Maximum file size is 8 MB."); return; }
    setPreview((old) => {
      if (old) URL.revokeObjectURL(old);
      return file.type.startsWith("image/") ? URL.createObjectURL(file) : null;
    });
    setSelected({ file });
  }
  function clear() {
    setPreview((old) => { if (old) URL.revokeObjectURL(old); return null; });
    setSelected(null);
    [pdfRef, imageRef, cameraFallbackRef].forEach((r) => { if (r.current) r.current.value = ""; });
  }

  return <div className="mt-3 space-y-3">
    <p className="text-sm text-inksoft">Upload a PDF, choose a photo or take a new picture of your {kind}.</p>
    <div className="grid grid-cols-3 gap-2">
      <button type="button" disabled={busy} onClick={() => pdfRef.current?.click()} className="rounded-lg bg-panel2 ring-1 ring-ink/10 p-3 flex flex-col items-center gap-2 hover:ring-brand/40 disabled:opacity-50"><FileText size={23}/><span className="text-xs">Upload PDF</span></button>
      <button type="button" disabled={busy} onClick={() => imageRef.current?.click()} className="rounded-lg bg-panel2 ring-1 ring-ink/10 p-3 flex flex-col items-center gap-2 hover:ring-brand/40 disabled:opacity-50"><ImageIcon size={23}/><span className="text-xs">Gallery</span></button>
      <button type="button" disabled={busy} onClick={() => void openCamera()} className="rounded-lg bg-panel2 ring-1 ring-ink/10 p-3 flex flex-col items-center gap-2 hover:ring-brand/40 disabled:opacity-50"><Camera size={23}/><span className="text-xs">Take Photo</span></button>
    </div>
    <input ref={pdfRef} aria-label="Choose PDF document" type="file" accept="application/pdf,.pdf" className="sr-only" onChange={(e) => choose(e.target.files?.[0])}/>
    <input ref={imageRef} aria-label="Choose image from gallery" type="file" accept="image/jpeg,image/png,image/webp,text/plain" className="sr-only" onChange={(e) => choose(e.target.files?.[0])}/>
    <input ref={cameraFallbackRef} aria-label="Capture image using device camera" type="file" accept="image/*" capture="environment" className="sr-only" onChange={(e) => choose(e.target.files?.[0])}/>
    {cameraError && <div role="alert" className="rounded-lg bg-panel2 p-3 text-sm text-caution space-y-2"><p>{cameraError}</p><button type="button" className="underline" onClick={() => cameraFallbackRef.current?.click()}>Try device camera</button></div>}
    {cameraOpen && <div role="dialog" aria-modal="true" aria-label="Take document photo" className="rounded-xl bg-panel2 p-3 ring-1 ring-brand/30 space-y-3">
      <div className="flex items-center justify-between"><strong className="text-sm">Take a clear photo</strong><button type="button" aria-label="Close camera" onClick={stopCamera}><X size={20}/></button></div>
      <video ref={videoRef} autoPlay playsInline muted className="w-full max-h-[60vh] object-contain rounded-lg bg-black" />
      <div className="flex gap-2"><button type="button" onClick={takePhoto} className="flex-1 rounded-lg bg-brand text-seam py-3 text-sm font-semibold flex items-center justify-center gap-2"><Camera size={18}/> Capture Photo</button><button type="button" onClick={stopCamera} className="rounded-lg ring-1 ring-ink/20 px-4 text-sm">Cancel</button></div>
      <p className="text-xs text-inksoft">Place the entire page inside the frame, with good light and readable text.</p>
    </div>}
    {selected && <div className="rounded-lg bg-panel2 ring-1 ring-ink/10 p-3 space-y-3">
      {preview && <img alt="Document preview" src={preview} className="w-full max-h-72 object-contain rounded-lg"/>}
      <div className="flex gap-2 items-center justify-between"><span className="text-xs text-ink break-all">{selected.file.name}</span><button aria-label="Remove selected document" type="button" onClick={clear}><X size={18}/></button></div>
      {selected.file.type === "application/pdf" && <p className="text-xs text-inksoft">PDF ready. Gemini will analyze its pages directly. Please use fictional or consented documents only.</p>}
      <button type="button" disabled={busy} onClick={() => void onAnalyze(selected.file)} className="w-full rounded-md bg-brand text-seam px-3 py-2 text-sm font-medium disabled:opacity-40">{busy ? "Analyzing…" : "Analyze Document"}</button>
      <button type="button" disabled={busy} onClick={clear} className="text-xs text-inksoft flex items-center gap-1"><RotateCcw size={14}/> Choose another file</button>
    </div>}
    <p className="font-mono text-[10px] text-inksoft">JPG · PNG · WebP · PDF · max 8MB. Verify every extracted medical detail. Camera access requires HTTPS or localhost.</p>
  </div>;
}
