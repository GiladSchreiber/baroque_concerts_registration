"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import Link from "next/link";
import { format } from "date-fns";
import { Navbar } from "@/components/Navbar";
import { useLanguage } from "@/components/LanguageProvider";
import type { Concert, Registration } from "@/lib/database.types";

const QRScanner = dynamic(
  () => import("@/components/QRScanner").then((m) => m.QRScanner),
  { ssr: false }
);

type RegistrationRow = Registration & { _flash?: "success" | "error" | "duplicate" };
type Tab = "list" | "scan" | "analytics";
type Filter = "all" | "checked_in" | "not_checked_in" | "waitlist";

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
  const [tab, setTab] = useState<Tab>("list");
  const [filter, setFilter] = useState<Filter>("all");
  const [search, setSearch] = useState("");
  const [scanResult, setScanResult] = useState<{
    msg: string;
    type: "success" | "error";
  } | null>(null);
  const [scanning, setScanning] = useState(false);
  const adminPassword = useRef("");
  const lastScannedRef = useRef<string>("");

  useEffect(() => {
    const pw = sessionStorage.getItem("admin_password");
    if (!pw) {
      router.push("/admin");
      return;
    }
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

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="w-8 h-8 rounded-full border-2 border-gold border-t-transparent animate-spin" />
        </div>
      </div>
    );
  }

  if (!concert) return null;

  // ── Derived stats ───────────────────────────────────────────────────────────
  const confirmedRegs = registrations.filter((r) => !r.on_waitlist);
  const totalSpots = confirmedRegs.reduce((s, r) => s + r.spots, 0);
  const checkedInCount = confirmedRegs.filter((r) => r.checked_in).length;
  const waitlistCount = registrations.filter((r) => r.on_waitlist).length;
  const fillPct = concert.capacity > 0
    ? Math.min(100, Math.round((totalSpots / concert.capacity) * 100))
    : 0;

  const filtered = registrations.filter((r) => {
    const matchesSearch =
      !search ||
      r.full_name.toLowerCase().includes(search.toLowerCase()) ||
      r.email.toLowerCase().includes(search.toLowerCase()) ||
      r.phone.includes(search);
    const matchesFilter =
      filter === "all" ||
      (filter === "checked_in" && r.checked_in) ||
      (filter === "not_checked_in" && !r.checked_in && !r.on_waitlist) ||
      (filter === "waitlist" && r.on_waitlist);
    return matchesSearch && matchesFilter;
  });

  const concertTitle = lang === "he" ? concert.title_he : concert.title_en;

  const TABS: { id: Tab; label: string }[] = [
    { id: "list", label: t.guestList },
    { id: "scan", label: t.scanQR },
    { id: "analytics", label: lang === "he" ? "נתונים" : "Analytics" },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-8">
        {/* Back + title row */}
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <Link
              href="/admin/concerts"
              className="inline-flex items-center gap-2 text-sm text-cream-muted hover:text-gold transition-colors mb-2"
            >
              → {lang === "he" ? "כל האירועים" : "All events"}
            </Link>
            <h1 className="text-2xl font-bold text-cream">{concertTitle}</h1>
            {concert.band_name && (
              <p className="text-cream-muted text-sm mt-0.5">{concert.band_name}</p>
            )}
          </div>
          <Link
            href={`/admin/${concertId}/edit`}
            className="flex-shrink-0 px-4 py-2 rounded-xl border border-gold/30 text-gold text-sm font-medium hover:bg-gold/10 transition-colors"
          >
            ✎ עריכה
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <StatCard
            label={t.total}
            value={totalSpots}
            sub={`/ ${concert.capacity}`}
          />
          <StatCard label={t.checkedInCount} value={checkedInCount} highlight />
          <StatCard label={t.waitlistCount} value={waitlistCount} />
          <StatCard
            label={lang === "he" ? "% מלא" : "% Full"}
            value={`${fillPct}%`}
            bar={fillPct}
          />
        </div>

        {/* Tabs */}
        <div className="flex rounded-xl border border-white/10 bg-navy-card p-1 mb-6 w-fit">
          {TABS.map((tab_) => (
            <button
              key={tab_.id}
              onClick={() => {
                setTab(tab_.id);
                setScanning(tab_.id === "scan");
              }}
              className={`px-5 py-2 rounded-lg text-sm font-medium transition-colors ${
                tab === tab_.id
                  ? "bg-gold text-navy"
                  : "text-cream-muted hover:text-cream"
              }`}
            >
              {tab_.label}
            </button>
          ))}
        </div>

        {/* ── Scan tab ─────────────────────────────────────────────────── */}
        {tab === "scan" && (
          <div className="space-y-4">
            {scanResult && (
              <div
                className={`rounded-xl p-4 text-center font-semibold text-lg ${
                  scanResult.type === "success"
                    ? "bg-green-900/30 border border-green-500/40 text-green-300"
                    : "bg-red-900/30 border border-red-500/40 text-red-300"
                }`}
              >
                {scanResult.msg}
              </div>
            )}
            <div className="flex justify-center">
              <QRScanner onScan={handleScan} active={scanning} />
            </div>
          </div>
        )}

        {/* ── List tab ─────────────────────────────────────────────────── */}
        {tab === "list" && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t.search}
                className="flex-1 px-4 py-2.5 rounded-xl bg-navy-card border border-white/20 text-cream placeholder-cream-muted/50 focus:outline-none focus:border-gold/60 transition-colors text-sm"
              />
              <div className="flex gap-2 flex-wrap">
                {(["all", "not_checked_in", "checked_in", "waitlist"] as Filter[]).map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                      filter === f
                        ? "bg-gold text-navy"
                        : "bg-navy-card border border-white/10 text-cream-muted hover:text-cream"
                    }`}
                  >
                    {f === "all" && t.all}
                    {f === "not_checked_in" && t.notCheckedIn}
                    {f === "checked_in" && t.checkedIn}
                    {f === "waitlist" && t.waitlistCount}
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-white/10 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-navy-light border-b border-white/10">
                  <tr>
                    <th className="px-4 py-3 text-start text-cream-muted font-medium">{t.name}</th>
                    <th className="px-4 py-3 text-start text-cream-muted font-medium hidden sm:table-cell">
                      {lang === "he" ? "טלפון" : "Phone"}
                    </th>
                    <th className="px-4 py-3 text-start text-cream-muted font-medium hidden md:table-cell">
                      {lang === "he" ? "נרשם" : "Registered"}
                    </th>
                    <th className="px-4 py-3 text-center text-cream-muted font-medium">{t.spots}</th>
                    <th className="px-4 py-3 text-center text-cream-muted font-medium">{t.checkedIn}</th>
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
                      } ${reg.on_waitlist ? "opacity-60" : ""}`}
                    >
                      <td className="px-4 py-3">
                        <p className="text-cream font-medium">{reg.full_name}</p>
                        <p className="text-cream-muted text-xs">{reg.email}</p>
                        {reg.on_waitlist && (
                          <span className="text-xs text-gold">({t.onWaitlist})</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-cream-muted hidden sm:table-cell" dir="ltr">
                        {reg.phone}
                      </td>
                      <td className="px-4 py-3 text-cream-muted text-xs hidden md:table-cell">
                        {format(new Date(reg.created_at), "MMM d, HH:mm")}
                      </td>
                      <td className="px-4 py-3 text-center text-cream">{reg.spots}</td>
                      <td className="px-4 py-3 text-center">
                        {reg.on_waitlist ? (
                          <span className="text-xs text-cream-muted">—</span>
                        ) : reg.checked_in ? (
                          <span className="text-green-400 text-base">✓</span>
                        ) : (
                          <span className="text-cream-muted text-base">○</span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-4 py-10 text-center text-cream-muted">
                        No matching guests
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <p className="text-cream-muted text-xs text-end">
              {filtered.length} of {registrations.length} shown
            </p>
          </div>
        )}

        {/* ── Analytics tab ─────────────────────────────────────────── */}
        {tab === "analytics" && (
          <AnalyticsTab
            registrations={registrations}
            concert={concert}
            totalSpots={totalSpots}
            checkedInCount={checkedInCount}
            waitlistCount={waitlistCount}
            fillPct={fillPct}
          />
        )}
      </main>
    </div>
  );
}

