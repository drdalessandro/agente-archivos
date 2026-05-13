import type { Metadata } from "next";
import { IBM_Plex_Sans } from "next/font/google";
import { ThemeProvider } from "./components/ThemeProviders";
import "@mantine/core/styles.css";
import "@mantine/notifications/styles.css";
import "./globals.css";

const inter = IBM_Plex_Sans({ weight: "400", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Agente-Archivos",
  description: "Post visit summarizer for physicians and patients",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className={inter.className || ""}>
        <ThemeProvider defaultTheme="root">{children}</ThemeProvider>
      </body>
    </html>
  );
}
