"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GlitchText } from "@/components/effects/glitch-text";
import { CipherReveal } from "@/components/effects/cipher-reveal";
import { TerminalType } from "@/components/effects/terminal-type";
import { getResident, clearResident, getFloorDisplay, type ResidentData } from "@/lib/resident";

const GUILD_ID = process.env.NEXT_PUBLIC_DISCORD_GUILD_ID;

export default function Home() {
  const [phase, setPhase] = useState<"loading" | "boot" | "title" | "ready" | "resident">("loading");
  const [hovered, setHovered] = useState(false);
  const [resident, setResidentState] = useState<ResidentData | null>(null);
  const [pulse, setPulse] = useState<{ alive: boolean; members: number; online: number } | null>(null);

  // Check for returning resident on mount
  useEffect(() => {
    const data = getResident();
    if (data) {
      setResidentState(data);
      setPhase("resident");
    } else {
      setPhase("boot");
    }
  }, []);

  // Fetch building pulse
  useEffect(() => {
    fetch("/api/pulse")
      .then((r) => r.json())
      .then(setPulse)
      .catch(() => {});
  }, []);

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-void">
      {/* Background static noise */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E")`,
          backgroundSize: "256px 256px",
        }}
      />

      {/* Ambient gold light leak from bottom */}
      <div className="pointer-events-none absolute bottom-0 left-1/2 h-64 w-96 -translate-x-1/2 rounded-full bg-gold/5 blur-3xl" />

      <main className="relative z-10 flex flex-col items-center gap-12 px-8">
        <AnimatePresence mode="wait">
          {/* Loading state — prevents flash of wrong content */}
          {phase === "loading" && (
            <motion.div key="loading" className="h-16" />
          )}

          {/* Boot sequence — new visitors */}
          {phase === "boot" && (
            <motion.div
              key="boot"
              className="max-w-lg text-sm text-foreground/50"
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
            >
              <TerminalType
                lines={[
                  "establishing connection...",
                  "signal detected",
                  "coordinates locked",
                  "you found it.",
                ]}
                typeSpeed={30}
                lineDelay={400}
                prefix="// "
                onComplete={() =>
                  setTimeout(() => setPhase("title"), 800)
                }
              />
            </motion.div>
          )}

          {phase === "title" && (
            <motion.div
              key="title"
              className="flex flex-col items-center gap-8"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1.5 }}
              onAnimationComplete={() =>
                setTimeout(() => setPhase("ready"), 600)
              }
            >
              <div className="flex flex-col items-center gap-4">
                <GlitchText
                  text="GOLD"
                  className="text-7xl font-bold tracking-[0.3em] text-gold sm:text-9xl"
                  as="h1"
                  glitchInterval={2500}
                  glitchIntensity={0.4}
                />
                <CipherReveal
                  text="THE BUILDING"
                  className="text-sm tracking-[0.5em] text-foreground/30"
                  duration={1200}
                  delay={300}
                />
              </div>
            </motion.div>
          )}

          {phase === "ready" && (
            <motion.div
              key="ready"
              className="flex flex-col items-center gap-16"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1 }}
            >
              {/* Title persists */}
              <div className="flex flex-col items-center gap-4">
                <GlitchText
                  text="GOLD"
                  className="text-7xl font-bold tracking-[0.3em] text-gold sm:text-9xl"
                  as="h1"
                  glitchInterval={3000}
                  glitchIntensity={0.3}
                />
                <p className="text-sm tracking-[0.5em] text-foreground/30">
                  THE BUILDING
                </p>
              </div>

              {/* The Door */}
              <motion.div
                className="flex flex-col items-center gap-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.8 }}
              >
                {/* Floor indicator */}
                <div className="flex items-center gap-3 text-xs text-foreground/30">
                  <div className="h-px w-8 bg-foreground/20" />
                  <span>FLOOR 0 // LOBBY</span>
                  <div className="h-px w-8 bg-foreground/20" />
                </div>

                {/* Enter button */}
                <motion.a
                  href="/enter"
                  className="group relative"
                  onMouseEnter={() => setHovered(true)}
                  onMouseLeave={() => setHovered(false)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div
                    className="relative border border-gold/30 px-6 py-4 transition-all duration-500 sm:px-12"
                    style={{
                      boxShadow: hovered
                        ? "0 0 30px rgba(201, 168, 76, 0.15), inset 0 0 30px rgba(201, 168, 76, 0.05)"
                        : "none",
                    }}
                  >
                    <CipherReveal
                      text="ENTER THE BUILDING"
                      className="text-sm tracking-[0.15em] text-gold/80 sm:tracking-[0.3em]"
                      duration={800}
                      delay={1000}
                    />
                  </div>

                  {/* Corner accents */}
                  <div className="absolute -left-1 -top-1 h-3 w-3 border-l border-t border-gold/40" />
                  <div className="absolute -right-1 -top-1 h-3 w-3 border-r border-t border-gold/40" />
                  <div className="absolute -bottom-1 -left-1 h-3 w-3 border-b border-l border-gold/40" />
                  <div className="absolute -bottom-1 -right-1 h-3 w-3 border-b border-r border-gold/40" />
                </motion.a>

                {/* Subtext */}
                <motion.p
                  className="max-w-xs text-center text-xs leading-relaxed text-foreground/25"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 2, duration: 2 }}
                >
                  13 floors. Each one a different part of a life.
                  <br />
                  The elevator decides where you belong.
                </motion.p>
              </motion.div>
            </motion.div>
          )}

          {/* Returning resident view */}
          {phase === "resident" && resident && (
            <motion.div
              key="resident"
              className="flex flex-col items-center gap-12"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1.5 }}
            >
              {/* Floor indicator */}
              <div className="flex items-center gap-3 text-xs text-foreground/30">
                <div className="h-px w-8 bg-foreground/20" />
                <span>FLOOR 0 // LOBBY</span>
                <div className="h-px w-8 bg-foreground/20" />
              </div>

              <div className="flex flex-col items-center gap-4">
                <GlitchText
                  text="GOLD"
                  className="text-5xl font-bold tracking-[0.3em] text-gold sm:text-7xl"
                  as="h1"
                  glitchInterval={4000}
                  glitchIntensity={0.2}
                />
                <CipherReveal
                  text={`WELCOME BACK, ${resident.archetype.toUpperCase()}`}
                  className="text-sm tracking-[0.2em] text-foreground/40"
                  duration={1000}
                  delay={300}
                />
              </div>

              {/* Floor access list */}
              <motion.div
                className="flex w-full max-w-sm flex-col gap-2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1, duration: 1 }}
              >
                <p className="mb-1 text-xs tracking-[0.2em] text-gold/30">
                  YOUR FLOORS
                </p>
                {resident.primaryFloorRoles.map((role) => {
                  const floor = getFloorDisplay(role);
                  if (!floor) return null;
                  return (
                    <div
                      key={role}
                      className="flex items-center gap-3 border border-gold/15 px-4 py-2"
                    >
                      <span className="text-sm font-bold text-gold/50">
                        {floor.number}
                      </span>
                      <span className="text-xs text-foreground/50">
                        {floor.name}
                      </span>
                    </div>
                  );
                })}
                {/* Always-open floors */}
                <div className="flex items-center gap-3 border border-foreground/8 px-4 py-2">
                  <span className="text-sm font-bold text-foreground/25">0</span>
                  <span className="text-xs text-foreground/35">THE LOBBY</span>
                  <span className="ml-auto text-[10px] text-foreground/20">always open</span>
                </div>
                <div className="flex items-center gap-3 border border-foreground/8 px-4 py-2">
                  <span className="text-sm font-bold text-foreground/25">8</span>
                  <span className="text-xs text-foreground/35">THE NEW WING</span>
                  <span className="ml-auto text-[10px] text-foreground/20">all arrivals</span>
                </div>
                {/* Gated floors */}
                {resident.gatewayFloorRoles.length > 0 &&
                  resident.gatewayFloorRoles.map((role) => {
                    const floor = getFloorDisplay(role);
                    if (!floor) return null;
                    return (
                      <div
                        key={role}
                        className="flex items-center gap-3 border border-foreground/8 px-4 py-2 opacity-50"
                      >
                        <span className="text-sm font-bold text-foreground/25">
                          {floor.number}
                        </span>
                        <span className="text-xs text-foreground/35">
                          {floor.name}
                        </span>
                        <span className="ml-auto text-[10px] text-gold/25">
                          pending
                        </span>
                      </div>
                    );
                  })}
              </motion.div>

              {/* Return to Discord */}
              <motion.div
                className="flex flex-col items-center gap-4"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.5, duration: 0.8 }}
              >
                <a
                  href={GUILD_ID ? `https://discord.com/channels/${GUILD_ID}` : "https://discord.com/channels/@me"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group relative"
                >
                  <div className="border border-gold/30 px-8 py-3 transition-all duration-500 hover:border-gold/60 hover:bg-gold/5">
                    <span className="text-sm tracking-[0.2em] text-gold/70">
                      RETURN TO THE BUILDING
                    </span>
                  </div>
                  <div className="absolute -left-1 -top-1 h-3 w-3 border-l border-t border-gold/40" />
                  <div className="absolute -right-1 -top-1 h-3 w-3 border-r border-t border-gold/40" />
                  <div className="absolute -bottom-1 -left-1 h-3 w-3 border-b border-l border-gold/40" />
                  <div className="absolute -bottom-1 -right-1 h-3 w-3 border-b border-r border-gold/40" />
                </a>
              </motion.div>

              {/* Footer */}
              <motion.div
                className="flex flex-col items-center gap-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 2.5, duration: 2 }}
              >
                <p className="text-xs text-foreground/20">
                  the building remembers you, {resident.username}.
                </p>
                <button
                  onClick={() => {
                    clearResident();
                    window.location.reload();
                  }}
                  className="text-[10px] text-foreground/15 transition-colors hover:text-foreground/30"
                >
                  not you? start over.
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Bottom activity pulse */}
      {phase !== "resident" && (
        <motion.div
          className="fixed bottom-8 flex items-center gap-3 text-xs text-foreground/20"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 3, duration: 2 }}
        >
          <div className="h-1.5 w-1.5 rounded-full bg-gold/40" style={{ animation: "glow-pulse 3s infinite" }} />
          <span>signal active</span>
          {pulse?.alive && pulse.members > 0 && (
            <>
              <span className="text-foreground/10">|</span>
              <span className="text-foreground/15">
                {pulse.members} resident{pulse.members !== 1 ? "s" : ""}
                {pulse.online > 0 && ` \u00B7 ${pulse.online} online`}
              </span>
            </>
          )}
        </motion.div>
      )}
    </div>
  );
}
