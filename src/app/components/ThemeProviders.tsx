"use client";

import React, { ReactNode } from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { MantineProvider } from "@mantine/core";
import { Notifications } from "@mantine/notifications";
import { MedplumProvider } from "@medplum/react";
import { medplumBrowserClient } from "@/libs/medplumBrowserClient";

interface ThemeProviderProps {
  children: ReactNode;
  defaultTheme: string;
}

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return (
    <NextThemesProvider {...props}>
      <MantineProvider>
        <Notifications />
        <MedplumProvider medplum={medplumBrowserClient}>
          {children}
        </MedplumProvider>
      </MantineProvider>
    </NextThemesProvider>
  );
}
