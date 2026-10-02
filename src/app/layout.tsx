import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { LanguageProvider } from "@/context/LanguageContext";

// Industry standard UI font bundled locally by Next.js at build time (0 external requests)
const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Mumpy - Water Delivery & Fleet Management System",
  description:
    "Enterprise fleet dispatch, real-time telemetry, driver proximity logs, and hydration supply chain management for Mumpy Packaged Drinking Water.",
  keywords: [
    "Mumpy Water",
    "Water Delivery Management",
    "Fleet Telematics",
    "Proximity Routing",
    "Bottled Water Logistics",
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} font-sans`}>
      <body className={`${inter.className} bg-surface text-on-surface antialiased selection:bg-secondary-fixed selection:text-primary min-h-screen text-sm`}>
        <AuthProvider>
          <LanguageProvider>
            {children}
          </LanguageProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
