import { NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/is-configured";
import { localGetConcerts } from "@/lib/local-store";

export async function GET() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(localGetConcerts(true));
  }

  const { createServerClient } = await import("@/lib/supabase-server");
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("concerts")
    .select("*")
    .eq("is_active", true)
    .order("date", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
