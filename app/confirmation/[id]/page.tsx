"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { format } from "date-fns";
import { he } from "date-fns/locale";
import { Navbar } from "@/components/Navbar";
import { QRCodeDisplay } from "@/components/QRCodeDisplay";
import { Footer } from "@/components/Footer";
import { useLanguage } from "@/components/LanguageProvider";
import type { Registration, Concert } from "@/lib/database.types";

type ConfirmationData = Registration & { concert: Concert };

export default function ConfirmationPage() {
  const { id } = useParams<{ id: string }>();
  const { t, lang } = useLanguage();
  const [data, setData] = useState<ConfirmationData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const res = await fetch(`/api/registrations/${id}`);
      if (res.ok) {
        const json = await res.json();
        setData(json as ConfirmationData);
      }
      setLoading(false);
    };
    load();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="w-8 h-8 rounded-full border-2 border-gold border-t-transparent animate-spin" />
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center text-cream-muted">
          Registration not found.
        </div>
      </div>
    );
  }

  const concertTitle = lang === "he" ? data.concert.title_he : data.concert.title_en;

  const formatDate = (date: string) => {
    const d = new Date(date);
    if (lang === "he") return format(d, "EEEE, d בMMMM yyyy · HH:mm", { locale: he });
    return format(d, "EEEE, MMMM d, yyyy · h:mm a");
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-12">
        {data.on_waitlist ? (
          <WaitlistConfirmation data={data} t={t} lang={lang} concertTitle={concertTitle} />
        ) : (
          <FullConfirmation data={data} t={t} lang={lang} concertTitle={concertTitle} formatDate={formatDate} />
        )}
      </main>
      <Footer />
    </div>
  );
}

function FullConfirmation({ data, t, lang, concertTitle, formatDate }: {
  data: ConfirmationData;
  t: ReturnType<typeof useLanguage>["t"];
  lang: string;
  concertTitle: string;
  formatDate: (d: string) => string;
}) {
  const formattedDate = formatDate(data.concert.date);
  const [datePart, timePart] = formattedDate.split(" · ");

  return (
    <div className="text-center">
      <h1 className="text-3xl font-bold text-cream mb-8">
        {lang === "he" ? "ההרשמה התקבלה" : "Registration Confirmed"}
      </h1>

      <div className="mb-8">
        <div className="flex justify-center">
          <QRCodeDisplay value={data.id} size={220} downloadName={`baroque-${concertTitle}`} downloadData={{ name: data.full_name, concert: concertTitle, date: formattedDate, spots: data.spots }} />
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-navy-card p-6 text-start">
        <h2 className="text-gold font-semibold mb-4">{t.registrationDetails}</h2>
        <dl className="space-y-3">
          <Detail label={t.name} value={data.full_name} />
          <Detail label={t.concert} value={concertTitle} />
          <Detail label={t.date} value={datePart ?? formattedDate} />
          {timePart && <Detail label={lang === "he" ? "שעה" : "Time"} value={timePart} />}
          <Detail label={t.spots} value={String(data.spots)} />
        </dl>
      </div>
    </div>
  );
}

function WaitlistConfirmation({ data, t, lang, concertTitle }: {
  data: ConfirmationData;
  t: ReturnType<typeof useLanguage>["t"];
  lang: string;
  concertTitle: string;
}) {
  return (
    <div className="text-center">
      <h1 className="text-3xl font-bold text-cream mb-3">{t.onWaitlist}</h1>
      <p className="text-cream-muted mb-8 max-w-md mx-auto">{t.waitlistNote}</p>
      <div className="rounded-2xl border border-white/10 bg-navy-card p-6 text-start">
        <h2 className="text-gold font-semibold mb-4">{t.registrationDetails}</h2>
        <dl className="space-y-3">
          <Detail label={t.name} value={data.full_name} />
          <Detail label={t.concert} value={concertTitle} />
          <Detail label={t.spots} value={String(data.spots)} />
          <Detail label={lang === "he" ? "אימייל" : "Email"} value={data.email} />
        </dl>
      </div>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <dt className="text-cream-muted text-sm">{label}</dt>
      <dd className="text-cream text-sm font-medium text-end">{value}</dd>
    </div>
  );
}
