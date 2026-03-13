import type { Metadata } from "next";
import { Geist_Mono } from "next/font/google";
import { ScreenGlitch } from "@/components/effects/screen-glitch";
import "./globals.css";

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "GOLD",
  description: "You found the building.",
  icons: { icon: "/favicon.ico" },
  openGraph: {
    title: "GOLD",
    description: "You found the building.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${geistMono.variable} antialiased scanlines vignette`}>
        <ScreenGlitch>
          {children}
        </ScreenGlitch>
      </body>
    </html>
  );
}
