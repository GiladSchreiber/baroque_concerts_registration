"use client";

import Link from "next/link";
import { format } from "date-fns";
import { he } from "date-fns/locale";
import { useLanguage } from "@/components/LanguageProvider";
import type { Concert } from "@/lib/database.types";

export type ConcertWithCapacity = Concert & {
  spotsLeft?: number;
  isFull?: boolean;
};

export function ConcertCard({
  concert,
  lang,
  t,
}: {
  concert: ConcertWithCapacity;
  lang: string;
  t: ReturnType<typeof useLanguage>["t"];
}) {
  const title = lang === "he" ? concert.title_he : concert.title_en;
  const description = lang === "he" ? concert.description_he : concert.description_en;
  const bandName = lang === "he" ? concert.band_name : (concert.band_name_en || concert.band_name);

  const spotsLeft = concert.spotsLeft ?? concert.capacity;
  const isFull = concert.isFull ?? false;
  const isLow = !isFull && spotsLeft <= 10;

  const formatDate = (date: string) => {
    const d = new Date(date);
    if (lang === "he") return format(d, "EEEE, d בMMMM yyyy · HH:mm", { locale: he });
    return format(d, "EEEE, MMMM d, yyyy · h:mm a");
  };

  return (
    <Link
      href={`/concerts/${concert.id}/register`}
      className="group flex flex-col rounded-2xl overflow-hidden border border-white/10 bg-navy-card hover:border-gold/40 transition-all duration-300 hover:shadow-[0_0_30px_#c9a22720]"
    >
      {/* Poster */}
      <div className="relative">
        {concert.poster_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={concert.poster_url} alt={title} className="w-full object-contain" />
        ) : (
          <div className="flex items-center justify-center py-16 bg-navy-light">
            <span className="text-6xl opacity-20">🎼</span>
          </div>
        )}
        {isFull && (
          <span className="absolute top-3 end-3 bg-red-900/80 text-red-200 text-xs font-medium px-2.5 py-1 rounded-full backdrop-blur-sm">
            {t.soldOut}
          </span>
        )}
        {isLow && (
          <span className="absolute top-3 end-3 bg-gold/80 text-stone-900 text-xs font-bold px-2.5 py-1 rounded-full backdrop-blur-sm">
            {t.spotsLeft(spotsLeft)}
          </span>
        )}
      </div>

      {/* Info */}
      <div className="flex flex-col p-5 gap-3">
        <div className="grid grid-cols-2 gap-8">
          {/* Col 1: title + artists */}
          <div className="flex flex-col gap-1">
            <h3 className="text-lg font-semibold text-cream leading-snug">
              {title}
              {concert.band_name && <span className="text-gold"> | {bandName}</span>}
            </h3>
            {concert.artists && concert.artists.length > 0 && (() => {
              const hasInstruments = concert.artists.some(
                (a) => (lang === "he" ? a.instrument : (a.instrument_en || a.instrument))
              );
              if (hasInstruments) {
                return (
                  <div className="flex flex-col gap-0.5">
                    {concert.artists.map((a, i) => {
                      const name = lang === "he" ? a.name : (a.name_en || a.name);
                      const instrument = lang === "he" ? a.instrument : (a.instrument_en || a.instrument);
                      return (
                        <p key={i} className="text-cream-muted text-base font-semibold">
                          {name}{instrument ? ` · ${instrument}` : ""}
                        </p>
                      );
                    })}
                  </div>
                );
              } else {
                return (
                  <p className="text-cream-muted text-base font-semibold">
                    {concert.artists.map((a) => lang === "he" ? a.name : (a.name_en || a.name)).join(" · ")}
                  </p>
                );
              }
            })()}
          </div>

          {/* Col 2: description */}
          <div>
            {description && (
              <p className="text-cream-muted text-base leading-relaxed">{description}</p>
            )}
          </div>
        </div>

        {/* Date */}
        <p className="text-cream-muted text-base">{formatDate(concert.date)}</p>

        {/* Divider + price + register */}
        <div className="flex items-center justify-between pt-3 border-t border-white/8">
          <span className="text-gold font-semibold text-base">
            {concert.price_nis} {t.nis}
            <span className="text-sm font-normal text-cream-muted"> / {t.perSpot}</span>
          </span>
          {isFull ? (
            <span className="text-sm font-semibold text-cream-muted">{t.soldOut}</span>
          ) : (
            <span className="text-sm font-semibold tracking-widest text-gold/60 group-hover:text-gold transition-colors">
              {t.registerBtn} {lang === "he" ? "←" : "→"}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
