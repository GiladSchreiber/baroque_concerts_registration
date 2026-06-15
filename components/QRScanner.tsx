"use client";

import { useEffect, useRef, useState } from "react";

type Props = {
  onScan: (value: string) => void;
  active: boolean;
};

export function QRScanner({ onScan, active }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animRef = useRef<number>(0);
  const lastScannedRef = useRef<string>("");
  const [error, setError] = useState("");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!active) return;

    let cancelled = false;

    const start = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "environment" }, width: { ideal: 1280 }, height: { ideal: 720 } },
        });
        if (cancelled) { stream.getTracks().forEach((t) => t.stop()); return; }
        streamRef.current = stream;
        const video = videoRef.current;
        if (!video) return;
        video.srcObject = stream;
        await video.play();
        setReady(true);

        const jsQR = (await import("jsqr")).default;

        const scan = () => {
          if (cancelled) return;
          const canvas = canvasRef.current;
          if (!canvas || !video || video.readyState < 2) {
            animRef.current = requestAnimationFrame(scan);
            return;
          }
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          const ctx = canvas.getContext("2d");
          if (!ctx) return;
          ctx.drawImage(video, 0, 0);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: "dontInvert",
          });
          if (code && code.data && code.data !== lastScannedRef.current) {
            lastScannedRef.current = code.data;
            onScan(code.data);
            setTimeout(() => { lastScannedRef.current = ""; }, 3000);
          }
          animRef.current = requestAnimationFrame(scan);
        };
        animRef.current = requestAnimationFrame(scan);
      } catch (err) {
        if (!cancelled) setError(String(err));
      }
    };

    start();

    return () => {
      cancelled = true;
      setReady(false);
      cancelAnimationFrame(animRef.current);
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
  }, [active, onScan]);

  if (error) {
    return (
      <div className="rounded-xl bg-red-900/20 border border-red-500/30 p-4 text-red-300 text-sm">
        שגיאת מצלמה: {error}
      </div>
    );
  }

  return (
    <div
      className="relative rounded-xl overflow-hidden border border-gold/20 bg-black"
      style={{ width: "100%", maxWidth: 400, aspectRatio: "4/3" }}
    >
      <video
        ref={videoRef}
        className="w-full h-full object-cover"
        playsInline
        muted
      />
      <canvas ref={canvasRef} className="hidden" />
      {/* Targeting overlay */}
      {ready && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-52 h-52 border-2 border-gold/70 rounded-xl" />
        </div>
      )}
      {!ready && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-8 h-8 rounded-full border-2 border-gold border-t-transparent animate-spin" />
        </div>
      )}
    </div>
  );
}
