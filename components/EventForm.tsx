"use client";

import { useEffect } from "react";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ImageUpload } from "./ImageUpload";
import type { Concert } from "@/lib/database.types";

// ─── Schema ──────────────────────────────────────────────────────────────────

const artistSchema = z.object({
  name: z.string().min(1, "שם חובה"),
  name_en: z.string().optional(),
  instrument: z.string().optional(),
  instrument_en: z.string().optional(),
});

export const eventSchema = z.object({
  band_name: z.string().min(1, "שדה חובה"),
  band_name_en: z.string().optional(),
  title_he: z.string().min(1, "שדה חובה"),
  title_en: z.string().min(1, "שדה חובה"),
  date_part: z.string().min(1, "שדה חובה"),   // "YYYY-MM-DD"
  time_part: z.string().min(1, "שדה חובה"),   // "HH:MM"
  description_he: z.string().optional(),
  description_en: z.string().optional(),
  artists: z.array(artistSchema),
  capacity: z.number().int().min(1, "מינימום 1"),
  price_nis: z.number().int().min(0, "מינימום 0"),
  poster_url: z.string().optional(),
});

export type EventFormValues = z.infer<typeof eventSchema>;

// Converts a Concert row into form default values
export function concertToFormValues(c: Concert): EventFormValues {
  const d = new Date(c.date);
  const pad = (n: number) => String(n).padStart(2, "0");
  return {
    band_name: c.band_name,
    band_name_en: c.band_name_en ?? "",
    title_he: c.title_he,
    title_en: c.title_en,
    date_part: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
    time_part: `${pad(d.getHours())}:${pad(d.getMinutes())}`,
    description_he: c.description_he,
    description_en: c.description_en,
    artists: c.artists ?? [],
    capacity: c.capacity,
    price_nis: c.price_nis,
    poster_url: c.poster_url ?? "",
  };
}

// Converts form values to Concert Insert payload
export function formValuesToConcert(v: EventFormValues): Omit<Concert, "id" | "created_at"> {
  return {
    band_name: v.band_name,
    band_name_en: v.band_name_en ?? "",
    artists: v.artists,
    title_he: v.title_he,
    title_en: v.title_en,
    date: new Date(`${v.date_part}T${v.time_part}:00`).toISOString(),
    location_he: "בן סירא 3, ירושלים",
    location_en: "Ben Sira 3, Jerusalem",
    description_he: v.description_he ?? "",
    description_en: v.description_en ?? "",
    details_he: "",
    details_en: "",
    capacity: v.capacity,
    price_nis: v.price_nis,
    poster_url: v.poster_url || null,
    is_active: true,
  };
}

// ─── Component ───────────────────────────────────────────────────────────────

type Props = {
  defaultValues?: EventFormValues;
  onSubmit: (values: EventFormValues) => Promise<void>;
  submitLabel: string;
  isSubmitting: boolean;
  serverError?: string;
};

const DEFAULT_VALUES: EventFormValues = {
  band_name: "",
  band_name_en: "",
  title_he: "",
  title_en: "",
  date_part: "",
  time_part: "20:00",
  description_he: "",
  description_en: "",
  artists: [],
  capacity: 80,
  price_nis: 120,
  poster_url: "",
};

