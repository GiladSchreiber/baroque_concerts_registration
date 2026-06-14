"use client";

import { useEffect, useRef } from "react";
import QRCodeLib from "qrcode";

export function QRCodeDisplay({
  value,
  size = 240,
  downloadName,
}: {
  value: string;
  size?: number;
  downloadName?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current || !value) return;
    QRCodeLib.toCanvas(canvasRef.current, value, {
      width: size,
      margin: 2,
      color: { dark: "#0a0a14", light: "#f0e6d3" },
    });
  }, [value, size]);

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = `${downloadName ?? "qr-code"}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <canvas
        ref={canvasRef}
        className="rounded-xl"
        style={{ width: size, height: size }}
      />
      <button
        onClick={handleDownload}
        className="flex items-center gap-2 text-xs text-cream-muted hover:text-gold transition-colors"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
          <polyline points="7 10 12 15 17 10"/>
          <line x1="12" y1="15" x2="12" y2="3"/>
        </svg>
        הורדת קוד QR
      </button>
    </div>
  );
}
