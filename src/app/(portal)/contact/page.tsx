"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { GlitchText } from "@/components/effects/glitch-text";
import { CipherReveal } from "@/components/effects/cipher-reveal";

const GUILD_ID = process.env.NEXT_PUBLIC_DISCORD_GUILD_ID;

export default function ContactPage() {
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !message.trim()) return;

    setStatus("sending");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), message: message.trim() }),
      });
      if (res.ok) {
        setStatus("sent");
        setName("");
        setMessage("");
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  }

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
        className="relative z-10 flex w-full max-w-md flex-col items-center gap-12"
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
          {/* Contact links */}
          <div className="flex flex-col gap-1">
            <a
              href="mailto:bret@bretgold.com"
              className="flex items-center gap-4 border-b border-foreground/5 px-4 py-3 transition-all hover:bg-foreground/[0.02]"
            >
              <span className="w-16 text-[10px] tracking-wider text-foreground/20">
                EMAIL
              </span>
              <span className="text-xs text-foreground/50 transition-colors hover:text-gold/60">
                bret@bretgold.com
              </span>
            </a>
            <a
              href="https://github.com/bsolidgold"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-4 border-b border-foreground/5 px-4 py-3 transition-all hover:bg-foreground/[0.02]"
            >
              <span className="w-16 text-[10px] tracking-wider text-foreground/20">
                GITHUB
              </span>
              <span className="text-xs text-foreground/50 transition-colors hover:text-gold/60">
                @bsolidgold
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

          {/* Contact form */}
          <motion.div
            className="mt-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1, duration: 1 }}
          >
            <p className="mb-4 text-center text-xs text-foreground/25">
              or leave a message at the front desk.
            </p>

            {status === "sent" ? (
              <motion.div
                className="border border-gold/20 px-6 py-4 text-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <p className="text-xs text-gold/60">
                  message delivered. the building will pass it along.
                </p>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                <input
                  type="text"
                  placeholder="your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={100}
                  className="border border-foreground/10 bg-transparent px-4 py-2 text-xs text-foreground/60 placeholder:text-foreground/15 focus:border-gold/30 focus:outline-none"
                />
                <textarea
                  placeholder="your message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={4}
                  maxLength={2000}
                  className="resize-none border border-foreground/10 bg-transparent px-4 py-2 text-xs text-foreground/60 placeholder:text-foreground/15 focus:border-gold/30 focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={status === "sending" || !name.trim() || !message.trim()}
                  className="border border-gold/20 px-4 py-2 text-xs tracking-[0.15em] text-gold/50 transition-all hover:border-gold/40 hover:bg-gold/5 hover:text-gold/80 disabled:opacity-30 disabled:hover:border-gold/20 disabled:hover:bg-transparent"
                >
                  {status === "sending" ? "sending..." : "SEND"}
                </button>
                {status === "error" && (
                  <p className="text-center text-[10px] text-red-ember/60">
                    something went wrong. try again.
                  </p>
                )}
              </form>
            )}
          </motion.div>
        </motion.div>

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
