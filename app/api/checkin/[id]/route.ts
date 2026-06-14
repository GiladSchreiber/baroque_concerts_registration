import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (req.headers.get("x-admin-password") !== process.env.ADMIN_PASSWORD)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = createServerClient();

  const { data: reg, error: fetchError } = await supabase
    .from("registrations").select("id, checked_in, on_waitlist").eq("id", id).single();
  if (fetchError || !reg) return NextResponse.json({ error: "Registration not found" }, { status: 404 });
  if (reg.on_waitlist) return NextResponse.json({ error: "Registration is on waitlist" }, { status: 400 });
  if (reg.checked_in) return NextResponse.json({ error: "already_checked_in" }, { status: 409 });

  const { error: updateError } = await supabase
    .from("registrations").update({ checked_in: true, checked_in_at: new Date().toISOString() }).eq("id", id);
  if (updateError) return NextResponse.json({ error: "Failed to check in" }, { status: 500 });

  return NextResponse.json({ success: true });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (req.headers.get("x-admin-password") !== process.env.ADMIN_PASSWORD)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = createServerClient();
  await supabase
    .from("registrations")
    .update({ checked_in: false, checked_in_at: null })
    .eq("id", id);

  return NextResponse.json({ success: true });
}
