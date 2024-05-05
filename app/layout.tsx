"use client";

import "./globals.css";
// import { GeistSans } from "geist/font/sans";
import { Toaster } from "@/components/ui/toaster";

// const fontSans = Inter({ subsets: ["latin"], variable: "--font-sans" });
// const fontSans = GeistSans;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head />
      <body className="min-h-screen bg-background font-sans antialiased">
        <div data-tauri-drag-region className="h-[25px] w-screen absolute" />
        {children}
        <Toaster />
      </body>
    </html>
  );
}