export function EventForm({
  defaultValues,
  onSubmit,
  submitLabel,
  isSubmitting,
  serverError,
}: Props) {
  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
    reset,
  } = useForm<EventFormValues>({
    resolver: zodResolver(eventSchema),
    defaultValues: defaultValues ?? DEFAULT_VALUES,
  });

  useEffect(() => {
    if (defaultValues) reset(defaultValues);
  }, [defaultValues, reset]);

  const { fields: artistFields, append, remove } = useFieldArray({
    control,
    name: "artists",
  });

  const posterUrl = watch("poster_url");

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8" dir="rtl">

      {/* ── Section: פרטי האירוע ─────────────────────────────────── */}
      <Section title="פרטי האירוע">
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="שם הלהקה / האנסמבל (עברית)" error={errors.band_name?.message} required>
            <input
              {...register("band_name")}
              className={inputCls(!!errors.band_name)}
              placeholder="לדוג׳ אנסמבל בארוק ירושלים"
              dir="rtl"
            />
          </Field>
          <Field label="Band / Ensemble Name (English)" error={errors.band_name_en?.message}>
            <input
              {...register("band_name_en")}
              className={inputCls(!!errors.band_name_en)}
              placeholder="e.g. Jerusalem Baroque Ensemble"
              dir="ltr"
            />
          </Field>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="שם הקונצרט (עברית)" error={errors.title_he?.message} required>
            <input
              {...register("title_he")}
              className={inputCls(!!errors.title_he)}
              placeholder="שם הקונצרט בעברית"
              dir="rtl"
            />
          </Field>
          <Field label="Concert Title (English)" error={errors.title_en?.message} required>
            <input
              {...register("title_en")}
              className={inputCls(!!errors.title_en)}
              placeholder="Concert title in English"
              dir="ltr"
            />
          </Field>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="תאריך" error={errors.date_part?.message} required>
            <input
              type="date"
              {...register("date_part")}
              className={inputCls(!!errors.date_part)}
              dir="ltr"
            />
          </Field>
          <Field label="שעה" error={errors.time_part?.message} required>
            <input
              type="time"
              {...register("time_part")}
              className={inputCls(!!errors.time_part)}
              dir="ltr"
            />
          </Field>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="תיאור (עברית)">
            <textarea
              {...register("description_he")}
              rows={3}
              className={`${inputCls(false)} resize-none`}
              placeholder="תיאור קצר של הקונצרט..."
              dir="rtl"
            />
          </Field>
          <Field label="Description (English)">
            <textarea
              {...register("description_en")}
              rows={3}
              className={`${inputCls(false)} resize-none`}
              placeholder="Short description in English..."
              dir="ltr"
            />
          </Field>
        </div>
      </Section>

      {/* ── Section: אמנים ────────────────────────────────────────── */}
      <Section title="אמנים (אופציונלי)">
        <div className="space-y-2">
          {artistFields.map((field, i) => (
            <div key={field.id} className="flex gap-2 items-start">
              <div className="flex-1 grid sm:grid-cols-4 gap-2">
                <input
                  {...register(`artists.${i}.name`)}
                  className={inputCls(!!errors.artists?.[i]?.name)}
                  placeholder="שם (עברית)"
                  dir="rtl"
                />
                <input
                  {...register(`artists.${i}.name_en`)}
                  className={inputCls(false)}
                  placeholder="Name (English)"
                  dir="ltr"
                />
                <input
                  {...register(`artists.${i}.instrument`)}
                  className={inputCls(false)}
                  placeholder="כלי נגינה (עברית)"
                  dir="rtl"
                />
                <input
                  {...register(`artists.${i}.instrument_en`)}
                  className={inputCls(false)}
                  placeholder="Instrument (English)"
                  dir="ltr"
                />
              </div>
              <button
                type="button"
                onClick={() => remove(i)}
                className="mt-0.5 w-9 h-9 rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-colors text-sm flex-shrink-0"
              >
                ✕
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => append({ name: "", instrument: "" })}
            className="text-sm text-gold hover:text-gold-light transition-colors flex items-center gap-1.5"
          >
            + הוסף אמן
          </button>
        </div>
      </Section>

      {/* ── Section: כרטיסים ────────────────────────────────────────── */}
      <Section title="כרטיסים">
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="כמות מקסימאלית" error={errors.capacity?.message} required>
            <input
              type="number"
              {...register("capacity", { valueAsNumber: true })}
              className={inputCls(!!errors.capacity)}
              min={1}
              dir="ltr"
            />
          </Field>
          <Field label="מחיר (₪ למקום)" error={errors.price_nis?.message} required>
            <input
              type="number"
              {...register("price_nis", { valueAsNumber: true })}
              className={inputCls(!!errors.price_nis)}
              min={0}
              dir="ltr"
            />
          </Field>
        </div>
      </Section>

      {/* ── Section: פוסטר ─────────────────────────────────────────── */}
      <Section title="פוסטר הקונצרט">
        <Controller
          control={control}
          name="poster_url"
          render={() => (
            <ImageUpload
              value={posterUrl ?? ""}
              onChange={(url) => setValue("poster_url", url)}
            />
          )}
        />
      </Section>

      {/* ── Submit ──────────────────────────────────────────────────── */}
      {serverError && (
        <p className="text-red-400 text-sm bg-red-900/20 border border-red-500/30 rounded-lg px-4 py-3">
          {serverError}
        </p>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full py-4 rounded-xl bg-gold text-navy font-bold text-base hover:bg-gold-light transition-colors disabled:opacity-60 disabled:cursor-not-allowed shadow-[0_4px_20px_#c9a22740]"
      >
        {isSubmitting ? "שומר…" : submitLabel}
      </button>
    </form>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-4">
      <h3 className="text-xs font-semibold uppercase tracking-widest text-gold/70 border-b border-white/10 pb-2">
        {title}
      </h3>
      {children}
    </div>
  );
}

function Field({
  label,
  error,
  required,
  children,
}: {
  label: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-cream mb-1.5">
        {label}
        {required && <span className="text-gold ms-1">*</span>}
      </label>
      {children}
      {error && <p className="mt-1 text-red-400 text-xs">{error}</p>}
    </div>
  );
}

const inputCls = (hasError: boolean) =>
  `w-full px-4 py-3 rounded-xl bg-navy border ${
    hasError ? "border-red-500/60" : "border-white/20"
  } text-cream placeholder-cream-muted/50 focus:outline-none focus:border-gold/60 transition-colors text-sm`;
