"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import {
  EventForm,
  concertToFormValues,
  formValuesToConcert,
  type EventFormValues,
} from "@/components/EventForm";
import type { Concert } from "@/lib/database.types";

export default function EditEventPage() {
  const params = useParams();
  const concertId = Array.isArray(params.concertId)
    ? params.concertId[0]
    : (params.concertId as string) ?? "";
  const router = useRouter();
  const adminPassword = useRef("");
  const [concert, setConcert] = useState<Concert | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState("");

  useEffect(() => {
    const pw = sessionStorage.getItem("admin_password");
    if (!pw) {
      router.push("/admin");
      return;
    }
    adminPassword.current = pw;

    const load = async () => {
      const res = await fetch(`/api/admin/concerts/${concertId}`, {
        headers: { "x-admin-password": pw },
      });
      if (res.ok) {
        const json = await res.json();
        if (json.concert) setConcert(json.concert as Concert);
      }
      setLoading(false);
    };
    load();
  }, [concertId, router]);

  const handleSubmit = async (values: EventFormValues) => {
    setIsSubmitting(true);
    setServerError("");

    const payload = formValuesToConcert(values);

    const res = await fetch(`/api/admin/concerts/${concertId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "x-admin-password": adminPassword.current,
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (!res.ok) {
      setServerError(data.error ?? "Failed to update event");
      setIsSubmitting(false);
      return;
    }

    router.push("/admin/concerts");
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

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-3xl mx-auto w-full px-4 py-10" dir="rtl">
        <Link
          href="/admin/concerts"
          className="inline-flex items-center gap-2 text-sm text-cream-muted hover:text-gold transition-colors mb-8"
        >
          → חזרה לאירועים
        </Link>

        <h1 className="text-2xl font-bold text-cream mb-1">עריכת אירוע</h1>
        <p className="text-cream-muted text-sm mb-10">{concert.title_he}</p>

        <div className="rounded-2xl border border-white/10 bg-navy-card p-8">
          <EventForm
            defaultValues={concertToFormValues(concert)}
            onSubmit={handleSubmit}
            submitLabel="שמור שינויים"
            isSubmitting={isSubmitting}
            serverError={serverError}
          />
        </div>
      </main>
    </div>
  );
}
