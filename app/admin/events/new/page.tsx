"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AdminNavbar } from "@/components/AdminNavbar";
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
    const pw = localStorage.getItem("admin_password");
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

    router.back();
  };

  return (
    <div className="min-h-screen flex flex-col">
      <AdminNavbar />

      <main className="flex-1 max-w-3xl mx-auto w-full px-4 py-10" dir="rtl">
        <h1 className="text-2xl font-bold text-cream mb-10">אירוע חדש</h1>

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
