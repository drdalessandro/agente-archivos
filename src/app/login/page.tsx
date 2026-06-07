"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { SignInForm, Logo } from "@medplum/react";
import { medplumBrowserClient } from "@/libs/medplumBrowserClient";
import "./login.css";

const PROJECT_ID = process.env.NEXT_PUBLIC_MEDPLUM_PROJECT_ID;

export default function LoginPage() {
  const router = useRouter();

  const handleSuccess = () => {
    const profile = medplumBrowserClient.getProfile() as any;
    const token = medplumBrowserClient.getAccessToken();

    if (!token || !profile) return;

    const maxAge = 30 * 24 * 60 * 60;
    const base = `path=/; samesite=strict; max-age=${maxAge}`;

    document.cookie = `medplumAccessToken=${token}; ${base}`;
    document.cookie = `medplumUserInfo=${encodeURIComponent(JSON.stringify(profile))}; ${base}`;

    if (profile.resourceType === "Patient") {
      document.cookie = `medplumUserRole=patient; ${base}`;
      document.cookie = `medplumPatientId=${profile.id ?? ""}; ${base}`;
      const email =
        profile.telecom?.find((t: any) => t.system === "email")?.value ?? "";
      document.cookie = `medplumUserEmail=${encodeURIComponent(email)}; ${base}`;
      router.push("/paciente/dashboard");
    } else {
      document.cookie = `medplumUserRole=professional; ${base}`;
      router.push("/Dashboard");
    }
  };

  return (
    <div className="loginPage">
      <div className="loginCard">
        <div className="loginHeader">
          <Logo size={48} />
          <h1 className="loginTitle">Proyecto Favaloro</h1>
          <p className="loginSubtitle">Medplum Argentina · Portal de documentos médicos</p>
        </div>
        <SignInForm
          projectId={PROJECT_ID}
          onSuccess={handleSuccess}
          disableGoogleAuth
        />
      </div>
    </div>
  );
}
