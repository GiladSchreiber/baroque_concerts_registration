"use client";

import { useRef, useState } from "react";

type Props = {
  value: string;
  onChange: (url: string) => void;
};

export function ImageUpload({ value, onChange }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const handleFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      setError("יש לבחור קובץ תמונה");
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      setError("הקובץ חייב להיות עד 8 MB");
      return;
    }

    setUploading(true);
    setError("");

    const formData = new FormData();
    formData.append("file", file);

    const pw = localStorage.getItem("admin_password") ?? "";
    const res = await fetch("/api/admin/upload-image", {
      method: "POST",
      headers: { "x-admin-password": pw },
      body: formData,
    });

    const data = await res.json();
    setUploading(false);

    if (!res.ok) {
      if (res.status === 401) {
        setError("שגיאת הרשאה — נסה להתחבר מחדש");
      } else {
        setError(data.error ?? "העלאה נכשלה");
      }
      return;
    }
    onChange(data.url);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  return (
    <div className="space-y-3">
      {/* Preview */}
      {value && (
        <div className="relative aspect-[4/3] rounded-xl overflow-hidden border border-white/10 bg-navy-light">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value} alt="Poster preview" className="w-full h-full object-cover" />
          <button
            type="button"
            onClick={() => onChange("")}
            className="absolute top-2 end-2 w-7 h-7 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 transition-colors text-sm"
          >
            ✕
          </button>
        </div>
      )}

      {/* Drop zone */}
      {!value && (
        <div
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          onClick={() => inputRef.current?.click()}
          className="border-2 border-dashed border-white/20 rounded-xl p-8 text-center cursor-pointer hover:border-gold/40 hover:bg-gold/5 transition-colors"
        >
          {uploading ? (
            <div className="flex flex-col items-center gap-2">
              <div className="w-6 h-6 rounded-full border-2 border-gold border-t-transparent animate-spin" />
              <p className="text-cream-muted text-sm">מעלה…</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <span className="text-3xl opacity-40">🖼</span>
              <p className="text-cream-muted text-sm">
                גרור ושחרר או{" "}
                <span className="text-gold underline">לחץ לבחירת קובץ</span>
              </p>
              <p className="text-cream-muted text-xs">PNG, JPG, WEBP · עד 8 MB</p>
            </div>
          )}
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
      />

      {error && <p className="text-red-400 text-xs">{error}</p>}
    </div>
  );
}
