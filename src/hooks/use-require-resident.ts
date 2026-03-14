"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getResident, type ResidentData } from "@/lib/resident";

export function useRequireResident() {
  const router = useRouter();
  const [resident, setResident] = useState<ResidentData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const data = getResident();
    if (!data) {
      router.replace("/");
    } else {
      setResident(data);
      setLoading(false);
    }
  }, [router]);

  return { resident, loading };
}
