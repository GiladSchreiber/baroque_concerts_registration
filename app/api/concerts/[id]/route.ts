import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = createServerClient();

  const [concertRes, registrationsRes] = await Promise.all([
    supabase.from("concerts").select("*").eq("id", id).single(),
    supabase.from("registrations").select("spots").eq("concert_id", id).eq("on_waitlist", false),
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
