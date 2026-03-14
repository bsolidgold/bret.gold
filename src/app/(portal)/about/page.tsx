"use client";

import { motion } from "framer-motion";
import { GlitchText } from "@/components/effects/glitch-text";
import { CipherReveal } from "@/components/effects/cipher-reveal";

export default function AboutPage() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-void px-6 py-16">
      {/* Background static */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E")`,
          backgroundSize: "256px 256px",
        }}
      />

      <motion.div
        className="relative z-10 flex max-w-lg flex-col items-center gap-12"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.5 }}
      >
        <div className="flex flex-col items-center gap-2">
          <GlitchText
            text="BRET GOLD"
            className="text-3xl font-bold tracking-[0.2em] text-gold sm:text-4xl"
            as="h1"
            glitchInterval={5000}
            glitchIntensity={0.15}
          />
          <CipherReveal
            text="// ABOUT"
            className="text-xs tracking-[0.4em] text-foreground/25"
            duration={800}
            delay={500}
          />
        </div>

        <motion.div
          className="flex flex-col gap-6 text-sm leading-relaxed text-foreground/50"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 1 }}
        >
          <p>
            builder. writer. fighter. recovering human.
          </p>
          <p>
            i make software, write things nobody asked for,
            and train jiu-jitsu until my body remembers
            what my mind keeps trying to forget.
          </p>
          <p>
            this building is the thing i built to hold
            everything i care about in one place.
            code on one floor. poetry on another.
            and real human shit for real humans.
          </p>
          <p className="text-foreground/30">
            the building is always growing. so am i.
          </p>
        </motion.div>

        {/* Links */}
        <motion.div
          className="flex flex-col items-center gap-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5, duration: 1 }}
        >
          <div className="flex gap-6 text-xs">
            <a href="/work" className="text-foreground/30 transition-colors hover:text-gold/60">
              /work
            </a>
            <a href="/contact" className="text-foreground/30 transition-colors hover:text-gold/60">
              /contact
            </a>
            <a href="/building" className="text-foreground/30 transition-colors hover:text-gold/60">
              /building
            </a>
          </div>
          <a
            href="/"
            className="text-[10px] text-foreground/15 transition-colors hover:text-foreground/30"
          >
            back to lobby
          </a>
        </motion.div>
      </motion.div>
    </div>
  );
}
