"use client";

import { useState, useEffect, useRef } from "react";
import { randomMatrixChar } from "@/lib/matrix-chars";

interface CipherRevealProps {
  text: string;
  className?: string;
  duration?: number;
  delay?: number;
  scrambleSpeed?: number;
  as?: "h1" | "h2" | "h3" | "p" | "span" | "div";
  onComplete?: () => void;
}

export function CipherReveal({
  text,
  className = "",
  duration = 1500,
  delay = 0,
  scrambleSpeed = 40,
  as: Tag = "span",
  onComplete,
}: CipherRevealProps) {
  const [displayText, setDisplayText] = useState("");
  const [mounted, setMounted] = useState(false);
  const [started, setStarted] = useState(false);
  const [revealedCount, setRevealed] = useState(0);
  const revealedRef = useRef(0);
  const intervalRef = useRef<ReturnType<typeof setInterval>>(null);

  // Avoid hydration mismatch: render nothing until mounted
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const delayTimer = setTimeout(() => setStarted(true), delay);
    return () => clearTimeout(delayTimer);
  }, [delay, mounted]);

  useEffect(() => {
    if (!started) return;

    const revealPerTick = text.length / (duration / scrambleSpeed);

    intervalRef.current = setInterval(() => {
      revealedRef.current = Math.min(
        revealedRef.current + revealPerTick,
        text.length
      );
      const revealed = Math.floor(revealedRef.current);
      setRevealed(revealed);

      const result = text.split("").map((char, i) => {
        if (char === " ") return " ";
        if (i < revealed) return char;
        return randomMatrixChar();
      });

      setDisplayText(result.join(""));

      if (revealed >= text.length) {
        if (intervalRef.current) clearInterval(intervalRef.current);
        setDisplayText(text);
        setRevealed(text.length);
        onComplete?.();
      }
    }, scrambleSpeed);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [started, text, duration, scrambleSpeed, onComplete]);

  // Before mount or before started: show scrambled placeholder
  if (!mounted) {
    const placeholder = text.replace(/[^ ]/g, "\u00A0");
    return <Tag className={`${className} opacity-40`}>{placeholder}</Tag>;
  }

  if (!started) {
    const scrambled = text
      .split("")
      .map((c) =>
        c === " "
          ? " "
          : randomMatrixChar()
      )
      .join("");
    return <Tag className={`${className} opacity-40 font-bold`}>{scrambled}</Tag>;
  }

  // Render with bold Matrix chars for unrevealed portion
  if (revealedCount < text.length) {
    return (
      <Tag className={className}>
        {displayText.split("").map((char, i) => (
          <span
            key={i}
            className={i >= revealedCount && char !== " " ? "font-bold" : ""}
          >
            {char}
          </span>
        ))}
      </Tag>
    );
  }

  return <Tag className={className}>{displayText || "\u00A0"}</Tag>;
}
