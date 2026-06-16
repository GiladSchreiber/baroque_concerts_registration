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

    // Split date into date part and time part
    const [datePart, timePart] = downloadData.date.split(" · ");
    const rows = [
      ["שם", downloadData.name],
      ["תאריך", datePart ?? downloadData.date],
      ["שעה", timePart ?? ""],
      ["מקומות", String(downloadData.spots)],
    ].filter(([, v]) => v !== "");

    const totalH = padding + 80 + 20 + qrSize + 32 + lineH * rows.length + padding + 20;
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

    // Logo (inverted to white)
    const logoImg = new Image();
    logoImg.src = "/logo.png";
    await new Promise<void>((resolve) => {
      logoImg.onload = () => resolve();
      logoImg.onerror = () => resolve();
    });
    const logoW = 120;
    const logoH = 40;
    const logoX = (W - logoW) / 2;
    ctx.filter = "invert(1) opacity(0.9)";
    ctx.drawImage(logoImg, logoX, padding, logoW, logoH);
    ctx.filter = "none";

    // Concert name
    ctx.fillStyle = "#f0e6d3";
    ctx.font = "bold 15px Arial, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(downloadData.concert, W / 2, padding + logoH + 28);

    // QR code — centered
    const qrX = (W - qrSize) / 2;
    const qrY = padding + logoH + 48;
    ctx.drawImage(qrCanvas, qrX, qrY, qrSize, qrSize);

    // Divider
    ctx.strokeStyle = "rgba(240,230,211,0.1)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(padding, qrY + qrSize + 16);
    ctx.lineTo(W - padding, qrY + qrSize + 16);
    ctx.stroke();

    // Details — RTL: label on right, value on left
    const detailY = qrY + qrSize + 36;
    const colMid = W / 2;
    rows.forEach(([label, val], i) => {
      const y = detailY + i * lineH;
      ctx.font = "14px Arial, sans-serif";
      // Label — right side
      ctx.fillStyle = "rgba(240,230,211,0.45)";
      ctx.textAlign = "left";
      ctx.fillText(label, colMid + 12, y);
      // Value — left side
      ctx.fillStyle = "#f0e6d3";
      ctx.textAlign = "right";
      ctx.fillText(val, colMid - 12, y);
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
