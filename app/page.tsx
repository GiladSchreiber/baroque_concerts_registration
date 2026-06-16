"use client";

import { useEffect, useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { useLanguage } from "@/components/LanguageProvider";
import { ConcertCard, type ConcertWithCapacity } from "@/components/ConcertCard";
import type { Concert } from "@/lib/database.types";

export default function Home() {
  const { t, lang } = useLanguage();
  const [concerts, setConcerts] = useState<ConcertWithCapacity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/concerts")
      .then((r) => r.json())
      .then((data: Concert[]) =>
        Promise.all(
          data.map((c) =>
            fetch(`/api/concerts/${c.id}`)
              .then((r) => r.json())
              .then((info) => ({
                ...c,
                spotsLeft: info.spotsLeft as number,
                isFull: info.isFull as boolean,
              }))
          )
        )
      )
      .then(setConcerts)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-12">
        {loading ? (
          <div className="flex justify-center py-32">
            <div className="w-8 h-8 rounded-full border-2 border-gold border-t-transparent animate-spin" />
          </div>
        ) : concerts.length === 0 ? (
          <p className="text-center text-cream-muted py-32">{t.noConcerts}</p>
        ) : (
          <div className="flex flex-col gap-6">
            {concerts.map((concert) => (
              <ConcertCard key={concert.id} concert={concert} lang={lang} t={t} />
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
