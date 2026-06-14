import Link from "next/link";
import Image from "next/image";

export function AdminNavbar() {
  return (
    <header className="border-b border-white/10 bg-navy/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-5xl mx-auto px-6 h-20 flex items-center justify-center">
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
      </div>
    </header>
  );
}
