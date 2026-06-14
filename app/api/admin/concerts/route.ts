import { NextRequest, NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/is-configured";
import {
  localGetConcerts,
  localGetRegistrations,
  localInsertConcert,
} from "@/lib/local-store";
import type { Concert } from "@/lib/database.types";

function checkAuth(req: NextRequest) {
  return req.headers.get("x-admin-password") === process.env.ADMIN_PASSWORD;
}

export async function GET(req: NextRequest) {
  if (!checkAuth(req))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!isSupabaseConfigured()) {
    const concerts = localGetConcerts();
    const allRegs = localGetRegistrations();
    const statsMap = new Map<string, { totalSpots: number; registrations: number; checkedIn: number; waitlist: number }>();
    for (const r of allRegs) {
      if (!statsMap.has(r.concert_id))
        statsMap.set(r.concert_id, { totalSpots: 0, registrations: 0, checkedIn: 0, waitlist: 0 });
      const s = statsMap.get(r.concert_id)!;
      if (r.on_waitlist) { s.waitlist += 1; }
      else { s.totalSpots += r.spots; s.registrations += 1; if (r.checked_in) s.checkedIn += 1; }
    }
    return NextResponse.json(
      concerts.map((c) => ({ ...c, stats: statsMap.get(c.id) ?? { totalSpots: 0, registrations: 0, checkedIn: 0, waitlist: 0 } }))
    );
  }

  const { createServerClient } = await import("@/lib/supabase-server");
  const supabase = createServerClient();
  const [concertsRes, regsRes] = await Promise.all([
    supabase.from("concerts").select("*").order("date", { ascending: false }),
    supabase.from("registrations").select("concert_id, spots, checked_in, on_waitlist"),
  ]);
  if (concertsRes.error) return NextResponse.json({ error: concertsRes.error.message }, { status: 500 });

  const statsMap = new Map<string, { totalSpots: number; registrations: number; checkedIn: number; waitlist: number }>();
  for (const r of regsRes.data ?? []) {
    if (!statsMap.has(r.concert_id))
      statsMap.set(r.concert_id, { totalSpots: 0, registrations: 0, checkedIn: 0, waitlist: 0 });
    const s = statsMap.get(r.concert_id)!;
    if (r.on_waitlist) { s.waitlist += 1; }
    else { s.totalSpots += r.spots; s.registrations += 1; if (r.checked_in) s.checkedIn += 1; }
  }
  return NextResponse.json(
    (concertsRes.data ?? []).map((c) => ({ ...c, stats: statsMap.get(c.id) ?? { totalSpots: 0, registrations: 0, checkedIn: 0, waitlist: 0 } }))
  );
}

export async function POST(req: NextRequest) {
  if (!checkAuth(req))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json() as Omit<Concert, "id" | "created_at">;

  if (!isSupabaseConfigured()) {
    const concert = localInsertConcert(body);
    return NextResponse.json(concert, { status: 201 });
  }

  const { createServerClient } = await import("@/lib/supabase-server");
  const supabase = createServerClient();
  const { data, error } = await supabase.from("concerts").insert(body).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
