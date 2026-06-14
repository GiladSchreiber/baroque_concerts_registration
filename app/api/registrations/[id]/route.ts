import { NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/is-configured";
import { localGetRegistration, localGetConcert } from "@/lib/local-store";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (!isSupabaseConfigured()) {
    const reg = localGetRegistration(id);
    if (!reg) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const concert = localGetConcert(reg.concert_id);
    return NextResponse.json({ ...reg, concert });
  }

  const { createServerClient } = await import("@/lib/supabase-server");
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("registrations")
    .select("*, concert:concerts(*)")
    .eq("id", id)
    .single();

  if (error || !data) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(data);
}
