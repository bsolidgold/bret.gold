"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CipherReveal } from "@/components/effects/cipher-reveal";
import { GlitchText } from "@/components/effects/glitch-text";
import type { SortingResult } from "@/lib/sorting/engine";
import { FLOORS } from "@/lib/sorting/questions";

export default function ResultPage() {
  const [result, setResult] = useState<SortingResult | null>(null);
  const [phase, setPhase] = useState<
    "elevator" | "archetype" | "floors" | "complete"
  >("elevator");

  useEffect(() => {
    const stored = sessionStorage.getItem("sorting_result");
    if (stored) {
      setResult(JSON.parse(stored));
    }
  }, []);

  // Phase timing
  useEffect(() => {
    if (!result) return;
    const timers = [
      setTimeout(() => setPhase("archetype"), 2500),
      setTimeout(() => setPhase("floors"), 5000),
      setTimeout(() => setPhase("complete"), 8000),
    ];
    return () => timers.forEach(clearTimeout);
  }, [result]);

  if (!result) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-void">
        <div className="text-center">
          <p className="text-sm text-foreground/40">
            No sorting data found.
          </p>
          <a
            href="/enter"
            className="mt-4 inline-block text-sm text-gold/50 transition-colors hover:text-gold"
          >
            Return to the door
          </a>
        </div>
      </div>
    );
  }

  // Get the primary floor number for the elevator display
  const primaryFloor =
    result.primaryFloors[0]?.number ??
    FLOORS.find((f) => f.category === result.ranked[0])?.number ??
    8;

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-void px-4 py-16 sm:px-8">
      <AnimatePresence mode="wait">
        {/* Phase 1: Elevator */}
        {phase === "elevator" && (
          <motion.div
            key="elevator"
            className="flex flex-col items-center gap-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, y: -50 }}
            transition={{ duration: 0.8 }}
          >
            <p className="text-xs tracking-[0.5em] text-foreground/30">
              THE ELEVATOR IS MOVING
            </p>
            {/* Floor counter */}
            <motion.div
              className="flex h-24 w-24 items-center justify-center border border-gold/20"
              animate={{
                borderColor: [
                  "rgba(201, 168, 76, 0.2)",
                  "rgba(201, 168, 76, 0.5)",
                  "rgba(201, 168, 76, 0.2)",
                ],
              }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <motion.span
                className="text-4xl font-bold text-gold"
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{ duration: 0.5, repeat: 4 }}
              >
                {String(primaryFloor)}
              </motion.span>
            </motion.div>
            <motion.div
              className="h-px w-32 bg-gold/20"
              animate={{ scaleX: [0, 1] }}
              transition={{ duration: 2 }}
            />
          </motion.div>
        )}

        {/* Phase 2: Archetype Reveal */}
        {phase === "archetype" && (
          <motion.div
            key="archetype"
            className="flex flex-col items-center gap-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1 }}
          >
            <p className="text-xs tracking-[0.3em] text-foreground/30">
              THE BUILDING HAS DECIDED
            </p>
            <GlitchText
              text={result.archetype.name.toUpperCase()}
              className="text-4xl font-bold tracking-wider text-gold sm:text-5xl"
              as="h1"
              glitchInterval={1500}
              glitchIntensity={0.3}
            />
            <CipherReveal
              text={result.archetype.description}
              className="max-w-md text-center text-sm leading-relaxed text-foreground/40"
              duration={1500}
              delay={800}
              as="p"
            />
          </motion.div>
        )}

        {/* Phase 3: Floor Assignments */}
        {(phase === "floors" || phase === "complete") && (
          <motion.div
            key="floors"
            className="flex w-full max-w-lg flex-col items-center gap-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1 }}
          >
            <div className="flex flex-col items-center gap-2">
              <GlitchText
                text={result.archetype.name.toUpperCase()}
                className="text-3xl font-bold tracking-wider text-gold sm:text-4xl"
                as="h1"
                glitchInterval={4000}
                glitchIntensity={0.2}
              />
              <p className="text-xs text-foreground/30">
                {result.archetype.description}
              </p>
            </div>

            {/* Floor list */}
            <div className="flex w-full flex-col gap-4">
              {/* Auto-granted floors */}
              {result.primaryFloors.length > 0 && (
                <div className="flex flex-col gap-2">
                  <p className="text-xs tracking-[0.2em] text-gold/40">
                    ACCESS GRANTED
                  </p>
                  {result.primaryFloors.map((floor, i) => (
                    <motion.div
                      key={floor.number}
                      className="flex items-center gap-3 border border-gold/20 px-4 py-3 sm:gap-4 sm:px-6"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.3 }}
                      style={{
                        boxShadow:
                          "0 0 15px rgba(201, 168, 76, 0.05)",
                      }}
                    >
                      <span className="text-lg font-bold text-gold/60">
                        {floor.number}
                      </span>
                      <span className="text-sm text-foreground/60">
                        {floor.name}
                      </span>
                    </motion.div>
                  ))}
                  {/* Always include Floor 0 and Floor 8 */}
                  <motion.div
                    className="flex items-center gap-3 border border-foreground/10 px-4 py-3 sm:gap-4 sm:px-6"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{
                      delay: result.primaryFloors.length * 0.3,
                    }}
                  >
                    <span className="text-lg font-bold text-foreground/30">
                      0
                    </span>
                    <span className="text-sm text-foreground/40">
                      THE LOBBY
                    </span>
                    <span className="ml-auto text-xs text-foreground/25">
                      always open
                    </span>
                  </motion.div>
                  <motion.div
                    className="flex items-center gap-3 border border-foreground/10 px-4 py-3 sm:gap-4 sm:px-6"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{
                      delay:
                        (result.primaryFloors.length + 1) * 0.3,
                    }}
                  >
                    <span className="text-lg font-bold text-foreground/30">
                      8
                    </span>
                    <span className="text-sm text-foreground/40">
                      THE NEW WING
                    </span>
                    <span className="ml-auto text-xs text-foreground/25">
                      all arrivals
                    </span>
                  </motion.div>
                </div>
              )}

              {/* Gated floors (pending approval) */}
              {result.gatewayFloors.length > 0 && (
                <div className="mt-4 flex flex-col gap-2">
                  <p className="text-xs tracking-[0.2em] text-foreground/30">
                    AWAITING APPROVAL
                  </p>
                  {result.gatewayFloors.map((floor, i) => (
                    <motion.div
                      key={floor.number}
                      className="flex items-center gap-3 border border-foreground/10 px-4 py-3 opacity-50 sm:gap-4 sm:px-6"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 0.5, x: 0 }}
                      transition={{
                        delay:
                          (result.primaryFloors.length + 2) * 0.3 +
                          i * 0.2,
                      }}
                    >
                      <span className="text-lg font-bold text-foreground/30">
                        {floor.number}
                      </span>
                      <span className="text-sm text-foreground/40">
                        {floor.name}
                      </span>
                      <span className="ml-auto text-xs text-gold/30">
                        pending
                      </span>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* Join button (appears in "complete" phase) */}
            {phase === "complete" && (
              <motion.div
                className="flex flex-col items-center gap-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <button
                  className="group relative"
                  onClick={() => {
                    // Build sorting payload for OAuth state
                    const floorToRole = (num: number | "B") => {
                      const map: Record<string, string> = {
                        "3": "floor-3-dojo",
                        "5": "floor-5-terminal",
                        "8": "floor-8-new-wing",
                        "9": "floor-9-front-desk",
                        "11": "floor-11-gallery",
                        "1": "floor-1-living-room",
                        "4": "floor-4-office",
                        "6": "floor-6-study",
                        "10": "floor-10-gym",
                        "12": "floor-12-chapel",
                      };
                      return map[String(num)];
                    };

                    const sorting = JSON.stringify({
                      archetype: result.archetype.name,
                      primaryFloorRoles: result.primaryFloors
                        .map((f) => floorToRole(f.number))
                        .filter(Boolean),
                      gatewayFloorRoles: result.gatewayFloors
                        .map((f) => floorToRole(f.number))
                        .filter(Boolean),
                    });

                    window.location.href = `/api/auth/discord?sorting=${encodeURIComponent(sorting)}`;
                  }}
                >
                  <div className="border border-gold/40 px-10 py-4 transition-all duration-500 hover:border-gold/80 hover:bg-gold/5">
                    <span className="text-sm tracking-[0.3em] text-gold">
                      JOIN THE BUILDING
                    </span>
                  </div>
                  <div className="absolute -left-1 -top-1 h-3 w-3 border-l border-t border-gold/40" />
                  <div className="absolute -right-1 -top-1 h-3 w-3 border-r border-t border-gold/40" />
                  <div className="absolute -bottom-1 -left-1 h-3 w-3 border-b border-l border-gold/40" />
                  <div className="absolute -bottom-1 -right-1 h-3 w-3 border-b border-r border-gold/40" />
                </button>
                <p className="text-xs text-foreground/25">
                  connects via Discord
                </p>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Back link */}
      <motion.a
        href="/"
        className="fixed bottom-8 left-8 text-xs text-foreground/20 transition-colors hover:text-foreground/40"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2 }}
      >
        {"<"} lobby
      </motion.a>
    </div>
  );
}
