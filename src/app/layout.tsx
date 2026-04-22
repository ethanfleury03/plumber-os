import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";
import { absoluteUrl, getSiteUrl } from "@/lib/marketing/site";
import { ConsentManager } from "@/components/consent/ConsentManager";

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
  metadataBase: new URL(getSiteUrl()),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    url: "/",
    title: "PlumberOS - Run your plumbing business on autopilot",
    description:
      "Capture every call, dispatch the right tech, send estimates, collect payment, and keep customers happy — all from one place.",
    siteName: "PlumberOS",
    images: [
      {
        url: absoluteUrl("/opengraph-image"),
        width: 1200,
        height: 630,
        alt: "PlumberOS",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "PlumberOS - Run your plumbing business on autopilot",
    description:
      "Capture every call, dispatch the right tech, send estimates, collect payment, and keep customers happy — all from one place.",
    images: [absoluteUrl("/twitter-image")],
  },
};

export const viewport: Viewport = {
  themeColor: "#0E1A2B",
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
        <ClerkProvider signInUrl="/sign-in" signUpUrl="/sign-up">
          <div className="flex-1 min-h-0">{children}</div>
          <ConsentManager />
        </ClerkProvider>
      </body>
    </html>
  );
}
