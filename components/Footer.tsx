"use client";

import { useLanguage } from "./LanguageProvider";

export function Footer() {
  const { lang } = useLanguage();

  return (
    <footer className="border-t border-white/10 py-6 flex items-center justify-center gap-10">
      <a
        href="https://www.instagram.com/baroque_bar_cafe/"
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2.5 text-cream-muted hover:text-gold transition-colors group"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/instagram.svg" alt="Instagram" className="w-5 h-5 opacity-50 group-hover:opacity-100 transition-opacity" style={{ filter: "invert(80%) sepia(10%) saturate(200%) hue-rotate(10deg)" }} />
        <span className="text-sm tracking-wide">baroque_bar_cafe</span>
      </a>
      <a
        href="https://maps.app.goo.gl/FjLkesBsqfSLR1X99"
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2.5 text-cream-muted hover:text-gold transition-colors group"
      >
        <span className="text-sm tracking-wide">
          {lang === "he" ? "בן סירא 3, ירושלים" : "Ben Sira 3, Jerusalem"}
        </span>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/location.svg" alt="Location" className="w-5 h-5 opacity-50 group-hover:opacity-100 transition-opacity" style={{ filter: "invert(80%) sepia(10%) saturate(200%) hue-rotate(10deg)" }} />
      </a>
    </footer>
  );
}
