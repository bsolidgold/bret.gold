"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { GlitchText } from "@/components/effects/glitch-text";
import { CipherReveal } from "@/components/effects/cipher-reveal";
import { TerminalType } from "@/components/effects/terminal-type";
import { getResident } from "@/lib/resident";

export default function EnterPage() {
  const router = useRouter();
  const [phase, setPhase] = useState<"approach" | "door">("approach");
  const [isResident, setIsResident] = useState(false);

  useEffect(() => {
    if (getResident()) setIsResident(true);
  }, []);

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-void">
      {/* Dim hallway light */}
      <div className="pointer-events-none absolute top-0 left-1/2 h-96 w-64 -translate-x-1/2 bg-gold/[0.02] blur-3xl" />

      <main className="relative z-10 flex flex-col items-center gap-12 px-8">
        {phase === "approach" && (
          <motion.div
            className="max-w-md text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.5 }}
          >
            <TerminalType
              lines={isResident ? [
                "you're standing in front of the door again.",
                "it opens before you knock.",
                "it remembers your hand.",
              ] : [
                "you're standing in front of a door.",
                "it's heavier than you expected.",
                "there's no handle. just a surface.",
                "warm to the touch.",
              ]}
              typeSpeed={40}
              lineDelay={600}
              prefix=""
              className="text-sm leading-loose text-foreground/50"
              onComplete={() => setTimeout(() => {
                if (isResident) {
                  router.push("/sorting");
                } else {
                  setPhase("door");
                }
              }, 1000)}
            />
          </motion.div>
        )}

        {phase === "door" && (
          <motion.div
            className="flex flex-col items-center gap-10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1 }}
          >
            {/* The door visual */}
            <div className="relative h-72 w-44 border border-gold/20 bg-smoke/50">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="h-2 w-2 rounded-full bg-gold/40" />
              </div>
              <div className="absolute -bottom-2 left-2 right-2 h-4 bg-gold/10 blur-md" />
            </div>

            {/* KNOCK button fades in after a pause */}
            <motion.a
              href="/sorting"
              className="group relative"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 3.5, duration: 1 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.95 }}
            >
              <div className="border border-gold/30 px-10 py-3 transition-all duration-500 hover:border-gold/60 hover:bg-gold/5">
                <GlitchText
                  text={isResident ? "ENTER" : "KNOCK"}
                  className="text-sm font-bold tracking-[0.3em] text-gold/70"
                  glitchInterval={3000}
                  glitchIntensity={0.5}
                />
              </div>
            </motion.a>

            <motion.p
              className="text-xs text-foreground/30"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 5, duration: 2 }}
            >
              step inside. the elevator will decide.
            </motion.p>
          </motion.div>
        )}
      </main>

      {/* Back link */}
      <motion.a
        href="/"
        className="fixed top-8 left-8 text-xs text-foreground/20 transition-colors hover:text-foreground/40"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
      >
        {"<"} lobby
      </motion.a>
    </div>
  );
}
