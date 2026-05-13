import { MedplumClient } from "@medplum/core";

export const medplum = new MedplumClient({
  baseUrl: "https://api.epa-bienestar.com.ar/",
  clientId: process.env.MEDPLUM_CLIENT_ID,
  clientSecret: process.env.MEDPLUM_CLIENT_SECRET,
});
