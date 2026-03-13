"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";

interface TerminalTypeProps {
  lines: string[];
  className?: string;
  typeSpeed?: number; // ms per character
  lineDelay?: number; // ms between lines
  cursorChar?: string;
  prefix?: string;
  onComplete?: () => void;
}

export function TerminalType({
  lines,
  className = "",
  typeSpeed = 35,
  lineDelay = 500,
  cursorChar = "_",
  prefix = "> ",
  onComplete,
}: TerminalTypeProps) {
  const [currentLine, setCurrentLine] = useState(0);
  const [currentChar, setCurrentChar] = useState(0);
  const [completedLines, setCompletedLines] = useState<string[]>([]);
  const [isTyping, setIsTyping] = useState(true);

  useEffect(() => {
    if (currentLine >= lines.length) {
      setIsTyping(false);
      onComplete?.();
      return;
    }

    const line = lines[currentLine];

    if (currentChar < line.length) {
      const timer = setTimeout(() => {
        setCurrentChar((c) => c + 1);
      }, typeSpeed + (Math.random() * typeSpeed * 0.5 - typeSpeed * 0.25));
      return () => clearTimeout(timer);
    } else {
      const timer = setTimeout(() => {
        setCompletedLines((prev) => [...prev, line]);
        setCurrentLine((l) => l + 1);
        setCurrentChar(0);
      }, lineDelay);
      return () => clearTimeout(timer);
    }
  }, [currentLine, currentChar, lines, typeSpeed, lineDelay, onComplete]);

  return (
    <div className={`font-mono ${className}`}>
      {completedLines.map((line, i) => (
        <div key={i} className="text-foreground/70">
          <span className="text-gold-dim">{prefix}</span>
          {line}
        </div>
      ))}
      {isTyping && currentLine < lines.length && (
        <div>
          <span className="text-gold-dim">{prefix}</span>
          <span>{lines[currentLine].slice(0, currentChar)}</span>
          <motion.span
            className="text-gold"
            animate={{ opacity: [1, 1, 0, 0] }}
            transition={{ duration: 1, repeat: Infinity, times: [0, 0.49, 0.5, 1] }}
          >
            {cursorChar}
          </motion.span>
        </div>
      )}
    </div>
  );
}
