"use client";

import Link from "next/link";
import Image from "next/image";
import { LanguageToggle } from "./LanguageToggle";

export function Navbar() {
  return (
    <header className="border-b border-white/10 bg-navy/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-5xl mx-auto px-6 h-20 flex items-center justify-between" dir="ltr">
        <div className="flex items-center gap-2">
          <LanguageToggle />
          <a
            href="/admin"
            className="p-1.5 rounded-lg text-white/25 hover:text-white/60 transition-colors"
            title="ניהול"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
          </a>
        </div>
        <Link href="/" className="flex items-center mt-1">
          <Image
            src="/logo.png"
            alt="Baroque"
            width={136}
            height={46}
            className="invert opacity-90 hover:opacity-100 transition-opacity"
            style={{ objectFit: "contain" }}
            priority
          />
        </Link>
      </div>
    </header>
  );
}
