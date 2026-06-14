"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AdminNavbar } from "@/components/AdminNavbar";
import { useLanguage } from "@/components/LanguageProvider";

export default function AdminLoginPage() {
  const { t } = useLanguage();
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/admin/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });

    if (res.ok) {
      sessionStorage.setItem("admin_password", password);
      router.push("/admin/concerts");
    } else {
      setError(t.adminWrongPassword);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <AdminNavbar />
      <main className="flex-1 flex items-center justify-center px-4 -mt-20">
        <div className="w-full max-w-sm">
          <div className="rounded-2xl border border-white/10 bg-navy-card p-8">
            <h1 className="text-2xl font-bold text-cream mb-8 text-center">
              ניהול קונצרטים
            </h1>

            <form onSubmit={handleLogin} className="space-y-4">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t.adminPassword}
                className="w-full px-4 py-3 rounded-xl bg-navy border border-white/20 text-cream placeholder-cream-muted/50 focus:outline-none focus:border-gold/60 transition-colors text-right"
                dir="rtl"
                autoComplete="current-password"
              />
              {error && (
                <p className="text-red-400 text-sm">{error}</p>
              )}
              <button
                type="submit"
                disabled={loading || !password}
                className="w-full py-3 rounded-xl bg-gold text-navy font-bold hover:bg-gold-light transition-colors disabled:opacity-60"
              >
                {loading ? "…" : t.adminLoginBtn}
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
