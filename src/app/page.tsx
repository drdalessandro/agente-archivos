"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { parseClientCookies } from "@/libs/cookies";

export default function Home(): JSX.Element {
  const router = useRouter();

  useEffect(() => {
    const cookies = parseClientCookies();
    if (cookies.medplumAccessToken) {
      if (cookies.medplumUserRole === "patient") {
        router.replace("/paciente/dashboard");
      } else {
        router.replace("/Dashboard");
      }
    } else {
      router.replace("/login");
    }
  }, [router]);

  return <></>;
}
