"use client";

import React from "react";
import Header from "./components/Header/header";
import Hero from "./components/Hero/hero";
import { parseClientCookies } from "@/libs/cookies";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Home(): JSX.Element {
  const router = useRouter();

  useEffect(() => {
    const cookies = parseClientCookies();
    if (cookies.medplumAccessToken) {
      if (cookies.medplumUserRole === "patient") {
        router.push("/paciente/dashboard");
      } else {
        router.push("/Dashboard");
      }
    }
  }, [router]);

  return (
    <main className="container">
      <Header />
      <Hero />
    </main>
  );
}
