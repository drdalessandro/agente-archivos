"use client";

import { MedplumClient } from "@medplum/core";

// Client-side only MedplumClient used by MedplumProvider and SignInForm.
// Does NOT contain the client secret (server-only).
export const medplumBrowserClient = new MedplumClient({
  baseUrl: "https://api.epa-bienestar.com.ar/",
  clientId: process.env.NEXT_PUBLIC_MEDPLUM_CLIENT_ID,
});
