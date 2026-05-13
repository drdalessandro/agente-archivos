"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { SignInForm } from "@medplum/react";
import { medplumBrowserClient } from "@/libs/medplumBrowserClient";
import "./medplumsignin.css";

const GOOGLE_CLIENT_ID =
  process.env.MEDPLUM_GOOGLE_CLIENT_ID ??
  "472653584585-u2f6fefb1qck4mojs78nuq6mfht8uqht.apps.googleusercontent.com";

const PROJECT_ID = process.env.MEDPLUM_PROJECT_ID;

interface MedplumSignInProps {
  titulo: string;
  expectedRole?: "patient" | "professional";
}

export default function MedplumSignIn({ titulo, expectedRole }: MedplumSignInProps) {
  const router = useRouter();

  const handleSuccess = () => {
    const profile = medplumBrowserClient.getProfile() as any;
    const token = medplumBrowserClient.getAccessToken();

    if (!token || !profile) {
      return;
    }

    const resourceType: string = profile.resourceType ?? "";
    const isPatient = resourceType === "Patient";
    const isProfessional = resourceType === "Practitioner" || resourceType === "RelatedPerson";

    // Validate against expected role if provided
    if (expectedRole === "patient" && !isPatient) {
      alert("Esta cuenta no corresponde a un paciente registrado.");
      medplumBrowserClient.signOut();
      return;
    }
    if (expectedRole === "professional" && !isProfessional) {
      alert("Esta cuenta no corresponde a un profesional registrado.");
      medplumBrowserClient.signOut();
      return;
    }

    const maxAge = 30 * 24 * 60 * 60;
    const base = `path=/; samesite=strict; max-age=${maxAge}`;

    document.cookie = `medplumAccessToken=${token}; ${base}`;
    document.cookie = `medplumUserInfo=${encodeURIComponent(JSON.stringify(profile))}; ${base}`;

    if (isPatient) {
      document.cookie = `medplumUserRole=patient; ${base}`;
      document.cookie = `medplumPatientId=${profile.id ?? ""}; ${base}`;
      document.cookie = `medplumUserEmail=${encodeURIComponent(profile.telecom?.find((t: any) => t.system === "email")?.value ?? "")}; ${base}`;
      router.push("/paciente/dashboard");
    } else {
      document.cookie = `medplumUserRole=professional; ${base}`;
      router.push("/Dashboard");
    }
  };

  return (
    <section className="signInSection">
      <div className="signInCard">
        <h2 className="signInTitle">{titulo}</h2>
        <SignInForm
          googleClientId={GOOGLE_CLIENT_ID}
          projectId={PROJECT_ID}
          onSuccess={handleSuccess}
        />
      </div>
    </section>
  );
}
