"use client";

import { motion } from "framer-motion";
import { GlitchText } from "@/components/effects/glitch-text";
import { CipherReveal } from "@/components/effects/cipher-reveal";

const GUILD_ID = process.env.NEXT_PUBLIC_DISCORD_GUILD_ID;

export default function ContactPage() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-void px-6 py-16">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E")`,
          backgroundSize: "256px 256px",
        }}
      />

      <motion.div
        className="relative z-10 flex max-w-md flex-col items-center gap-12"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.5 }}
      >
        <div className="flex flex-col items-center gap-2">
          <GlitchText
            text="CONTACT"
            className="text-3xl font-bold tracking-[0.3em] text-gold sm:text-4xl"
            as="h1"
            glitchInterval={5000}
            glitchIntensity={0.15}
          />
          <CipherReveal
            text="// FLOOR 9 — THE FRONT DESK"
            className="text-xs tracking-[0.3em] text-foreground/25"
            duration={800}
            delay={500}
          />
        </div>

        <motion.div
          className="flex w-full flex-col gap-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 1 }}
        >
          <p className="text-center text-sm text-foreground/40">
            the front desk is open.
          </p>

          {/* Contact methods */}
          <div className="flex flex-col gap-1">
            <a
              href="mailto:bret@bret.gold"
              className="flex items-center gap-4 border-b border-foreground/5 px-4 py-3 transition-all hover:bg-foreground/[0.02]"
            >
              <span className="w-16 text-[10px] tracking-wider text-foreground/20">
                EMAIL
              </span>
              <span className="text-xs text-foreground/50 transition-colors hover:text-gold/60">
                bret@bret.gold
              </span>
            </a>
            <a
              href="https://github.com/bretgold"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-4 border-b border-foreground/5 px-4 py-3 transition-all hover:bg-foreground/[0.02]"
            >
              <span className="w-16 text-[10px] tracking-wider text-foreground/20">
                GITHUB
              </span>
              <span className="text-xs text-foreground/50 transition-colors hover:text-gold/60">
                @bretgold
              </span>
            </a>
            {GUILD_ID && (
              <a
                href={`https://discord.com/channels/${GUILD_ID}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-4 border-b border-foreground/5 px-4 py-3 transition-all hover:bg-foreground/[0.02]"
              >
                <span className="w-16 text-[10px] tracking-wider text-foreground/20">
                  DISCORD
                </span>
                <span className="text-xs text-foreground/50 transition-colors hover:text-gold/60">
                  The Building
                </span>
              </a>
            )}
          </div>
        </motion.div>

        <motion.p
          className="text-center text-xs text-foreground/15"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
        >
          leave a message. the building will pass it along.
        </motion.p>

        {/* Links */}
        <motion.div
          className="flex flex-col items-center gap-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2 }}
        >
          <div className="flex gap-6 text-xs">
            <a href="/about" className="text-foreground/30 transition-colors hover:text-gold/60">
              /about
            </a>
            <a href="/work" className="text-foreground/30 transition-colors hover:text-gold/60">
              /work
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
