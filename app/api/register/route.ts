import { NextRequest, NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/is-configured";
import {
  localGetConcert,
  localGetRegistrations,
  localInsertRegistration,
} from "@/lib/local-store";
import { z } from "zod";

const schema = z.object({
  concert_id: z.string().uuid(),
  full_name: z.string().min(2).max(100),
  phone: z.string().min(7).max(20),
  email: z.string().email(),
  spots: z.number().int().min(1).max(4),
});

export async function POST(req: NextRequest) {
  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ error: "Validation failed", issues: parsed.error.issues }, { status: 400 });

  const { concert_id, full_name, phone, email, spots } = parsed.data;

  // ── Local mode ─────────────────────────────────────────────────────────────
  if (!isSupabaseConfigured()) {
    const concert = localGetConcert(concert_id);
    if (!concert) return NextResponse.json({ error: "Concert not found" }, { status: 404 });

    const existing = localGetRegistrations(concert_id).filter((r) => !r.on_waitlist);
    const spotsTaken = existing.reduce((s, r) => s + r.spots, 0);
    const onWaitlist = spotsTaken + spots > concert.capacity;

    const reg = localInsertRegistration({ concert_id, full_name, phone, email, spots, on_waitlist: onWaitlist });
    return NextResponse.json({ id: reg.id, on_waitlist: onWaitlist, spots_left: Math.max(0, concert.capacity - spotsTaken - spots) });
  }

  // ── Supabase mode ──────────────────────────────────────────────────────────
  const { createServerClient } = await import("@/lib/supabase-server");
  const { Resend } = await import("resend");
  const QRCode = await import("qrcode");

  const supabase = createServerClient();

  const { data: concert, error: concertError } = await supabase
    .from("concerts").select("capacity, title_en, title_he, date, location_en").eq("id", concert_id).single();
  if (concertError || !concert)
    return NextResponse.json({ error: "Concert not found" }, { status: 404 });

  const { data: existing } = await supabase
    .from("registrations").select("spots").eq("concert_id", concert_id).eq("on_waitlist", false);
  const spotsTaken = (existing ?? []).reduce((s, r) => s + r.spots, 0);
  const onWaitlist = spotsTaken + spots > concert.capacity;

  const { data: reg, error: insertError } = await supabase
    .from("registrations").insert({ concert_id, full_name, phone, email, spots, on_waitlist: onWaitlist }).select().single();
  if (insertError || !reg)
    return NextResponse.json({ error: "Failed to register" }, { status: 500 });

  // Send email
  const resendKey = process.env.RESEND_API_KEY;
  if (resendKey && !resendKey.includes("your_resend")) {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    const qrDataUrl = await QRCode.toDataURL(reg.id, { width: 300, margin: 2, color: { dark: "#0a0a14", light: "#f0e6d3" } });
    const resend = new Resend(resendKey);
    const concertDate = new Date(concert.date).toLocaleDateString("he-IL", { weekday: "long", year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" });
    await resend.emails.send({
      from: "Baroque Concerts <noreply@yourdomain.com>",
      to: email,
      subject: `אישור הרשמה – ${concert.title_he}`,
      html: `<div dir="rtl" style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#0a0a14;color:#f0e6d3;padding:32px;border-radius:12px;"><h1 style="color:#c9a227;text-align:center;">ההרשמה אושרה! 🎶</h1><p>שלום ${full_name},</p><p>הרשמתך לקונצרט <strong>${concert.title_he}</strong> אושרה.</p><ul><li><strong>תאריך:</strong> ${concertDate}</li><li><strong>מקומות:</strong> ${spots}</li></ul>${onWaitlist ? `<p style="color:#e4c060;">⚠️ הועברת לרשימת המתנה.</p>` : `<div style="text-align:center;margin:24px 0;"><img src="${qrDataUrl}" style="width:200px;height:200px;" /></div><p>דף האישור: <a href="${appUrl}/confirmation/${reg.id}" style="color:#c9a227;">${appUrl}/confirmation/${reg.id}</a></p>`}</div>`,
    });
  }

  return NextResponse.json({ id: reg.id, on_waitlist: onWaitlist, spots_left: Math.max(0, concert.capacity - spotsTaken - spots) });
}
