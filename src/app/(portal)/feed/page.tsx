"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { GlitchText } from "@/components/effects/glitch-text";

type FloorActivity = {
  floor: string;
  channel: string;
  timestamp: number;
  ago: string;
};

export default function FeedPage() {
  const [floors, setFloors] = useState<FloorActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/feed")
      .then((r) => r.json())
      .then((data) => {
        setFloors(data.floors ?? []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // Refresh every 2 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      fetch("/api/feed")
        .then((r) => r.json())
        .then((data) => setFloors(data.floors ?? []))
        .catch(() => {});
    }, 120000);
    return () => clearInterval(interval);
  }, []);

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
            text="LIVE FEED"
            className="text-2xl font-bold tracking-[0.3em] text-gold sm:text-3xl"
            as="h1"
            glitchInterval={4000}
            glitchIntensity={0.2}
          />
          <p className="text-xs text-foreground/25">
            recent activity in the building
          </p>
        </div>

        {loading ? (
          <motion.p
            className="text-xs text-foreground/20"
            animate={{ opacity: [0.2, 0.5, 0.2] }}
            transition={{ repeat: Infinity, duration: 2 }}
          >
            scanning floors...
          </motion.p>
        ) : floors.length === 0 ? (
          <p className="text-xs text-foreground/20">
            the building is quiet.
          </p>
        ) : (
          <div className="flex w-full flex-col">
            {floors.map((item, i) => {
              const isRecent = Date.now() - item.timestamp < 3600000; // last hour
              return (
                <motion.div
                  key={`${item.floor}-${item.channel}`}
                  className="flex items-center gap-4 border-b border-foreground/5 px-4 py-3"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.08, duration: 0.4 }}
                >
                  {/* Activity indicator */}
                  <div
                    className={`h-1.5 w-1.5 rounded-full ${isRecent ? "bg-gold/50" : "bg-foreground/10"}`}
                    style={isRecent ? { animation: "glow-pulse 3s infinite" } : undefined}
                  />

                  {/* Floor name */}
                  <span className={`flex-1 text-xs tracking-[0.1em] ${isRecent ? "text-foreground/50" : "text-foreground/25"}`}>
                    {item.floor}
                  </span>

                  {/* Channel */}
                  <span className="text-[10px] text-foreground/15">
                    #{item.channel}
                  </span>

                  {/* Time ago */}
                  <span className={`w-14 text-right text-[10px] ${isRecent ? "text-gold/40" : "text-foreground/15"}`}>
                    {item.ago}
                  </span>
                </motion.div>
              );
            })}
          </div>
        )}

        <motion.p
          className="text-center text-[10px] text-foreground/10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
        >
          updates every 2 minutes
        </motion.p>

        {/* Links */}
        <motion.div
          className="flex flex-col items-center gap-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
        >
          <div className="flex gap-6 text-xs">
            <a href="/building" className="text-foreground/30 transition-colors hover:text-gold/60">
              /building
            </a>
            <a href="/about" className="text-foreground/30 transition-colors hover:text-gold/60">
              /about
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
