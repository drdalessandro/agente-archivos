"use client";

import React, { ReactNode } from "react";
import { MantineProvider } from "@mantine/core";
import { Notifications } from "@mantine/notifications";
import { MedplumProvider } from "@medplum/react";
import { medplumBrowserClient } from "@/libs/medplumBrowserClient";
import { useRouter } from "next/navigation";

interface ThemeProviderProps {
  children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const router = useRouter();

  return (
    <MantineProvider>
      <Notifications />
      <MedplumProvider
        medplum={medplumBrowserClient}
        navigate={(path) => router.push(path)}
      >
        {children}
      </MedplumProvider>
    </MantineProvider>
  );
}
