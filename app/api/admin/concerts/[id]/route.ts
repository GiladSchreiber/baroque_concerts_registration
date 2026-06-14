import { NextRequest, NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/is-configured";
import {
  localGetConcert,
  localGetRegistrations,
  localGetStats,
  localUpdateConcert,
  localDeleteConcert,
} from "@/lib/local-store";
import type { Concert } from "@/lib/database.types";

function checkAuth(req: NextRequest) {
  return req.headers.get("x-admin-password") === process.env.ADMIN_PASSWORD;
}

// GET — concert + registrations (admin, bypasses is_active filter)
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!checkAuth(req))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  if (!isSupabaseConfigured()) {
    const concert = localGetConcert(id);
    if (!concert) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const registrations = localGetRegistrations(id);
    return NextResponse.json({ concert, registrations, stats: localGetStats(id) });
  }

  const { createServerClient } = await import("@/lib/supabase-server");
  const supabase = createServerClient();
  const [concertRes, regsRes] = await Promise.all([
    supabase.from("concerts").select("*").eq("id", id).single(),
    supabase.from("registrations").select("*").eq("concert_id", id).order("created_at", { ascending: false }),
  ]);
  if (concertRes.error || !concertRes.data)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  const regs = regsRes.data ?? [];
  const confirmed = regs.filter((r) => !r.on_waitlist);
  const stats = {
    totalSpots: confirmed.reduce((s, r) => s + r.spots, 0),
    registrations: confirmed.length,
    checkedIn: confirmed.filter((r) => r.checked_in).length,
    waitlist: regs.filter((r) => r.on_waitlist).length,
  };
  return NextResponse.json({ concert: concertRes.data, registrations: regs, stats });
}

// PUT — update concert
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!checkAuth(req))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json() as Partial<Omit<Concert, "id" | "created_at">>;

  if (!isSupabaseConfigured()) {
    const updated = localUpdateConcert(id, body as Partial<Concert>);
    if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(updated);
  }

  const { createServerClient } = await import("@/lib/supabase-server");
  const supabase = createServerClient();
  const { data, error } = await supabase.from("concerts").update(body).eq("id", id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// DELETE — remove concert
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!checkAuth(req))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  if (!isSupabaseConfigured()) {
    localDeleteConcert(id);
    return NextResponse.json({ success: true });
  }

  const { createServerClient } = await import("@/lib/supabase-server");
  const supabase = createServerClient();
  const { error } = await supabase.from("concerts").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
