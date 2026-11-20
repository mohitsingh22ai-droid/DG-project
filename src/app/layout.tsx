import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";

export const metadata: Metadata = {
  title: "W2P · Commercial Web-to-Print Platform",
  description: "Custom labels, race numbers, MTB boards, stamps, trophies and laser-cut work. Design online, see your price instantly and approve a proof before we print.",
};

/*
 * Google Fonts, linked from <head> rather than @import-ed from CSS: the browser can
 * start fetching them immediately instead of after globals.css has downloaded.
 * Only the weights the UI uses are requested; Fraunces (serif) is the heading face. Plus Jakarta Sans and JetBrains Mono
 * are also offered in the designer, so the canvas keeps their real family names.
 */
const FONTS_URL =
  "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800" +
  "&family=Fraunces:opsz,wght@9..144,500..800" +
  "&family=Plus+Jakarta+Sans:ital,wght@0,400;0,700;1,400;1,700" +
  "&family=JetBrains+Mono:wght@400;500;600;700&display=swap";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link rel="stylesheet" href={FONTS_URL} />
      </head>
      <body className="min-h-full flex flex-col bg-background text-foreground antialiased selection:bg-brand-500 selection:text-white">
        <AuthProvider>
          <Navbar />
          <main className="flex-1 flex flex-col">{children}</main>
          <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}
