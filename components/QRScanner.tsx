"use client";

import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";

type Props = {
  onScan: (value: string) => void;
  active: boolean;
};

export function QRScanner({ onScan, active }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const isRunningRef = useRef(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!active || !containerRef.current) return;

    const scannerId = "qr-scanner-" + Math.random().toString(36).slice(2);
    containerRef.current.id = scannerId;

    const scanner = new Html5Qrcode(scannerId);
    scannerRef.current = scanner;
    isRunningRef.current = false;

    scanner
      .start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText) => {
          onScan(decodedText);
        },
        undefined
      )
      .then(() => {
        isRunningRef.current = true;
      })
      .catch((err) => {
        setError(String(err));
      });

    return () => {
      if (isRunningRef.current) {
        isRunningRef.current = false;
        scanner.stop().then(() => scanner.clear()).catch(() => {});
      } else {
        // Scanner hadn't started yet — wait briefly then clean up
        setTimeout(() => {
          scanner.stop().then(() => scanner.clear()).catch(() => {});
        }, 500);
      }
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
    <div>
      <div
        ref={containerRef}
        className="overflow-hidden rounded-xl border border-gold/20"
        style={{ width: "100%", maxWidth: 400, minHeight: 300 }}
      />
    </div>
  );
}
