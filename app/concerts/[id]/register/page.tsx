"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { useLanguage } from "@/components/LanguageProvider";
import type { Concert } from "@/lib/database.types";

const buildSchema = (t: ReturnType<typeof useLanguage>["t"]) =>
  z.object({
    full_name: z.string().min(2, t.required),
    phone: z.string().min(7, t.invalidPhone).max(20, t.invalidPhone),
    email: z.string().email(t.invalidEmail),
    spots: z.coerce
      .number()
      .int()
      .min(1, t.spotsMin)
      .max(4, t.spotsMax4),
  });

type FormValues = {
  full_name: string;
  phone: string;
  email: string;
  spots: number;
};

export default function RegisterPage() {
  const { id } = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const isWaitlist = searchParams.get("waitlist") === "1";
  const router = useRouter();
  const { t, lang } = useLanguage();
  const [concert, setConcert] = useState<Concert | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState("");

  const schema = buildSchema(t);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema) as Resolver<FormValues>,
    defaultValues: { spots: 1 },
  });

  const selectedSpots = Number(watch("spots") ?? 1);

  useEffect(() => {
    fetch(`/api/concerts/${id}`)
      .then((r) => r.json())
      .then((data) => setConcert(data.concert))
      .catch(() => router.push("/"))
      .finally(() => setLoading(false));
  }, [id, router]);

  const onSubmit = async (values: FormValues) => {
    setSubmitting(true);
    setServerError("");
    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ concert_id: id, ...values, spots: Number(values.spots) }),
      });
      const data = await res.json();
      if (!res.ok) {
        setServerError(data.error ?? t.errorGeneral);
        return;
      }
      router.push(`/confirmation/${data.id}`);
    } catch {
      setServerError(t.errorGeneral);
    } finally {
      setSubmitting(false);
    }
  };

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

  if (!concert) return null;

  const title = lang === "he" ? concert.title_he : concert.title_en;

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-12">

          {/* How it works */}
          <div className="rounded-2xl border border-gold/20 bg-navy-light p-6 mb-4">
            <h2 className="text-gold font-semibold mb-3">{t.howItWorks}</h2>
            <p className="text-cream-muted text-sm leading-relaxed mb-3">
              {lang === "he"
                ? `הרשמה עולה ${concert.price_nis} ₪ למקום ומזכה אתכם ב:`
                : `Registration costs ${concert.price_nis} NIS per spot and includes:`}
            </p>
            <ul className="space-y-1.5">
              {t.whatYouGetItems.map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-cream-muted">
                  <span className="text-gold mt-0.5">✦</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-2xl border border-white/10 bg-navy-card p-8">
          {/* Header */}
          <div className="mb-8 pb-6 border-b border-white/10">
            <h1 className="text-2xl font-bold text-cream mb-1">
              {title}
            </h1>
            {isWaitlist && (
              <div className="mt-3 rounded-lg bg-gold/10 border border-gold/20 px-4 py-2 text-gold text-sm">
                {t.waitlistNote}
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Full name */}
            <Field label={t.fullName} error={errors.full_name?.message}>
              <input
                {...register("full_name")}
                className={inputCls(!!errors.full_name)}
                placeholder={lang === "he" ? "ישראל ישראלי" : "Jane Smith"}
                autoComplete="name"
              />
            </Field>

            {/* Phone */}
            <Field label={t.phone} error={errors.phone?.message}>
              <input
                {...register("phone")}
                type="tel"
                className={inputCls(!!errors.phone)}
                placeholder="050-0000000"
                autoComplete="tel"
                dir="ltr"
              />
            </Field>

            {/* Email */}
            <Field label={t.email} error={errors.email?.message}>
              <input
                {...register("email")}
                type="email"
                className={inputCls(!!errors.email)}
                placeholder="you@example.com"
                autoComplete="email"
                dir="ltr"
              />
            </Field>

            {/* Spots */}
            <Field
              label={t.numberOfSpots}
              hint={t.spotsHint}
              error={errors.spots?.message}
            >
              <div className="flex items-center gap-3">
                {[1, 2, 3, 4].map((n) => (
                  <label key={n} className="flex-1">
                    <input
                      type="radio"
                      value={n}
                      {...register("spots")}
                      className="sr-only peer"
                    />
                    <span className="flex items-center justify-center h-12 rounded-xl border border-white/20 text-cream-muted cursor-pointer peer-checked:border-gold peer-checked:bg-gold/10 peer-checked:text-gold hover:border-white/40 transition-colors text-sm font-semibold">
                      {n}
                    </span>
                  </label>
                ))}
              </div>
              {concert.price_nis > 0 && (
                <div className="mt-3 flex items-center justify-between px-4 py-2.5 rounded-xl bg-gold/10 border border-gold/20">
                  <span className="text-cream-muted text-sm">
                    {lang === "he" ? "סה״כ לתשלום" : "Total"}
                  </span>
                  <span className="text-gold font-bold text-lg">
                    {selectedSpots * concert.price_nis} ₪
                  </span>
                </div>
              )}
            </Field>

            {serverError && (
              <p className="text-red-400 text-sm bg-red-900/20 border border-red-500/30 rounded-lg px-4 py-3">
                {serverError}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-4 rounded-xl bg-gold text-navy font-bold text-base hover:bg-gold-light transition-colors disabled:opacity-60 disabled:cursor-not-allowed shadow-[0_4px_20px_#c9a22740] mt-2"
            >
              {submitting ? t.submitting : t.submit}
            </button>
          </form>
        </div>
      </main>
      <Footer />
    </div>
  );
}

const inputCls = (hasError: boolean) =>
  `w-full px-4 py-3 rounded-xl bg-navy border ${
    hasError ? "border-red-500/60" : "border-white/20"
  } text-cream placeholder-cream-muted/50 focus:outline-none focus:border-gold/60 transition-colors`;

function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-cream mb-1.5">
        {label}
        {hint && <span className="text-cream-muted font-normal ms-2 text-xs">({hint})</span>}
      </label>
      {children}
      {error && <p className="mt-1.5 text-red-400 text-xs">{error}</p>}
    </div>
  );
}
