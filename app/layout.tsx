import React from "react";
import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Prompt } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { Toaster } from "@/components/ui/sonner";
import { PWARegister } from "@/components/pwa-register";
import { ErrorBoundary, AsyncErrorBoundary } from "@/components/error-boundary";
import { validateEnv } from "@/lib/validate-env";
import "./globals.css";

// Validate environment variables on startup
if (typeof window === "undefined") {
  validateEnv();
}

const _geist = Geist({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });
const _prompt = Prompt({
  subsets: ["thai", "latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Pet Grooming - ระบบจัดการร้านอาบน้ำตัดขนสัตว์",
  description: "ระบบบริหารจัดการร้านอาบน้ำตัดขนสัตว์ครบวงจร",
  generator: "bbp.app",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Pet Grooming",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#4a9f6e",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th">
      <head>
        <link rel="apple-touch-icon" href="/icon-192.png" />
      </head>
      <body className="font-sans antialiased">
        <ErrorBoundary>
          <AsyncErrorBoundary>
            <PWARegister />
            {children}
            <Toaster position="top-right" richColors />
            <Analytics />
          </AsyncErrorBoundary>
        </ErrorBoundary>
      </body>
    </html>
  );
}
