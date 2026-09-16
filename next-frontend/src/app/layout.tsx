import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "OCR Studio Pro — Transcription Intelligente de Manuscrits",
  description: "Plateforme professionnelle de transcription de manuscrits, formules mathématiques et tableaux par IA.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" translate="no" suppressHydrationWarning>
      <body className="min-h-screen bg-[#080b14] text-[#e8eaf2] mesh-bg antialiased selection:bg-[#7c5cfc]/30 selection:text-[#22d4fd]">
        {children}
      </body>
    </html>
  );
}
