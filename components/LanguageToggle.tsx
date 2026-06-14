"use client";

import { useLanguage } from "./LanguageProvider";

export function LanguageToggle() {
  const { lang, setLang } = useLanguage();

  return (
    <button
      onClick={() => setLang(lang === "he" ? "en" : "he")}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-gold/30 text-sm font-medium text-gold hover:bg-gold/10 transition-colors"
      aria-label="Toggle language"
    >
      <span className={lang === "he" ? "opacity-100" : "opacity-40"}>עב</span>
      <span className="text-gold/30">|</span>
      <span className={lang === "en" ? "opacity-100" : "opacity-40"}>EN</span>
    </button>
  );
}
