"use client";

import { MedplumClient } from "@medplum/core";

// Client-side only MedplumClient used by MedplumProvider and SignInForm.
// Does NOT contain the client secret (server-only).
export const medplumBrowserClient = new MedplumClient({
  baseUrl: "https://api.medplum.com.ar/",
  clientId: process.env.MEDPLUM_CLIENT_ID,
});
