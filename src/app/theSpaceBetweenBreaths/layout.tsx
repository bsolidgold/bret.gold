import { Lora } from "next/font/google";
import type { Metadata } from "next";

const lora = Lora({
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "The Space Between Breaths",
  description: "A memoir by Bret Gold",
  robots: { index: false, follow: false },
};

export default function BookLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <style>{`
        .scanlines::after,
        .vignette::before {
          display: none !important;
        }
        .crt-tear {
          animation: none !important;
        }
      `}</style>
      <div
        className={`${lora.className} min-h-screen`}
        style={{
          background: "#0f0f0f",
          color: "#d4cfc4",
          fontSize: "18px",
          lineHeight: "1.8",
        }}
      >
        {children}
      </div>
    </>
  );
}
