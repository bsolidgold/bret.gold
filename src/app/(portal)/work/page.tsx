"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GlitchText } from "@/components/effects/glitch-text";
import { CipherReveal } from "@/components/effects/cipher-reveal";

type Project = {
  name: string;
  desc: string;
  tags: string[];
  link?: string;
  status: "live" | "building" | "archived";
};

const PROJECTS: Project[] = [
  {
    name: "THE BUILDING",
    desc: "this site. a discord server disguised as a 13-floor building. sorting quiz, bot concierge, anonymous posting, AI integration.",
    tags: ["next.js", "discord.js", "typescript", "claude ai"],
    status: "live",
  },
  {
    name: "THE CONCIERGE",
    desc: "discord bot that runs the building. handles sorting, floor access, anonymous posting, scheduled prompts, and AI-powered responses.",
    tags: ["discord.js", "anthropic sdk", "node-cron"],
    status: "live",
  },
];

function statusBadge(status: Project["status"]) {
  switch (status) {
    case "live":
      return <span className="text-green-glow/60">live</span>;
    case "building":
      return <span className="text-gold/50">building</span>;
    case "archived":
      return <span className="text-foreground/20">archived</span>;
  }
}

export default function WorkPage() {
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
            text="WORK"
            className="text-3xl font-bold tracking-[0.3em] text-gold sm:text-4xl"
            as="h1"
            glitchInterval={5000}
            glitchIntensity={0.15}
          />
          <CipherReveal
            text="// THINGS I'VE BUILT"
            className="text-xs tracking-[0.3em] text-foreground/25"
            duration={800}
            delay={500}
          />
        </div>

        {/* Projects */}
        <div className="flex w-full flex-col gap-1">
          {PROJECTS.map((project, i) => {
            const isOpen = expanded === project.name;
            return (
              <motion.div
                key={project.name}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + i * 0.1, duration: 0.4 }}
              >
                <button
                  className={`flex w-full items-center gap-4 border-b border-foreground/5 px-4 py-3 text-left transition-all duration-300
                    ${isOpen ? "bg-gold/5 border-gold/15" : "hover:bg-foreground/[0.02]"}
                  `}
                  onClick={() => setExpanded(isOpen ? null : project.name)}
                >
                  <span
                    className={`flex-1 text-xs tracking-[0.15em] transition-colors ${isOpen ? "text-gold/80" : "text-foreground/40"}`}
                  >
                    {project.name}
                  </span>
                  <span className="text-[10px]">{statusBadge(project.status)}</span>
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
                      <div className="py-4">
                        <p className="mb-3 text-xs leading-relaxed text-foreground/35">
                          {project.desc}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {project.tags.map((tag) => (
                            <span
                              key={tag}
                              className="border border-foreground/8 px-2 py-0.5 text-[10px] text-foreground/25"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                        {project.link && (
                          <a
                            href={project.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-3 inline-block text-[10px] text-gold/40 transition-colors hover:text-gold/70"
                          >
                            view project &rarr;
                          </a>
                        )}
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
          more coming. the building is always under construction.
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
