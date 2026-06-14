"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { useLanguage } from "@/components/LanguageProvider";
import type { ConcertWithStats } from "@/lib/database.types";

export default function AdminConcertListPage() {
  const { lang } = useLanguage();
  const router = useRouter();
  const adminPassword = useRef("");
  const [concerts, setConcerts] = useState<ConcertWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const load = useCallback(async (pw: string) => {
    setLoading(true);
    const res = await fetch("/api/admin/concerts", {
      headers: { "x-admin-password": pw },
    });
    if (res.ok) {
      const data = await res.json();
      setConcerts(data);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    const pw = sessionStorage.getItem("admin_password");
    if (!pw) {
      router.push("/admin");
      return;
    }
    adminPassword.current = pw;
    load(pw);
  }, [router, load]);

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this event? This cannot be undone.")) return;
    setDeletingId(id);
    await fetch(`/api/admin/concerts/${id}`, {
      method: "DELETE",
      headers: { "x-admin-password": adminPassword.current },
    });
    setConcerts((prev) => prev.filter((c) => c.id !== id));
    setDeletingId(null);
  };

  const handleToggleActive = async (c: ConcertWithStats) => {
    await fetch(`/api/admin/concerts/${c.id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "x-admin-password": adminPassword.current,
      },
      body: JSON.stringify({ is_active: !c.is_active }),
    });
    setConcerts((prev) =>
      prev.map((x) => (x.id === c.id ? { ...x, is_active: !c.is_active } : x))
    );
  };

  const upcoming = concerts.filter(
    (c) => new Date(c.date) >= new Date()
  );
  const past = concerts.filter((c) => new Date(c.date) < new Date());

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-10" dir="rtl">
        {/* Header */}
        <div className="flex items-center justify-between mb-10">
          <div>
            <h1 className="text-2xl font-bold text-cream">אירועים</h1>
            <p className="text-cream-muted text-sm mt-0.5">
              {concerts.length} סה״כ · {upcoming.length} קרובים
            </p>
          </div>
          <Link
            href="/admin/events/new"
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gold text-navy font-bold text-sm hover:bg-gold-light transition-colors shadow-[0_4px_16px_#c9a22730]"
          >
            + אירוע חדש
          </Link>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 rounded-full border-2 border-gold border-t-transparent animate-spin" />
          </div>
        ) : (
          <div className="space-y-10">
            {upcoming.length > 0 && (
              <EventGroup
                title="Upcoming"
                concerts={upcoming}
                lang={lang}
                onDelete={handleDelete}
                onToggleActive={handleToggleActive}
                deletingId={deletingId}
              />
            )}
            {past.length > 0 && (
              <EventGroup
                title="Past Events"
                concerts={past}
                lang={lang}
                onDelete={handleDelete}
                onToggleActive={handleToggleActive}
                deletingId={deletingId}
                dimmed
              />
            )}
            {concerts.length === 0 && (
              <div className="text-center py-20">
                <p className="text-cream-muted mb-4">אין אירועים עדיין.</p>
                <Link
                  href="/admin/events/new"
                  className="text-gold hover:text-gold-light transition-colors text-sm"
                >
                  צור את האירוע הראשון שלך →
                </Link>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

// ─── Event Group ─────────────────────────────────────────────────────────────

function EventGroup({
  title,
  concerts,
  lang,
  onDelete,
  onToggleActive,
  deletingId,
  dimmed,
}: {
  title: string;
  concerts: ConcertWithStats[];
  lang: string;
  onDelete: (id: string) => void;
  onToggleActive: (c: ConcertWithStats) => void;
  deletingId: string | null;
  dimmed?: boolean;
}) {
  return (
    <div>
          <h2 className="text-xs font-semibold uppercase tracking-widest text-gold/60 mb-4">
      {title === "Upcoming" ? "קרובים" : "עבר"}
    </h2>
      <div className="space-y-4">
        {concerts.map((c) => (
          <EventCard
            key={c.id}
            concert={c}
            lang={lang}
            onDelete={onDelete}
            onToggleActive={onToggleActive}
            deletingId={deletingId}
            dimmed={dimmed}
          />
        ))}
      </div>
    </div>
  );
}

// ─── Event Card ───────────────────────────────────────────────────────────────

function EventCard({
  concert: c,
  lang,
  onDelete,
  onToggleActive,
  deletingId,
  dimmed,
}: {
  concert: ConcertWithStats;
  lang: string;
  onDelete: (id: string) => void;
  onToggleActive: (c: ConcertWithStats) => void;
  deletingId: string | null;
  dimmed?: boolean;
}) {
  const title = lang === "he" ? c.title_he : c.title_en;
  const fillPct = c.capacity > 0
    ? Math.min(100, Math.round((c.stats.totalSpots / c.capacity) * 100))
    : 0;
  const isFull = fillPct >= 100;

  return (
    <div
      className={`rounded-2xl border bg-navy-card p-5 transition-opacity ${
        dimmed ? "opacity-60" : ""
      } ${c.is_active ? "border-white/10" : "border-dashed border-white/20"}`}
    >
      <div className="flex flex-col sm:flex-row sm:items-start gap-4">
        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <h3 className="text-cream font-semibold truncate">{title}</h3>
            {c.band_name && c.band_name !== title && (
              <span className="text-xs text-cream-muted">— {c.band_name}</span>
            )}
            <span
              className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                c.is_active
                  ? "bg-green-500/10 text-green-400 border border-green-500/20"
                  : "bg-white/5 text-cream-muted border border-white/10"
              }`}
            >
              {c.is_active ? "פורסם" : "טיוטה"}
            </span>
          </div>

          <p className="text-cream-muted text-sm mb-3">
            {new Date(c.date).toLocaleDateString(lang === "he" ? "he-IL" : "en-US", {
              weekday: "short",
              year: "numeric",
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
            {" · "}
            {lang === "he" ? c.location_he : c.location_en}
          </p>

          {/* Stats row */}
          <div className="flex flex-wrap gap-4 text-sm mb-3">
            <Stat
              label="Registered"
              value={`${c.stats.totalSpots} / ${c.capacity}`}
              highlight={isFull}
            />
            <Stat label="Check-ins" value={c.stats.checkedIn} color="text-green-400" />
            {c.stats.waitlist > 0 && (
              <Stat label="Waitlist" value={c.stats.waitlist} color="text-gold" />
            )}
            <Stat label="Price" value={`₪${c.price_nis}`} />
          </div>

          {/* Capacity bar */}
          <div className="h-1.5 rounded-full bg-white/10 overflow-hidden w-full max-w-xs">
            <div
              className={`h-full rounded-full transition-all ${
                isFull ? "bg-red-400" : fillPct > 80 ? "bg-gold" : "bg-green-400"
              }`}
              style={{ width: `${fillPct}%` }}
            />
          </div>
          <p className="text-cream-muted text-xs mt-1">
            {fillPct}% capacity filled
          </p>
        </div>

        {/* Actions */}
        <div className="flex sm:flex-col gap-2 sm:items-end flex-shrink-0">
          <Link
            href={`/admin/${c.id}`}
            className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-cream text-xs font-medium hover:border-gold/40 hover:text-gold transition-colors whitespace-nowrap"
          >
            רשימת אורחים
          </Link>
          <Link
            href={`/admin/${c.id}/edit`}
            className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-cream text-xs font-medium hover:border-gold/40 hover:text-gold transition-colors"
          >
            עריכה
          </Link>
          <button
            onClick={() => onToggleActive(c)}
            className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-cream-muted text-xs hover:border-white/30 hover:text-cream transition-colors"
          >
            {c.is_active ? "הסתר" : "פרסם"}
          </button>
          <button
            onClick={() => onDelete(c.id)}
            disabled={deletingId === c.id}
            className="px-3 py-1.5 rounded-lg border border-red-500/20 text-red-400 text-xs hover:bg-red-500/10 transition-colors disabled:opacity-40"
          >
            {deletingId === c.id ? "…" : "מחק"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  highlight,
  color,
}: {
  label: string;
  value: string | number;
  highlight?: boolean;
  color?: string;
}) {
  return (
    <span className="flex items-center gap-1">
      <span className="text-cream-muted">{label}:</span>
      <span
        className={`font-semibold ${
          highlight ? "text-red-400" : color ?? "text-cream"
        }`}
      >
        {value}
      </span>
    </span>
  );
}
