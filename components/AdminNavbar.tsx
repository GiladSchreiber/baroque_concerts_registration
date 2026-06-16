import Link from "next/link";
import Image from "next/image";

export function AdminNavbar() {
  return (
    <header className="border-b border-white/10 bg-navy/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-5xl mx-auto px-6 h-20 flex items-center justify-between">
        {/* User view icon */}
        <Link
          href="/"
          className="p-1.5 rounded-lg text-white/25 hover:text-white/60 transition-colors"
          title="תצוגת משתמש"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z"/>
            <path d="M9 21V12h6v9"/>
          </svg>
        </Link>

        {/* Logo — centered */}
        <Link href="/admin/concerts" className="flex items-center mt-1">
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

        {/* Spacer to balance the layout */}
        <div className="w-8" />
      </div>
    </header>
  );
}
