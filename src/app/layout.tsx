import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";
import { CartProvider } from "@/lib/cart-context";
import { I18nProvider } from "@/lib/i18n-context";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { ToastProvider } from "@/components/Toast";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "TravelHub — Путешествия по всему миру",
  description:
    "Единая платформа для путешествий. Туры, отели, авиабилеты, экскурсии, гиды и фотографы — всё в одном месте.",
  openGraph: {
    title: "TravelHub — Путешествия по всему миру",
    description:
      "Единая платформа для путешествий. Туры, отели, авиабилеты, экскурсии, гиды и фотографы — всё в одном месте.",
    url: process.env.NEXT_PUBLIC_BASE_URL || "https://travelhub.com",
    siteName: "TravelHub",
    images: [
      {
        url: `${process.env.NEXT_PUBLIC_BASE_URL || "https://travelhub.com"}/og-image.png`,
        width: 1200,
        height: 630,
        alt: "TravelHub — Путешествия по всему миру",
      },
    ],
    locale: "ru_RU",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "TravelHub — Путешествия по всему миру",
    description:
      "Единая платформа для путешествий. Туры, отели, авиабилеты, экскурсии, гиды и фотографы — всё в одном месте.",
    images: [`${process.env.NEXT_PUBLIC_BASE_URL || "https://travelhub.com"}/og-image.png`],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ru"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <I18nProvider>
          <AuthProvider>
            <CartProvider>
              <ToastProvider>
                <Header />
                <main className="flex-1">{children}</main>
                <Footer />
              </ToastProvider>
            </CartProvider>
          </AuthProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
