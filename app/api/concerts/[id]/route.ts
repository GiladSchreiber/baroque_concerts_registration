import { NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/is-configured";
import { localGetConcert, localGetRegistrations } from "@/lib/local-store";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (!isSupabaseConfigured()) {
    const concert = localGetConcert(id);
    if (!concert) return NextResponse.json({ error: "Concert not found" }, { status: 404 });
    const regs = localGetRegistrations(id).filter((r) => !r.on_waitlist);
    const spotsTaken = regs.reduce((s, r) => s + r.spots, 0);
    return NextResponse.json({
      concert,
      spotsTaken,
      spotsLeft: Math.max(0, concert.capacity - spotsTaken),
      isFull: spotsTaken >= concert.capacity,
    });
  }

  const { createServerClient } = await import("@/lib/supabase-server");
  const supabase = createServerClient();

  const [concertRes, registrationsRes] = await Promise.all([
    supabase.from("concerts").select("*").eq("id", id).single(),
    supabase.from("registrations").select("spots, on_waitlist").eq("concert_id", id).eq("on_waitlist", false),
  ]);

  if (concertRes.error || !concertRes.data)
    return NextResponse.json({ error: "Concert not found" }, { status: 404 });

  const spotsTaken = (registrationsRes.data ?? []).reduce((s, r) => s + r.spots, 0);
  return NextResponse.json({
    concert: concertRes.data,
    spotsTaken,
    spotsLeft: Math.max(0, concertRes.data.capacity - spotsTaken),
    isFull: spotsTaken >= concertRes.data.capacity,
  });
}
