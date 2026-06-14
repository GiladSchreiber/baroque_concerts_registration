"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

export default function ConcertPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  useEffect(() => {
    router.replace(`/concerts/${id}/register`);
  }, [id, router]);

  return null;
}
