import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";

export async function POST(req: NextRequest) {
  if (req.headers.get("x-admin-password") !== process.env.ADMIN_PASSWORD)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get("file") as File | null;

  if (!file)
    return NextResponse.json({ error: "No file provided" }, { status: 400 });

  const ext = file.name.split(".").pop() ?? "jpg";
  const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const supabase = createServerClient();
  const { error } = await supabase.storage
    .from("concert-posters")
    .upload(fileName, buffer, { contentType: file.type, upsert: false });

  if (error) {
    console.error("[upload-image] Supabase storage error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const { data: { publicUrl } } = supabase.storage.from("concert-posters").getPublicUrl(fileName);
  return NextResponse.json({ url: publicUrl });
}
