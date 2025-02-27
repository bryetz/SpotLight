import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Header } from '@/app/components/layout/Header';
import { Footer } from '@/app/components/layout/Footer';
import { AuthProvider } from '@/app/components/providers/AuthProvider';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SpotLight",
  description: "Geolocation based social media platform",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-[#1a1a1b] text-[#d7dadc] min-h-screen flex flex-col`}>
        <div className="dot-grid" />
        <AuthProvider>
          <Header />
          <main className="flex-grow">
            {children}
          </main>
          <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}
