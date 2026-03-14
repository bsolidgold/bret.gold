"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { TerminalType } from "@/components/effects/terminal-type";

export default function BasementPage() {
  const [phase, setPhase] = useState<"descent" | "locked" | "glitch">("descent");

  useEffect(() => {
    // Random chance of glitch phase
    if (Math.random() < 0.15) {
      setTimeout(() => setPhase("glitch"), 6000);
    }
  }, []);

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-void px-6">
      {/* Heavier static for the basement */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E")`,
          backgroundSize: "256px 256px",
        }}
      />

      {/* Red ambient light */}
      <div className="pointer-events-none absolute bottom-0 left-1/2 h-64 w-96 -translate-x-1/2 rounded-full bg-red-ember/5 blur-3xl" />

      <motion.div
        className="relative z-10 flex max-w-lg flex-col items-center gap-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
      >
        {phase === "descent" && (
          <div className="text-sm text-foreground/30">
            <TerminalType
              lines={[
                "descending...",
                "floor B",
                "the basement.",
                "",
                "you shouldn't be down here.",
                "this is where the building keeps its infrastructure.",
                "server logs. bot internals. things that run in the dark.",
                "",
                "ACCESS DENIED.",
              ]}
              typeSpeed={35}
              lineDelay={600}
              prefix="// "
              onComplete={() => setTimeout(() => setPhase("locked"), 1000)}
            />
          </div>
        )}

        {phase === "locked" && (
          <motion.div
            className="flex flex-col items-center gap-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1 }}
          >
            <div className="border border-red-ember/30 px-8 py-4">
              <span className="text-sm tracking-[0.3em] text-red-ember/60">
                ACCESS DENIED
              </span>
            </div>

            <p className="text-center text-xs text-foreground/20">
              the basement is locked. it runs itself.
              <br />
              you don't need to be here.
            </p>

            <div className="flex gap-4 text-[10px]">
              <a
                href="/"
                className="text-foreground/15 transition-colors hover:text-foreground/30"
              >
                take the elevator up
              </a>
              <span className="text-foreground/10">|</span>
              <a
                href="/building"
                className="text-foreground/15 transition-colors hover:text-foreground/30"
              >
                building directory
              </a>
            </div>
          </motion.div>
        )}

        {phase === "glitch" && (
          <motion.div
            className="flex flex-col items-center gap-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <p className="font-bold tracking-[0.2em] text-red-ember/40" style={{ animation: "flicker 0.5s infinite" }}>
              someone is already down here.
            </p>
            <motion.a
              href="/"
              className="text-[10px] text-foreground/20 transition-colors hover:text-foreground/40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 2 }}
            >
              leave. now.
            </motion.a>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