// ─── Analytics Tab ────────────────────────────────────────────────────────────

function AnalyticsTab({
  registrations,
  concert,
  totalSpots,
  checkedInCount,
  waitlistCount,
  fillPct,
}: {
  registrations: RegistrationRow[];
  concert: Concert;
  totalSpots: number;
  checkedInCount: number;
  waitlistCount: number;
  fillPct: number;
}) {
  const confirmed = registrations.filter((r) => !r.on_waitlist);
  const spotsLeft = Math.max(0, concert.capacity - totalSpots);
  const revenue = totalSpots * concert.price_nis;

  // Registrations by day
  const byDay = new Map<string, number>();
  for (const r of confirmed) {
    const day = r.created_at.slice(0, 10);
    byDay.set(day, (byDay.get(day) ?? 0) + r.spots);
  }
  const dayEntries = Array.from(byDay.entries()).sort(([a], [b]) => a.localeCompare(b));
  const maxDay = Math.max(...dayEntries.map(([, v]) => v), 1);

  // Spots breakdown
  const spotCounts = [1, 2, 3, 4].map((n) => ({
    spots: n,
    count: confirmed.filter((r) => r.spots === n).length,
  }));

  return (
    <div className="space-y-8">
      {/* KPI grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <KPI label="מקומות שנרשמו" value={`${totalSpots} / ${concert.capacity}`} />
        <KPI label="מקומות פנויים" value={spotsLeft} color="text-green-400" />
        <KPI label="אחוז כניסה" value={confirmed.length > 0 ? `${Math.round((checkedInCount / confirmed.length) * 100)}%` : "—"} />
        <KPI label="הכנסה משוערת" value={`₪${revenue.toLocaleString()}`} color="text-gold" />
      </div>

      {/* Capacity bar */}
      <div className="rounded-xl border border-white/10 bg-navy-card p-5">
        <h3 className="text-sm font-medium text-cream-muted mb-4">קיבולת</h3>
        <div className="space-y-3">
          <CapacityRow
            label="מקומות מאושרים"
            value={totalSpots}
            max={concert.capacity}
            color="bg-gold"
          />
          <CapacityRow
            label="נכנסו"
            value={checkedInCount}
            max={concert.capacity}
            color="bg-green-400"
          />
          {waitlistCount > 0 && (
            <CapacityRow
              label="רשימת המתנה"
              value={waitlistCount}
              max={concert.capacity}
              color="bg-white/30"
            />
          )}
        </div>
        <p className="text-cream-muted text-xs mt-4">{fillPct}% מקיבולת האולם מלאה</p>
      </div>

      {/* Registrations over time */}
      {dayEntries.length > 0 && (
        <div className="rounded-xl border border-white/10 bg-navy-card p-5">
          <h3 className="text-sm font-medium text-cream-muted mb-4">
            הרשמות לאורך זמן
          </h3>
          <div className="flex items-end gap-1.5 h-24">
            {dayEntries.map(([day, count]) => (
              <div key={day} className="flex-1 flex flex-col items-center gap-1 min-w-0">
                <div
                  className="w-full rounded-t-sm bg-gold/70 transition-all"
                  style={{ height: `${(count / maxDay) * 80}px` }}
                />
                <span className="text-cream-muted text-[9px] truncate w-full text-center">
                  {day.slice(5)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Party size breakdown */}
      <div className="rounded-xl border border-white/10 bg-navy-card p-5">
        <h3 className="text-sm font-medium text-cream-muted mb-4">גודל קבוצה</h3>
        <div className="grid grid-cols-4 gap-3">
          {spotCounts.map(({ spots, count }) => (
            <div
              key={spots}
              className="rounded-xl bg-navy-light p-4 text-center border border-white/8"
            >
              <p className="text-2xl font-bold text-cream">{count}</p>
              <p className="text-cream-muted text-xs mt-1">
                {spots} {spots === 1 ? "מקום" : "מקומות"}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Small helpers ────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  sub,
  highlight,
  bar,
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

function KPI({
  label,
  value,
  color,
}: {
  label: string;
  value: string | number;
  color?: string;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-navy-card p-4">
      <p className="text-cream-muted text-xs mb-1">{label}</p>
      <p className={`text-xl font-bold ${color ?? "text-cream"}`}>{value}</p>
    </div>
  );
}

function CapacityRow({
  label,
  value,
  max,
  color,
}: {
  label: string;
  value: number;
  max: number;
  color: string;
}) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="text-cream-muted text-xs w-32 flex-shrink-0">{label}</span>
      <div className="flex-1 h-2 rounded-full bg-white/10 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-cream text-xs w-14 text-end flex-shrink-0">
        {value} ({pct}%)
      </span>
    </div>
  );
}
