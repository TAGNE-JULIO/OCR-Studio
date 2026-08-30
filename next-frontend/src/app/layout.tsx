import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "⚡ OCR Studio – Manuscrit vers Texte",
  description: "Application professionnelle de reconnaissance d'écriture manuscrite propulsée par l'IA. Convertissez, structurez et exportez vos documents en quelques secondes.",
  keywords: ["OCR", "manuscrit", "reconnaissance", "intelligence artificielle", "tableau", "Excel"],
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" translate="no" suppressHydrationWarning className={`${geistSans.variable} ${geistMono.variable}`}>
      <body className="min-h-screen bg-[#111318] text-gray-100 overflow-hidden">
        {children}
      </body>
    </html>
  );
}
