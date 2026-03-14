"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GlitchText } from "@/components/effects/glitch-text";
import { useRequireResident } from "@/hooks/use-require-resident";

type FloorData = {
  number: string;
  name: string;
  desc: string;
  channels: string[];
  tier: "open" | "gated" | "locked" | "hidden";
};

const BUILDING: FloorData[] = [
  { number: "13", name: "THE ROOFTOP", desc: "above it all", channels: ["the-rooftop", "the-edge"], tier: "hidden" },
  { number: "12", name: "THE CHAPEL", desc: "philosophy and spiritual practice", channels: ["the-altar", "the-question", "the-practice"], tier: "gated" },
  { number: "11", name: "THE GALLERY", desc: "music, photography, visual art", channels: ["now-playing", "the-darkroom", "the-mixtape"], tier: "open" },
  { number: "10", name: "THE GYM", desc: "fitness, nutrition, the body", channels: ["weight-room", "the-kitchen", "the-sauna"], tier: "gated" },
  { number: "9", name: "THE FRONT DESK", desc: "business inquiries, portfolio", channels: ["inquiries", "portfolio-window"], tier: "open" },
  { number: "8", name: "THE NEW WING", desc: "where new arrivals land", channels: ["the-foyer", "the-courtyard"], tier: "open" },
  { number: "7", name: "THE OLD WING", desc: "old friends only", channels: ["time-capsule", "remember-when"], tier: "locked" },
  { number: "6", name: "THE STUDY", desc: "writing, poetry, craft", channels: ["the-desk-lamp", "drafts-and-fragments", "published"], tier: "gated" },
  { number: "5", name: "THE TERMINAL", desc: "code, projects, building things", channels: ["stdout", "stderr", "pull-requests", "dev-log"], tier: "open" },
  { number: "4", name: "THE OFFICE", desc: "work, collaboration, meetings", channels: ["the-desk", "water-cooler", "conference-room"], tier: "gated" },
  { number: "3", name: "THE DOJO", desc: "jiu-jitsu, competition, the grind", channels: ["the-mat", "tape-study", "tournament-dispatch", "open-mat-signal"], tier: "open" },
  { number: "2", name: "THE HOLLOW", desc: "recovery, healing, the real stuff", channels: ["the-clearing", "check-in", "wins", "the-well", "cravings"], tier: "gated" },
  { number: "1", name: "THE LIVING ROOM", desc: "the personal space", channels: ["the-couch", "junk-drawer", "the-porch"], tier: "gated" },
  { number: "0", name: "THE LOBBY", desc: "where everyone enters", channels: ["welcome-mat", "bulletin-board", "graffiti-wall", "proof-of-life"], tier: "open" },
  { number: "B", name: "THE BASEMENT", desc: "server infrastructure", channels: ["server-logs", "bot-workshop"], tier: "locked" },
];

function tierLabel(tier: FloorData["tier"]) {
  switch (tier) {
    case "open": return "open";
    case "gated": return "gated";
    case "locked": return "locked";
    case "hidden": return "???";
  }
}

function tierColor(tier: FloorData["tier"]) {
  switch (tier) {
    case "open": return "text-foreground/40";
    case "gated": return "text-gold/50";
    case "locked": return "text-red-ember/70";
    case "hidden": return "text-gold/30";
  }
}

