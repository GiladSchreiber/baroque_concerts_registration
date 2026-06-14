"use client";

import { useEffect, useRef } from "react";
import QRCodeLib from "qrcode";

export function QRCodeDisplay({
  value,
  size = 240,
}: {
  value: string;
  size?: number;
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

  return (
    <canvas
      ref={canvasRef}
      className="rounded-xl"
      style={{ width: size, height: size }}
    />
  );
}
