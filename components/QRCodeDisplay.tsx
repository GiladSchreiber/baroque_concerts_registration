"use client";

import { useEffect, useRef } from "react";
import QRCodeLib from "qrcode";

type DownloadData = {
  name: string;
  concert: string;
  date: string;
  spots: number;
};

export function QRCodeDisplay({
  value,
  size = 240,
  downloadName,
  downloadData,
}: {
  value: string;
  size?: number;
  downloadName?: string;
  downloadData?: DownloadData;
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

  const handleDownload = async () => {
    const qrCanvas = canvasRef.current;
    if (!qrCanvas) return;

    if (!downloadData) {
      // Simple QR-only download
      const link = document.createElement("a");
      link.download = `${downloadName ?? "qr-code"}.png`;
      link.href = qrCanvas.toDataURL("image/png");
      link.click();
      return;
    }

    // Build a styled card canvas — portrait, mobile-friendly
    const W = 400;
    const padding = 40;
    const qrSize = 220;
    const lineH = 28;
    const totalH = padding + 56 + 20 + qrSize + 32 + lineH * 3 + padding + 20;
    const card = document.createElement("canvas");
    card.width = W;
    card.height = totalH;

    const ctx = card.getContext("2d")!;

    // Background
    ctx.fillStyle = "#0a0a14";
    ctx.fillRect(0, 0, W, totalH);

    // Rounded card border
    ctx.strokeStyle = "rgba(201,162,39,0.3)";
    ctx.lineWidth = 1.5;
    roundRect(ctx, 16, 16, W - 32, totalH - 32, 16);
    ctx.stroke();

    // Title
    ctx.fillStyle = "#c9a227";
    ctx.font = "bold 22px Arial, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("Baroque Bar Cafe", W / 2, padding + 28);

    // Concert name
    ctx.fillStyle = "#f0e6d3";
    ctx.font = "bold 16px Arial, sans-serif";
    ctx.fillText(downloadData.concert, W / 2, padding + 56);

    // QR code — centered
    const qrX = (W - qrSize) / 2;
    const qrY = padding + 76;
    ctx.drawImage(qrCanvas, qrX, qrY, qrSize, qrSize);

    // Divider
    ctx.strokeStyle = "rgba(240,230,211,0.1)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(padding, qrY + qrSize + 16);
    ctx.lineTo(W - padding, qrY + qrSize + 16);
    ctx.stroke();

    // Details
    const detailY = qrY + qrSize + 36;
    const rows = [
      ["שם", downloadData.name],
      ["תאריך", downloadData.date],
      ["מקומות", String(downloadData.spots)],
    ];
    const colMid = W / 2;
    rows.forEach(([label, val], i) => {
      const y = detailY + i * lineH;
      ctx.font = "14px Arial, sans-serif";
      ctx.fillStyle = "rgba(240,230,211,0.45)";
      ctx.textAlign = "right";
      ctx.fillText(label, colMid - 12, y);
      ctx.fillStyle = "#f0e6d3";
      ctx.textAlign = "left";
      ctx.fillText(val, colMid + 12, y);
    });

    const link = document.createElement("a");
    link.download = `${downloadName ?? "baroque-ticket"}.png`;
    link.href = card.toDataURL("image/png");
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

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number, r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}
