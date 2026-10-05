"use client";

import { Camera } from "lucide-react";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { parseNutritionLabel, type LabelDraft } from "@/lib/label-ocr";

/**
 * Reads a photo of a nutrition label in the browser (Tesseract OCR) and
 * hands back a draft. Nothing is saved: the form shows the values for the
 * person to check.
 */
export function LabelPhotoButton({ onDraft }: { onDraft: (d: LabelDraft) => void }) {
  const input = useRef<HTMLInputElement>(null);
  const [state, setState] = useState<{ kind: "idle" } | { kind: "reading"; progress: number } | { kind: "error"; message: string }>({
    kind: "idle",
  });

  const read = async (file: File) => {
    setState({ kind: "reading", progress: 0 });
    try {
      const { createWorker } = await import("tesseract.js");
      const worker = await createWorker("eng", 1, {
        logger: (m: { status: string; progress: number }) => {
          if (m.status === "recognizing text") setState({ kind: "reading", progress: m.progress });
        },
      });
      const { data } = await worker.recognize(file);
      await worker.terminate();
      const draft = parseNutritionLabel(data.text);
      if (!Object.keys(draft.values).length) {
        setState({ kind: "error", message: "Couldn't read any values. Try a sharper, straight-on photo, or type them in." });
        return;
      }
      onDraft(draft);
      setState({ kind: "idle" });
    } catch {
      setState({ kind: "error", message: "Reading the photo failed. You can type the values in instead." });
    }
  };

  return (
    <div>
      <input
        ref={input}
        type="file"
        accept="image/*"
        capture="environment"
        className="sr-only"
        aria-label="Photo of a nutrition label"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) read(f);
          e.target.value = "";
        }}
      />
      <Button variant="secondary" size="sm" onClick={() => input.current?.click()} disabled={state.kind === "reading"}>
        <Camera />
        {state.kind === "reading" ? `Reading label… ${Math.round(state.progress * 100)}%` : "Read from a label photo"}
      </Button>
      {state.kind === "error" ? <p className="mt-2 text-xs text-danger">{state.message}</p> : null}
    </div>
  );
}
