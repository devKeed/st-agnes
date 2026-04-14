import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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
  title: "St Agnes | Fashion Booking Platform",
  description: "Book custom design, alteration, and rental fittings with St Agnes.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-neutral-50 text-neutral-900">
        <header className="border-b bg-white">
          <nav className="mx-auto flex w-full max-w-6xl items-center gap-6 px-4 py-4 text-sm">
            <a href="/" className="font-semibold">
              St Agnes
            </a>
            <a href="/rentals">Rentals</a>
            <a href="/booking">Booking</a>
            <a href="/terms">Terms</a>
            <a href="/privacy">Privacy</a>
            <a href="/admin" className="ml-auto">
              Admin
            </a>
          </nav>
        </header>
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">{children}</main>
        <footer className="border-t bg-white">
          <div className="mx-auto flex w-full max-w-6xl flex-col gap-2 px-4 py-6 text-xs text-neutral-600">
            <p>St Agnes Atelier</p>
            <p>Email: contact@st-agnes.com</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
