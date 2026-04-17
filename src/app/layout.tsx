import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
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
  title: "PlumberOS - Run your plumbing business on autopilot",
  description:
    "PlumberOS is the AI-first operating system for plumbing companies. Capture every call, dispatch the right tech, send estimates, collect payment, and keep customers happy — all from one place.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen flex flex-col bg-white`}
      >
        <ClerkProvider>
          <div className="flex-1 min-h-0">{children}</div>
        </ClerkProvider>
      </body>
    </html>
  );
}
