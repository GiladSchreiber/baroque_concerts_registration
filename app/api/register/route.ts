import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";
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

  const supabase = createServerClient();

  const { data: concert, error: concertError } = await supabase
    .from("concerts").select("capacity, title_he, date").eq("id", concert_id).single();
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

  // Send confirmation email via Gmail SMTP
  const gmailUser = process.env.GMAIL_USER;
  const gmailPass = process.env.GMAIL_APP_PASSWORD;
  if (gmailUser && gmailPass) {
    try {
      const nodemailer = await import("nodemailer");
      const QRCode = await import("qrcode");
      const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: { user: gmailUser, pass: gmailPass },
      });
      const concertDate = new Date(concert.date).toLocaleDateString("he-IL", {
        weekday: "long", year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit",
      });
      const qrDataUrl = await QRCode.toDataURL(reg.id, {
        width: 300, margin: 2, color: { dark: "#0a0a14", light: "#f0e6d3" },
      });
      await transporter.sendMail({
        from: `"Baroque Bar Cafe" <${gmailUser}>`,
        to: email,
        subject: `אישור הרשמה – ${concert.title_he}`,
        html: `
          <div dir="rtl" style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#0a0a14;color:#f0e6d3;padding:32px;border-radius:12px;">
            <h1 style="color:#c9a227;text-align:center;">ההרשמה התקבלה 🎶</h1>
            <p>שלום ${full_name},</p>
            <p>הרשמתך לקונצרט <strong>${concert.title_he}</strong> אושרה.</p>
            <ul>
              <li><strong>תאריך:</strong> ${concertDate}</li>
              <li><strong>מקומות:</strong> ${spots}</li>
            </ul>
            ${onWaitlist
              ? `<p style="color:#e4c060;">⚠️ הועברת לרשימת המתנה. נעדכן אותך אם יתפנה מקום.</p>`
              : `<div style="text-align:center;margin:24px 0;">
                   <img src="cid:qrcode" style="width:200px;height:200px;" />
                   <p style="margin-top:12px;font-size:13px;color:#a09070;">הצג קוד זה בכניסה לאירוע</p>
                 </div>
                 <p style="text-align:center;">
                   <a href="${appUrl}/confirmation/${reg.id}" style="color:#c9a227;">${appUrl}/confirmation/${reg.id}</a>
                 </p>`
            }
          </div>`,
        attachments: onWaitlist ? [] : [
          {
            filename: "qrcode.png",
            content: qrDataUrl.split("base64,")[1],
            encoding: "base64",
            cid: "qrcode",
          },
        ],
      });
    } catch (emailErr) {
      console.error("[register] Email send failed:", emailErr);
    }
  }

  return NextResponse.json({
    id: reg.id,
    on_waitlist: onWaitlist,
    spots_left: Math.max(0, concert.capacity - spotsTaken - spots),
  });
}
