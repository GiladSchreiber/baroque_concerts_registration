"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { format } from "date-fns";
import { AdminNavbar } from "@/components/AdminNavbar";
import { useLanguage } from "@/components/LanguageProvider";
import { ConcertCard } from "@/components/ConcertCard";
import type { Concert, Registration } from "@/lib/database.types";

const QRScanner = dynamic(
  () => import("@/components/QRScanner").then((m) => m.QRScanner),
  { ssr: false }
);

type RegistrationRow = Registration & { _flash?: "success" | "error" | "duplicate" };

export default function AdminConcertPage() {
  const params = useParams();
  const concertId = Array.isArray(params.concertId)
    ? params.concertId[0]
    : (params.concertId as string) ?? "";
  const router = useRouter();
  const { t, lang } = useLanguage();

  const [concert, setConcert] = useState<Concert | null>(null);
  const [registrations, setRegistrations] = useState<RegistrationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [search, setSearch] = useState("");
  const [scanResult, setScanResult] = useState<{ msg: string; type: "success" | "error" } | null>(null);
  const adminPassword = useRef("");
  const lastScannedRef = useRef<string>("");
  const qrScannedIds = useRef<Set<string>>(new Set());

  useEffect(() => {
    const pw = localStorage.getItem("admin_password");
    if (!pw) { router.push("/admin"); return; }
    adminPassword.current = pw;
    loadData();
  }, [concertId]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadData = async () => {
    const pw = adminPassword.current;
    const res = await fetch(`/api/admin/concerts/${concertId}`, {
      headers: { "x-admin-password": pw },
    });
    if (!res.ok) { setLoading(false); return; }
    const json = await res.json();
    if (json.concert) setConcert(json.concert);
    if (json.registrations) setRegistrations(json.registrations);
    setLoading(false);
  };

  const handleScan = useCallback(
    async (value: string) => {
      if (value === lastScannedRef.current) return;
      lastScannedRef.current = value;
      setTimeout(() => { lastScannedRef.current = ""; }, 3000);

      const res = await fetch(`/api/checkin/${value}`, {
        method: "POST",
        headers: { "x-admin-password": adminPassword.current },
      });

      if (res.status === 409) {
        setScanResult({ msg: t.alreadyCheckedIn, type: "error" });
        setRegistrations((prev) =>
          prev.map((r) => (r.id === value ? { ...r, _flash: "duplicate" } : r))
        );
      } else if (res.ok) {
        setScanResult({ msg: t.scanSuccess, type: "success" });
        qrScannedIds.current.add(value);
        setRegistrations((prev) =>
          prev.map((r) =>
            r.id === value
              ? { ...r, checked_in: true, checked_in_at: new Date().toISOString(), _flash: "success" }
              : r
          )
        );
      } else {
        setScanResult({ msg: t.scanError, type: "error" });
      }
      setTimeout(() => setScanResult(null), 4000);
    },
    [t]
  );

  const [deletingRegId, setDeletingRegId] = useState<string | null>(null);

  const handleDeleteRegistration = async (id: string) => {
    if (!confirm("למחוק את ההרשמה? פעולה זו אינה הפיכה.")) return;
    setDeletingRegId(id);
    await fetch(`/api/admin/registrations/${id}`, {
      method: "DELETE",
      headers: { "x-admin-password": adminPassword.current },
    });
    setRegistrations((prev) => prev.filter((r) => r.id !== id));
    setDeletingRegId(null);
  };

  const handleToggleCheckIn = async (reg: RegistrationRow) => {
    if (qrScannedIds.current.has(reg.id)) return;
    const method = reg.checked_in ? "DELETE" : "POST";
    const res = await fetch(`/api/checkin/${reg.id}`, {
      method,
      headers: { "x-admin-password": adminPassword.current },
    });
    if (res.ok || res.status === 409) {
      setRegistrations((prev) =>
        prev.map((r) =>
          r.id === reg.id
            ? { ...r, checked_in: !reg.checked_in, checked_in_at: !reg.checked_in ? new Date().toISOString() : null }
            : r
        )
      );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <AdminNavbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="w-8 h-8 rounded-full border-2 border-gold border-t-transparent animate-spin" />
        </div>
      </div>
    );
  }

  if (!concert) return null;

  const confirmedRegs = registrations.filter((r) => !r.on_waitlist);
  const totalSpots = confirmedRegs.reduce((s, r) => s + r.spots, 0);
  const checkedInCount = confirmedRegs.filter((r) => r.checked_in).reduce((s, r) => s + r.spots, 0);
  const waitlistCount = registrations.filter((r) => r.on_waitlist).length;
  const fillPct = concert.capacity > 0
    ? Math.min(100, Math.round((totalSpots / concert.capacity) * 100))
    : 0;

  const filtered = registrations.filter((r) => {
    return !search ||
      r.full_name.toLowerCase().includes(search.toLowerCase()) ||
      r.email.toLowerCase().includes(search.toLowerCase()) ||
      r.phone.includes(search);
  });

  const concertTitle = lang === "he" ? concert.title_he : concert.title_en;


  return (
    <div className="min-h-screen flex flex-col">
      <AdminNavbar />

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-8">
        {/* Back + title row */}
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-cream">{concertTitle}</h1>
            {concert.band_name && (
              <p className="text-cream-muted text-sm mt-0.5">{concert.band_name}</p>
            )}
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <button
              onClick={() => setScanning((s) => !s)}
              className={`p-2.5 rounded-xl border text-sm font-medium transition-colors ${
                scanning
                  ? "bg-gold border-gold text-navy"
                  : "border-white/20 text-cream-muted hover:border-gold/40 hover:text-gold"
              }`}
              title="סריקת QR"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
                <path d="M14 14h3v3h-3zM17 17h3v3h-3zM14 20h3"/>
              </svg>
            </button>
            <a
              href={`/admin/${concertId}/edit`}
              className="p-2.5 rounded-xl border border-white/20 text-cream-muted hover:border-gold/40 hover:text-gold transition-colors"
              title="עריכה"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
            </a>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <StatCard label={t.total} value={totalSpots} />
          <StatCard label={t.checkedInCount} value={checkedInCount} highlight />
          <StatCard label={t.waitlistCount} value={waitlistCount} />
          <StatCard label={lang === "he" ? "% מלא" : "% Full"} value={`${fillPct}%`} bar={fillPct} />
        </div>

        {/* ── Concert preview ─────────────────────────────────────── */}
        <div className="mb-6 max-w-xl">
          <p className="text-xs font-semibold uppercase tracking-widest text-gold/50 mb-3">תצוגה מקדימה</p>
          <ConcertCard concert={concert} lang={lang} t={t} />
        </div>

        {/* ── Scanner (inline, toggled) ─────────────────────────────── */}
        {scanning && (
          <div className="mb-6 space-y-4">
            {scanResult && (
              <div className={`rounded-xl p-4 text-center font-semibold text-lg ${
                scanResult.type === "success"
                  ? "bg-green-900/30 border border-green-500/40 text-green-300"
                  : "bg-red-900/30 border border-red-500/40 text-red-300"
              }`}>
                {scanResult.msg}
              </div>
            )}
            <div className="flex justify-center">
              <QRScanner onScan={handleScan} active={scanning} />
            </div>
          </div>
        )}

        {/* ── Guest list ───────────────────────────────────────────────── */}
        <div className="space-y-4">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t.search}
              className="w-full px-4 py-2.5 rounded-xl bg-navy-card border border-white/20 text-cream placeholder-cream-muted/50 focus:outline-none focus:border-gold/60 transition-colors text-sm"
            />

            <div className="rounded-xl border border-white/10 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-navy-light border-b border-white/10">
                  <tr>
                    <th className="px-4 py-3 w-10"></th>
                    <th className="px-4 py-3 text-start text-cream-muted font-medium">{t.name}</th>
                    <th className="px-4 py-3 text-start text-cream-muted font-medium hidden sm:table-cell">טלפון</th>
                    <th className="px-4 py-3 text-start text-cream-muted font-medium hidden md:table-cell">נרשם</th>
                    <th className="px-4 py-3 text-center text-cream-muted font-medium">{t.spots}</th>
                    <th className="px-4 py-3 w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filtered.map((reg) => (
                    <tr
                      key={reg.id}
                      className={`transition-colors ${
                        reg._flash === "success"
                          ? "bg-green-900/20"
                          : reg._flash === "duplicate"
                          ? "bg-yellow-900/20"
                          : "hover:bg-navy-light/50"
                      }`}
                    >
                      <td className="px-4 py-3">
                        {reg.on_waitlist ? (
                          <span className="text-xs text-gold/60">המתנה</span>
                        ) : (
                          <input
                            type="checkbox"
                            checked={reg.checked_in}
                            disabled={qrScannedIds.current.has(reg.id)}
                            onChange={() => handleToggleCheckIn(reg)}
                            className="w-4 h-4 accent-gold cursor-pointer disabled:cursor-default"
                          />
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-cream font-medium">{reg.full_name}</p>
                        <p className="text-cream-muted text-xs">{reg.email}</p>
                      </td>
                      <td className="px-4 py-3 text-cream-muted hidden sm:table-cell text-end" dir="ltr">
                        {reg.phone}
                      </td>
                      <td className="px-4 py-3 text-cream-muted text-xs hidden md:table-cell">
                        {format(new Date(reg.created_at), "MMM d, HH:mm")}
                      </td>
                      <td className="px-4 py-3 text-center text-cream">{reg.spots}</td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => handleDeleteRegistration(reg.id)}
                          disabled={deletingRegId === reg.id}
                          className="p-1.5 rounded-lg text-cream-muted/30 hover:text-red-400 transition-colors disabled:opacity-40"
                          title="מחק הרשמה"
                        >
                          {deletingRegId === reg.id
                            ? <span className="text-xs">…</span>
                            : <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                              </svg>
                          }
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-4 py-10 text-center text-cream-muted">
                        אין אורחים תואמים
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
      </main>
    </div>
  );
}

function StatCard({
  label, value, sub, highlight, bar,
}: {
  label: string;
  value: string | number;
  sub?: string;
  highlight?: boolean;
  bar?: number;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-navy-card p-4">
      <p className="text-cream-muted text-xs uppercase tracking-wider mb-1">{label}</p>
      <p className={`text-2xl font-bold ${highlight ? "text-green-400" : "text-cream"}`}>
        {value}
        {sub && <span className="text-sm font-normal text-cream-muted">{sub}</span>}
      </p>
      {bar !== undefined && (
        <div className="mt-2 h-1 rounded-full bg-white/10 overflow-hidden">
          <div
            className={`h-full rounded-full ${bar >= 100 ? "bg-red-400" : bar > 80 ? "bg-gold" : "bg-green-400"}`}
            style={{ width: `${bar}%` }}
          />
        </div>
      )}
    </div>
  );
}
