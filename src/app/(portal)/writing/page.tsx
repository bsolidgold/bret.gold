"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GlitchText } from "@/components/effects/glitch-text";
import { CipherReveal } from "@/components/effects/cipher-reveal";

type Piece = {
  title: string;
  type: "poem" | "prose" | "fragment";
  content: string;
};

const PIECES: Piece[] = [
  {
    title: "UNTITLED (FLOOR 2)",
    type: "fragment",
    content: `i didn't come here to get better.
i came here because i ran out of places to hide.

the building doesn't care why you showed up.
it just asks if you're staying.`,
  },
  {
    title: "THE MAT",
    type: "poem",
    content: `the mat doesn't lie.
your body remembers everything
your mouth won't say.

tap or break.
that's the whole philosophy.`,
  },
  {
    title: "3AM",
    type: "fragment",
    content: `everyone who's ever been awake at 3am
knows something that the morning people don't.

the building is different at night.
the walls are thinner.
you can hear the other floors.`,
  },
];

function typeLabel(type: Piece["type"]) {
  switch (type) {
    case "poem": return "poem";
    case "prose": return "prose";
    case "fragment": return "fragment";
  }
}

export default function WritingPage() {
  const [expanded, setExpanded] = useState<string | null>(null);

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
        className="relative z-10 flex w-full max-w-lg flex-col items-center gap-10"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.5 }}
      >
        <div className="flex flex-col items-center gap-2">
          <GlitchText
            text="WRITING"
            className="text-3xl font-bold tracking-[0.3em] text-gold sm:text-4xl"
            as="h1"
            glitchInterval={5000}
            glitchIntensity={0.15}
          />
          <CipherReveal
            text="// FLOOR 6 — THE STUDY"
            className="text-xs tracking-[0.3em] text-foreground/25"
            duration={800}
            delay={500}
          />
        </div>

        <motion.p
          className="text-center text-sm text-foreground/30"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 1 }}
        >
          things i wrote. some finished. most not.
        </motion.p>

        {/* Pieces */}
        <div className="flex w-full flex-col gap-1">
          {PIECES.map((piece, i) => {
            const isOpen = expanded === piece.title;
            return (
              <motion.div
                key={piece.title}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + i * 0.1, duration: 0.4 }}
              >
                <button
                  className={`flex w-full items-center gap-4 border-b border-foreground/5 px-4 py-3 text-left transition-all duration-300
                    ${isOpen ? "bg-gold/5 border-gold/15" : "hover:bg-foreground/[0.02]"}
                  `}
                  onClick={() => setExpanded(isOpen ? null : piece.title)}
                >
                  <span
                    className={`flex-1 text-xs tracking-[0.15em] transition-colors ${isOpen ? "text-gold/80" : "text-foreground/40"}`}
                  >
                    {piece.title}
                  </span>
                  <span className="text-[10px] text-foreground/20">
                    {typeLabel(piece.type)}
                  </span>
                </button>
                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      className="overflow-hidden border-b border-gold/10 bg-gold/[0.02] px-6"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="py-6">
                        <pre className="whitespace-pre-wrap text-xs leading-relaxed text-foreground/40">
                          {piece.content}
                        </pre>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>

        <motion.p
          className="text-center text-xs text-foreground/15"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
        >
          more in the drafts folder. always more in the drafts folder.
        </motion.p>

        {/* Links */}
        <motion.div
          className="flex flex-col items-center gap-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
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