export default function BuildingPage() {
  const { resident, loading: gateLoading } = useRequireResident();
  const [activeFloor, setActiveFloor] = useState<string | null>(null);
  const [elevatorPos, setElevatorPos] = useState(14); // Start at lobby (index 13)
  const [residentFloors, setResidentFloors] = useState<Set<string>>(new Set());
  const [showHidden, setShowHidden] = useState(false);

  useEffect(() => {
    if (resident) {
      const roles = new Set([
        ...resident.primaryFloorRoles,
        ...resident.gatewayFloorRoles,
      ]);
      setResidentFloors(roles);
      if (roles.has("floor-13-rooftop")) {
        setShowHidden(true);
      }
    }
  }, [resident]);

  const visibleFloors = showHidden
    ? BUILDING
    : BUILDING.filter((f) => f.tier !== "hidden");

  const activeData = visibleFloors.find((f) => f.number === activeFloor);

  if (gateLoading) return <div className="min-h-screen bg-void" />;

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-void px-4 py-16">
      {/* Background static */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E")`,
          backgroundSize: "256px 256px",
        }}
      />

      <motion.div
        className="relative z-10 flex w-full max-w-2xl flex-col items-center gap-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.5 }}
      >
        {/* Title */}
        <div className="flex flex-col items-center gap-2">
          <GlitchText
            text="THE BUILDING"
            className="text-2xl font-bold tracking-[0.3em] text-gold sm:text-3xl"
            as="h1"
            glitchInterval={4000}
            glitchIntensity={0.2}
          />
          <p className="text-xs text-foreground/25">
            13 floors. each one a different part of a life.
          </p>
        </div>

        {/* Building visualization */}
        <div className="relative flex w-full flex-col">
          {/* Elevator shaft — left side */}
          <div className="absolute -left-2 top-0 bottom-0 w-px bg-gold/10 sm:left-4" />
          <motion.div
            className="absolute -left-3 h-4 w-3 border border-gold/40 bg-gold/10 sm:left-3"
            animate={{
              top: `${(elevatorPos / visibleFloors.length) * 100}%`,
            }}
            transition={{ type: "spring", stiffness: 100, damping: 20 }}
          />

          {visibleFloors.map((floor, index) => {
            const isActive = activeFloor === floor.number;
            const hasAccess =
              floor.tier === "open" ||
              residentFloors.has(`floor-${floor.number.toLowerCase()}-${floor.name.toLowerCase().replace(/^the /, "").replace(/ /g, "-")}`);

            return (
              <motion.div
                key={floor.number}
                className="group relative"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05, duration: 0.4 }}
              >
                <button
                  className={`relative flex w-full items-center gap-4 border-b border-foreground/5 px-4 py-3 text-left transition-all duration-300 sm:px-8 sm:py-4
                    ${isActive ? "bg-gold/5 border-gold/20" : "hover:bg-foreground/[0.02]"}
                  `}
                  onClick={() => {
                    setActiveFloor(isActive ? null : floor.number);
                    setElevatorPos(index);
                  }}
                  onMouseEnter={() => setElevatorPos(index)}
                >
                  {/* Floor number */}
                  <span
                    className={`w-6 text-right text-sm font-bold transition-colors duration-300
                      ${isActive ? "text-gold" : hasAccess ? "text-foreground/30" : "text-foreground/15"}
                    `}
                  >
                    {floor.number}
                  </span>

                  {/* Divider */}
                  <div className={`h-6 w-px transition-colors duration-300 ${isActive ? "bg-gold/30" : "bg-foreground/10"}`} />

                  {/* Floor name */}
                  <span
                    className={`flex-1 text-xs tracking-[0.15em] transition-colors duration-300 sm:tracking-[0.2em]
                      ${isActive ? "text-gold/80" : "text-foreground/40"}
                    `}
                  >
                    {floor.name}
                  </span>

                  {/* Tier badge */}
                  <span className={`text-[10px] tracking-wider ${tierColor(floor.tier)}`}>
                    {tierLabel(floor.tier)}
                  </span>

                  {/* Access indicator */}
                  {hasAccess && (
                    <div
                      className="h-1.5 w-1.5 rounded-full bg-gold/40"
                      style={{ animation: isActive ? "glow-pulse 2s infinite" : undefined }}
                    />
                  )}
                </button>

                {/* Expanded floor detail */}
                <AnimatePresence>
                  {isActive && (
                    <motion.div
                      className="overflow-hidden border-b border-gold/10 bg-gold/[0.02] px-8 sm:px-16"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="py-4">
                        <p className="mb-3 text-xs text-foreground/30">
                          {floor.desc}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {floor.channels.map((ch) => (
                            <span
                              key={ch}
                              className="border border-foreground/8 px-2 py-0.5 text-[10px] text-foreground/25"
                            >
                              #{ch}
                            </span>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>

        {/* Legend */}
        <motion.div
          className="flex flex-wrap items-center justify-center gap-4 text-[10px] text-foreground/20"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 1 }}
        >
          <span>open = everyone</span>
          <span className="text-foreground/10">|</span>
          <span className="text-gold/40">gated = request access</span>
          <span className="text-foreground/10">|</span>
          <span className="text-red-ember/50">locked = invite only</span>
        </motion.div>

        {/* Back link */}
        <motion.a
          href="/"
          className="text-xs text-foreground/20 transition-colors hover:text-foreground/40"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
        >
          back to lobby
        </motion.a>
      </motion.div>

      {/* Floor info panel — bottom */}
      <AnimatePresence>
        {activeData && (
          <motion.div
            className="fixed bottom-0 left-0 right-0 border-t border-gold/10 bg-void/95 p-4 backdrop-blur-sm sm:hidden"
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            exit={{ y: 100 }}
            transition={{ duration: 0.3 }}
          >
            <p className="text-center text-xs text-foreground/30">
              Floor {activeData.number} — {activeData.desc}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
