import type { Metadata } from "next";
import { IBM_Plex_Sans } from "next/font/google";
import { ThemeProvider } from "./components/ThemeProviders";
import "@mantine/core/styles.css";
import "@mantine/notifications/styles.css";
import "@medplum/react/styles.css";
import "./globals.css";

const ibmPlex = IBM_Plex_Sans({ weight: ["400", "500", "600"], subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Proyecto Favaloro | Medplum Argentina",
  description: "Portal de documentos médicos — Medplum Argentina",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className={ibmPlex.className}>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
