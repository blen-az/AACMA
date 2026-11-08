import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import localFont from "next/font/local";
import { AssistantProvider } from "@/components/assistant/AssistantProvider";
import { AssistantWidget } from "@/components/assistant/AssistantWidget";
import { RevealObserver } from "@/components/site/RevealObserver";
import { AGENCY } from "@/content/site";
import "./globals.css";

/*
 * Latin text uses the system font stack, exactly as the design template does.
 * Ethiopic text uses Noto Sans Ethiopic (OFL), limited by unicode-range so it only
 * ever renders Amharic characters (plan §6.2).
 */
const ethiopic = localFont({
  src: "./fonts/NotoSansEthiopic-ethiopic.woff2",
  weight: "400 700",
  display: "swap",
  variable: "--font-ethiopic",
  preload: false,
  // No generated Arial fallback face: it has no unicode-range and would capture Latin text.
  adjustFontFallback: false,
  fallback: [],
  declarations: [
    { prop: "unicode-range", value: "U+030E, U+1200-1399, U+2D80-2DDE, U+AB01-AB2E" },
  ],
});

export const metadata: Metadata = {
  title: { default: `${AGENCY.short} — ${AGENCY.name}`, template: `%s · ${AGENCY.short}` },
  description:
    "Ask questions in English or Amharic, report cleansing problems with a photo, and learn at the Virtual Training Centre.",
  icons: { icon: "/brand/aacma-logo-tight.svg" },
  robots: { index: false, follow: false }, // private staging (D13)
};

export const viewport: Viewport = {
  themeColor: "#020617",
  colorScheme: "dark",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // suppressHydrationWarning: the inline script below adds the "js" class before hydration.
    // data-scroll-behavior: lets Next turn off smooth scrolling during route changes (Next 16).
    <html lang="en" className={ethiopic.variable} data-scroll-behavior="smooth" suppressHydrationWarning>
      <head>
        {/* Enables scroll-reveal styles only when JS runs, so content is never hidden without it. */}
        <script dangerouslySetInnerHTML={{ __html: "document.documentElement.classList.add('js')" }} />
      </head>
      <body className="min-h-dvh font-sans">
        <AssistantProvider>
          {children}
          {/* Reads the URL (hidden on /admin), so it sits inside Suspense for dynamic routes. */}
          <Suspense fallback={null}>
            <AssistantWidget />
          </Suspense>
        </AssistantProvider>
        <Suspense fallback={null}>
          <RevealObserver />
        </Suspense>
      </body>
    </html>
  );
}
