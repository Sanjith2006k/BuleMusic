import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "sonner";
import AudioProvider from "@/providers/AudioProvider";
import AppInitializer from "@/components/common/AppInitializer";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Bule Music",
  description: "Listen together in sync.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body className={`${inter.variable} antialiased`}>
        <AppInitializer>
          <AudioProvider>{children}</AudioProvider>
        </AppInitializer>
        <Toaster position="top-center" richColors theme="dark" closeButton />
      </body>
    </html>
  );
}
