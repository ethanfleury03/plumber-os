import type { Metadata, Viewport } from "next";
import { IBM_Plex_Mono, Manrope } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";
import { absoluteUrl, getSiteUrl } from "@/lib/marketing/site";
import { ConsentManager } from "@/components/consent/ConsentManager";

const appSans = Manrope({
  variable: "--font-app-sans",
  subsets: ["latin"],
});

const appMono = IBM_Plex_Mono({
  variable: "--font-app-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "AWP Growth Portal",
  description:
    "AWP Growth Portal helps Adirondack White Pine Cabins organize cabin leads, partner outreach, marketing assets, website growth, and reporting.",
  metadataBase: new URL(getSiteUrl()),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    url: "/",
    title: "AWP Growth Portal",
    description:
      "Organize cabin leads, partner outreach, marketing assets, website growth, and reporting.",
    siteName: "AWP Growth Portal",
    images: [
      {
        url: absoluteUrl("/opengraph-image"),
        width: 1200,
        height: 630,
        alt: "AWP Growth Portal",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "AWP Growth Portal",
    description:
      "Organize cabin leads, partner outreach, marketing assets, website growth, and reporting.",
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
        className={`${appSans.variable} ${appMono.variable} antialiased min-h-screen flex flex-col bg-white`}
      >
        <ClerkProvider signInUrl="/sign-in" signUpUrl="/sign-up">
          <div className="flex-1 min-h-0">{children}</div>
          <ConsentManager />
        </ClerkProvider>
      </body>
    </html>
  );
}
