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

type Status = { kind: "idle" } | { kind: "looking"; code: string } | { kind: "missing"; code: string } | { kind: "error"; message: string };

/**
 * Camera scanning uses the browser's BarcodeDetector where available
 * (Chrome on Android, recent desktop Chrome). Everywhere else the
 * barcode can be typed in.
 */
export function BarcodeScanner({ onFound }: { onFound: (food: FoodDTO) => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [supported] = useState(() => typeof window !== "undefined" && !!window.BarcodeDetector);
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
    const detector = new window.BarcodeDetector!({ formats: ["ean_13", "ean_8", "upc_a", "upc_e"] });
    (async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
        if (stopped || !videoRef.current) return;
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        const tick = async () => {
          if (stopped || !videoRef.current) return;
          try {
            const codes = await detector.detect(videoRef.current);
            const code = codes.find((c) => /^\d{6,14}$/.test(c.rawValue))?.rawValue;
            if (code && !busy.current) await lookup(code);
          } catch {}
          raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
      } catch {
        setCameraError("Camera access was blocked. You can type the barcode instead.");
      }
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
          <video ref={videoRef} muted playsInline className="h-full w-full object-cover" />
          <div className="pointer-events-none absolute inset-x-10 top-1/2 h-24 -translate-y-1/2 rounded-control border-2 border-white/70" />
        </div>
      ) : (
        <p className="rounded-control bg-subtle px-3 py-2 text-[13px] text-muted">
          {cameraError ?? "Camera scanning isn't supported in this browser. Type the numbers under the barcode instead."}
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
