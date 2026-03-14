"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { GlitchText } from "@/components/effects/glitch-text";
import { TerminalType } from "@/components/effects/terminal-type";
import { getResident } from "@/lib/resident";

const REFLECTIONS = [
  "you came looking for something.",
  "the building doesn't show you what you want to see.",
  "it shows you what's already there.",
  "look closer.",
  "look again.",
  "are you sure that's you?",
];

export default function MirrorPage() {
  const [phase, setPhase] = useState<"dark" | "reflecting" | "revealed">("dark");
  const [reflection, setReflection] = useState<string[]>([]);

  useEffect(() => {
    const timer = setTimeout(() => setPhase("reflecting"), 1500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const resident = getResident();
    if (resident) {
      setReflection([
        `you are ${resident.username}.`,
        `the building calls you ${resident.archetype}.`,
        `you have access to ${resident.primaryFloorRoles.length} floor${resident.primaryFloorRoles.length !== 1 ? "s" : ""}.`,
        "",
        "but you already knew that.",
        "the mirror only shows what you bring to it.",
      ]);
    } else {
      setReflection([
        "the mirror is empty.",
        "you haven't entered the building yet.",
        "there's nothing to reflect.",
        "",
        "come back when you're someone.",
      ]);
    }
  }, []);

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-void px-6">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E")`,
          backgroundSize: "256px 256px",
        }}
      />

      <motion.div
        className="relative z-10 flex max-w-md flex-col items-center gap-10"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 2 }}
      >
        {phase === "dark" && (
          <motion.div
            className="h-32 w-32 border border-foreground/5"
            style={{
              background: "radial-gradient(ellipse at center, rgba(201,168,76,0.03) 0%, transparent 70%)",
            }}
          />
        )}

        {phase === "reflecting" && (
          <motion.div
            className="flex flex-col items-center gap-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1 }}
          >
            <GlitchText
              text="THE MIRROR"
              className="text-2xl font-bold tracking-[0.3em] text-foreground/15"
              as="h1"
              glitchInterval={2000}
              glitchIntensity={0.6}
            />

            <div className="flex flex-col items-center gap-1">
              <TerminalType
                lines={REFLECTIONS}
                typeSpeed={40}
                lineDelay={800}
                prefix=""
                onComplete={() => setTimeout(() => setPhase("revealed"), 1500)}
              />
            </div>
          </motion.div>
        )}

        {phase === "revealed" && (
          <motion.div
            className="flex flex-col items-center gap-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 2 }}
          >
            <GlitchText
              text="THE MIRROR"
              className="text-2xl font-bold tracking-[0.3em] text-foreground/15"
              as="h1"
              glitchInterval={1500}
              glitchIntensity={0.8}
            />

            <div className="flex flex-col items-center gap-2 text-sm text-foreground/30">
              {reflection.map((line, i) => (
                <motion.p
                  key={i}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.5, duration: 0.8 }}
                  className={line === "" ? "h-4" : ""}
                >
                  {line}
                </motion.p>
              ))}
            </div>

            <motion.a
              href="/"
              className="text-[10px] text-foreground/10 transition-colors hover:text-foreground/25"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 4, duration: 2 }}
            >
              step away from the mirror
            </motion.a>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
