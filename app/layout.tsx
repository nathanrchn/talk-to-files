import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import NextTopLoader from "nextjs-toploader";
import { GeistSans } from "geist/font/sans";
import { ThemeProvider } from "@/components/theme-provider";

// const fontSans = Inter({ subsets: ["latin"], variable: "--font-sans" });
const fontSans = GeistSans;

export const metadata: Metadata = {
  title: "Talk To Files",
  description: "Talk to your files",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head />
      <body className={cn(
        "min-h-screen bg-background font-sans antialiased",
        fontSans.variable
      )}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
        <NextTopLoader color="black" showSpinner={false} />
      </body>
    </html>
  );
}