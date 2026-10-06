"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api, ApiError } from "@/lib/queries/fetcher";
import type { FoodDTO } from "@/lib/types";

interface DetectedBarcode {
  rawValue: string;
}
interface BarcodeDetectorLike {
  detect(source: CanvasImageSource): Promise<DetectedBarcode[]>;
}
declare global {
  interface Window {
    BarcodeDetector?: new (opts?: { formats?: string[] }) => BarcodeDetectorLike;
  }
}

/** Reads one frame of the video and returns a barcode number, if any. */
type FrameReader = (video: HTMLVideoElement) => Promise<string | undefined>;

const isBarcode = (v: string) => /^\d{6,14}$/.test(v);

async function makeFrameReader(): Promise<FrameReader> {
  if (window.BarcodeDetector) {
    const detector = new window.BarcodeDetector({ formats: ["ean_13", "ean_8", "upc_a", "upc_e"] });
    return async (video) => (await detector.detect(video)).map((c) => c.rawValue).find(isBarcode);
  }
  // Safari (iPhone and Mac) and Firefox have no BarcodeDetector, so decode
  // frames in JavaScript instead. Loaded only when needed.
  const [{ BrowserMultiFormatOneDReader }, { BarcodeFormat, DecodeHintType }] = await Promise.all([
    import("@zxing/browser"),
    import("@zxing/library"),
  ]);
  const hints = new Map<number, unknown>([
    [DecodeHintType.POSSIBLE_FORMATS, [BarcodeFormat.EAN_13, BarcodeFormat.EAN_8, BarcodeFormat.UPC_A, BarcodeFormat.UPC_E]],
    [DecodeHintType.TRY_HARDER, true],
  ]);
  const reader = new BrowserMultiFormatOneDReader(hints);
  const canvas = document.createElement("canvas");
  return async (video) => {
    if (!video.videoWidth) return undefined;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d", { willReadFrequently: true })?.drawImage(video, 0, 0);
    try {
      const text = reader.decodeFromCanvas(canvas).getText();
      return isBarcode(text) ? text : undefined;
    } catch {
      return undefined; // no barcode in this frame
    }
  };
}

function cameraErrorMessage(e: unknown): string {
  const name = e instanceof DOMException ? e.name : "";
  if (name === "NotAllowedError" || name === "SecurityError")
    return "Camera access was blocked. Allow the camera for this site in your browser settings, then reopen the scanner. You can also type the barcode below.";
  if (name === "NotFoundError" || name === "OverconstrainedError") return "No camera was found. Type the barcode below instead.";
  if (name === "NotReadableError") return "The camera is in use by another app. Close it and try again, or type the barcode below.";
  return "The camera couldn't start. You can type the barcode below instead.";
}

type Status = { kind: "idle" } | { kind: "looking"; code: string } | { kind: "missing"; code: string } | { kind: "error"; message: string };

/**
 * Camera scanning uses the browser's BarcodeDetector where available
 * (Chrome on Android, recent desktop Chrome) and a JavaScript decoder
 * (ZXing) everywhere else, including Safari. The camera needs HTTPS;
 * without it the barcode can be typed in.
 */
export function BarcodeScanner({ onFound }: { onFound: (food: FoodDTO) => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [supported] = useState(() => typeof navigator !== "undefined" && !!navigator.mediaDevices?.getUserMedia);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [manual, setManual] = useState("");
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const busy = useRef(false);

  const lookup = async (code: string) => {
    if (busy.current) return;
    busy.current = true;
    setStatus({ kind: "looking", code });
    try {
      onFound(await api<FoodDTO>(`/api/foods/barcode/${code}`));
      setStatus({ kind: "idle" });
    } catch (e) {
      setStatus(e instanceof ApiError && e.status === 404 ? { kind: "missing", code } : { kind: "error", message: (e as Error).message });
    } finally {
      busy.current = false;
    }
  };

  useEffect(() => {
    if (!supported) return;
    let stream: MediaStream | null = null;
    let raf = 0;
    let stopped = false;
    (async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: { facingMode: { ideal: "environment" }, width: { ideal: 1280 }, height: { ideal: 720 } },
        });
      } catch (e) {
        setCameraError(cameraErrorMessage(e));
        return;
      }
      if (stopped || !videoRef.current) return stream.getTracks().forEach((t) => t.stop());
      const video = videoRef.current;
      video.srcObject = stream;
      try {
        await video.play();
      } catch {
        // iOS can refuse autoplay until the first tap; the frames still arrive once it plays.
      }
      let readFrame: FrameReader;
      try {
        readFrame = await makeFrameReader();
      } catch {
        stream.getTracks().forEach((t) => t.stop());
        setCameraError("Barcode scanning couldn't load. Type the barcode below instead.");
        return;
      }
      let last = 0;
      const tick = async (now: number) => {
        if (stopped) return;
        // Decoding in JavaScript is heavy; a few frames a second is plenty.
        if (now - last > 200 && video.readyState >= 2) {
          last = now;
          try {
            const code = await readFrame(video);
            if (code && !busy.current) await lookup(code);
          } catch {}
        }
        if (!stopped) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    })();
    return () => {
      stopped = true;
      cancelAnimationFrame(raf);
      stream?.getTracks().forEach((t) => t.stop());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supported]);

  return (
    <div className="grid gap-4">
      {supported && !cameraError ? (
        <div className="relative aspect-[4/3] overflow-hidden rounded-panel bg-black">
          <video ref={videoRef} autoPlay muted playsInline onClick={(e) => e.currentTarget.play().catch(() => {})} className="h-full w-full object-cover" />
          <div className="pointer-events-none absolute inset-x-10 top-1/2 h-24 -translate-y-1/2 rounded-control border-2 border-white/70" />
        </div>
      ) : (
        <p className="rounded-control bg-subtle px-3 py-2 text-[13px] text-muted">
          {cameraError ?? "This browser can't open the camera here. Type the numbers under the barcode instead."}
        </p>
      )}
      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (/^\d{6,14}$/.test(manual)) lookup(manual);
        }}
      >
        <Input
          inputMode="numeric"
          placeholder="Barcode number"
          aria-label="Barcode number"
          value={manual}
          onChange={(e) => setManual(e.target.value.replace(/\D/g, ""))}
        />
        <Button type="submit" variant="secondary" disabled={!/^\d{6,14}$/.test(manual) || status.kind === "looking"}>
          Look up
        </Button>
      </form>
      <div aria-live="polite" className="text-[13px]">
        {status.kind === "looking" ? <p className="text-muted">Looking up {status.code}…</p> : null}
        {status.kind === "missing" ? (
          <p className="text-muted">
            We couldn&apos;t find {status.code}.{" "}
            <Link href={`/foods/new?barcode=${status.code}`} className="font-medium text-accent hover:underline">
              Add it from the label
            </Link>
          </p>
        ) : null}
        {status.kind === "error" ? <p className="text-danger">{status.message}</p> : null}
      </div>
    </div>
  );
}
