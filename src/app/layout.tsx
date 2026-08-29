import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AuthProvider } from "@/lib/auth/local-auth";
import { cn } from "@/utils/utils";
import { Toaster } from "@/components/ui/sonner";
import { OnboardingGate } from "@/components/lorest/onboarding-gate";
import { I18nProvider } from "@/components/i18n/i18n-provider";
import { LocaleSyncEffect } from "@/components/i18n/locale-sync-effect";
import { PreviewInspector } from "@/components/eazo/preview-inspector";
import { getServerLocale } from "@/lib/i18n/server-preference";

const SITE_URL = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : undefined;

// The platform stamps the real product title/description into .env at scaffold
// time (NEXT_PUBLIC_APP_TITLE / NEXT_PUBLIC_APP_DESCRIPTION). These drive the
// app's <title> / meta description. Fall back to a generic default when unset
// (e.g. local dev before any scaffold values are written).
const SITE_TITLE = process.env.NEXT_PUBLIC_APP_TITLE?.trim() || "Eazo App";
const SITE_DESCRIPTION =
  process.env.NEXT_PUBLIC_APP_DESCRIPTION?.trim() || "An app build by eazo.ai";

// Point-select bridge for the Creator Canvas. The Creator platform injects
// NEXT_PUBLIC_EAZO_INSPECTOR=1 into the sandbox dev server's environment at
// preview startup only; it is never written to .env or into published/
// production builds, and the bridge is additionally inert unless running inside
// the Creator iframe.
const INSPECTOR_ENABLED = process.env.NEXT_PUBLIC_EAZO_INSPECTOR === "1";

export const metadata: Metadata = {
  ...(SITE_URL ? { metadataBase: new URL(SITE_URL) } : {}),
  title: SITE_TITLE,
  description: SITE_DESCRIPTION,
  icons: {
    icon: "/favicon.svg",
  },
  openGraph: {
    type: "website",
    siteName: "Eazo",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    url: "/",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getServerLocale();

  return (
    <html
      lang={locale}
      suppressHydrationWarning
      className={cn(
        "h-full antialiased",
        "font-sans",
      )}
    >
      <body
        className="h-full flex flex-col"
        data-eazo-preview-inspector-runtime=""
      >
        <I18nProvider>
          <AuthProvider>
            <LocaleSyncEffect />
            <OnboardingGate />
            {children}
            <Toaster />
            {INSPECTOR_ENABLED && <PreviewInspector />}
          </AuthProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
