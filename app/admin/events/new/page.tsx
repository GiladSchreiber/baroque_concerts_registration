"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import {
  EventForm,
  formValuesToConcert,
  type EventFormValues,
} from "@/components/EventForm";

export default function NewEventPage() {
  const router = useRouter();
  const adminPassword = useRef("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState("");

  useEffect(() => {
    const pw = sessionStorage.getItem("admin_password");
    if (!pw) {
      router.push("/admin");
      return;
    }
    adminPassword.current = pw;
  }, [router]);

  const handleSubmit = async (values: EventFormValues) => {
    setIsSubmitting(true);
    setServerError("");

    const payload = formValuesToConcert(values);

    const res = await fetch("/api/admin/concerts", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-admin-password": adminPassword.current,
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (!res.ok) {
      setServerError(data.error ?? "Failed to create event");
      setIsSubmitting(false);
      return;
    }

    router.push("/admin/concerts");
  };

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

        <h1 className="text-2xl font-bold text-cream mb-2">אירוע חדש</h1>
        <p className="text-cream-muted text-sm mb-10">
          מלא את הפרטים ופרסם כשמוכן.
        </p>

        <div className="rounded-2xl border border-white/10 bg-navy-card p-8">
          <EventForm
            onSubmit={handleSubmit}
            submitLabel="צור אירוע"
            isSubmitting={isSubmitting}
            serverError={serverError}
          />
        </div>
      </main>
    </div>
  );
}
