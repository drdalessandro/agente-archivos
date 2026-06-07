"use client";

import React, { useEffect, ReactNode } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { AppShell, Logo, useMedplumProfile } from "@medplum/react";
import { medplumBrowserClient } from "@/libs/medplumBrowserClient";
import { parseClientCookies, clearCookie } from "@/libs/cookies";
import { Users, FileText } from "lucide-react";

interface MedplumAppShellProps {
  children: ReactNode;
}

export function MedplumAppShell({ children }: MedplumAppShellProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const profile = useMedplumProfile() as any;

  // Initialize browser client from cookie token on every mount/refresh
  useEffect(() => {
    const cookies = parseClientCookies();
    const token = cookies.medplumAccessToken;
    if (token && !medplumBrowserClient.getAccessToken()) {
      medplumBrowserClient.setAccessToken(token);
    }
  }, []);

  const isPatient = profile?.resourceType === "Patient";

  const patientMenus = [
    {
      title: "Mi portal de salud",
      links: [
        {
          icon: <FileText size={16} />,
          label: "Mis documentos",
          href: "/paciente/dashboard",
        },
      ],
    },
  ];

  const professionalMenus = [
    {
      title: "Gestión clínica",
      links: [
        {
          icon: <Users size={16} />,
          label: "Pacientes",
          href: "/Dashboard",
        },
      ],
    },
  ];

  const menus = isPatient ? patientMenus : professionalMenus;

  return (
    <AppShell
      logo={<Logo size={24} />}
      pathname={pathname ?? "/"}
      searchParams={new URLSearchParams(searchParams?.toString() ?? "")}
      menus={menus}
      headerSearchDisabled
    >
      {children}
    </AppShell>
  );
}
