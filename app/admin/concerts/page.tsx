"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AdminNavbar } from "@/components/AdminNavbar";
import type { ConcertWithStats } from "@/lib/database.types";

export default function AdminConcertListPage() {
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
    const pw = localStorage.getItem("admin_password");
    if (!pw) {
      router.push("/admin");
      return;
    }
    adminPassword.current = pw;
    load(pw);
  }, [router, load]);

  const handleDelete = async (id: string) => {
    if (!confirm("למחוק את האירוע? פעולה זו אינה הפיכה.")) return;
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
  };

  const upcoming = concerts.filter((c) => new Date(c.date) >= new Date());
  const past = concerts.filter((c) => new Date(c.date) < new Date());

  return (
    <div className="min-h-screen flex flex-col">
      <AdminNavbar />

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-10" dir="rtl">
        {/* Header */}
        <div className="flex items-center justify-between mb-10">
          <h1 className="text-2xl font-bold text-cream">אירועים</h1>
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
                title="upcoming"
                concerts={upcoming}
                onDelete={handleDelete}
                deletingId={deletingId}
              />
            )}
            {past.length > 0 && (
              <EventGroup
                title="past"
                concerts={past}
                onDelete={handleDelete}
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
  onDelete,
  deletingId,
  dimmed,
}: {
  title: string;
  concerts: ConcertWithStats[];
  onDelete: (id: string) => void;
  deletingId: string | null;
  dimmed?: boolean;
}) {
  return (
    <div>
      <div className="space-y-4">
        {concerts.map((c) => (
          <EventCard
            key={c.id}
            concert={c}
            onDelete={onDelete}
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
  onDelete,
  deletingId,
  dimmed,
}: {
  concert: ConcertWithStats;
  onDelete: (id: string) => void;
  deletingId: string | null;
  dimmed?: boolean;
}) {
  const title = c.title_he;
  const isFull = c.stats.totalSpots >= c.capacity;

  return (
    <Link
      href={`/admin/${c.id}`}
      className={`relative block rounded-2xl border bg-navy-card p-5 transition-opacity hover:border-gold/40 transition-all ${
        dimmed ? "opacity-60" : ""
      } ${c.is_active ? "border-white/10" : "border-dashed border-white/20"}`}
    >
      {/* Corner actions */}
      <button
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); onDelete(c.id); }}
        disabled={deletingId === c.id}
        className="absolute top-3 end-3 p-1.5 rounded-lg text-cream-muted/40 hover:text-cream-muted transition-colors disabled:opacity-40"
        title="מחק"
      >
        {deletingId === c.id
          ? <span className="w-4 h-4 flex items-center justify-center text-xs">…</span>
          : <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
        }
      </button>

      <div className="flex flex-col sm:flex-row sm:items-start gap-4 pt-6 pb-2">
        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <h3 className="text-cream font-semibold truncate">{title}</h3>
            {c.band_name && c.band_name !== title && (
              <span className="text-xs text-cream-muted">— {c.band_name}</span>
            )}
          </div>

          <p className="text-cream-muted text-sm mb-3">
            {new Date(c.date).toLocaleDateString("he-IL", {
              weekday: "short",
              year: "numeric",
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>

          {/* Stats row */}
          <div className="flex flex-wrap gap-4 text-sm mb-3">
            <Stat label="נרשמו" value={`${c.stats.totalSpots} / ${c.capacity}`} highlight={isFull} />
            {c.stats.waitlist > 0 && (
              <Stat label="רשימת המתנה" value={c.stats.waitlist} color="text-gold" />
            )}
          </div>

          {/* Capacity bar */}
          <div className="h-1.5 rounded-full bg-white/10 overflow-hidden w-full max-w-xs">
            <div
              className={`h-full rounded-full transition-all ${
                isFull ? "bg-red-400" : c.stats.totalSpots / c.capacity > 0.8 ? "bg-gold" : "bg-green-400"
              }`}
              style={{ width: `${Math.min(100, Math.round((c.stats.totalSpots / c.capacity) * 100))}%` }}
            />
          </div>
        </div>

      </div>
    </Link>
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
