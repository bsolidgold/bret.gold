"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";
import { motion } from "framer-motion";
import { GlitchText } from "@/components/effects/glitch-text";
import { CipherReveal } from "@/components/effects/cipher-reveal";
import { setResident, decodeBase64Url } from "@/lib/resident";

function WelcomeContent() {
  const searchParams = useSearchParams();
  const user = searchParams.get("user") || "stranger";
  const archetype = searchParams.get("archetype") || "";

  // Store resident data in localStorage for returning user detection
  useEffect(() => {
    const residentParam = searchParams.get("resident");
    if (residentParam) {
      try {
        const data = JSON.parse(decodeBase64Url(residentParam));
        setResident(data);
      } catch {
        // Non-critical — silently fail
      }
    }
  }, [searchParams]);

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-void px-8">
      <motion.div
        className="flex flex-col items-center gap-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 2 }}
      >
        <p className="text-xs tracking-[0.3em] text-foreground/30">
          THE ELEVATOR HAS STOPPED
        </p>

        <GlitchText
          text="WELCOME TO THE BUILDING"
          className="text-2xl font-bold tracking-wider text-gold sm:text-3xl"
          as="h1"
          glitchInterval={4000}
          glitchIntensity={0.2}
        />

        <motion.div
          className="flex flex-col items-center gap-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5, duration: 1 }}
        >
          <p className="text-sm text-foreground/40">
            {user}, you have been sorted.
          </p>
          {archetype && (
            <CipherReveal
              text={archetype.toUpperCase()}
              className="text-lg tracking-[0.2em] text-gold/60"
              duration={1200}
              delay={500}
            />
          )}
        </motion.div>

        <motion.div
          className="mt-8 flex flex-col items-center gap-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 3, duration: 1 }}
        >
          <p className="max-w-sm text-center text-xs leading-relaxed text-foreground/30">
            Check Discord. Your floor access has been granted.
            <br />
            Some doors may still be waiting for approval.
          </p>

          <div className="flex gap-4">
            <a
              href="https://discord.com/channels/@me"
              target="_blank"
              rel="noopener noreferrer"
              className="border border-gold/30 px-6 py-3 text-sm tracking-[0.15em] text-gold/70 transition-all duration-500 hover:border-gold/60 hover:bg-gold/5"
            >
              OPEN DISCORD
            </a>
            <a
              href="/"
              className="border border-foreground/15 px-6 py-3 text-sm tracking-[0.15em] text-foreground/40 transition-all duration-500 hover:border-foreground/30 hover:text-foreground/60"
            >
              BACK TO LOBBY
            </a>
          </div>
        </motion.div>

        <motion.div
          className="flex flex-col items-center gap-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 4.5, duration: 1.5 }}
        >
          <p className="text-[10px] tracking-[0.3em] text-foreground/20">
            EXPLORE THE BUILDING
          </p>
          <div className="flex flex-wrap justify-center gap-4 text-xs">
            <a href="/about" className="text-foreground/30 transition-colors hover:text-gold/60">/about</a>
            <a href="/work" className="text-foreground/30 transition-colors hover:text-gold/60">/work</a>
            <a href="/writing" className="text-foreground/30 transition-colors hover:text-gold/60">/writing</a>
            <a href="/feed" className="text-foreground/30 transition-colors hover:text-gold/60">/feed</a>
            <a href="/building" className="text-foreground/30 transition-colors hover:text-gold/60">/building</a>
          </div>
        </motion.div>
      </motion.div>

      <motion.p
        className="fixed bottom-8 text-xs text-foreground/20"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 5, duration: 2 }}
      >
        the building remembers.
      </motion.p>
    </div>
  );
}

export default function WelcomePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-void">
          <p className="text-sm text-foreground/30">...</p>
        </div>
      }
    >
      <WelcomeContent />
    </Suspense>
  );
}
