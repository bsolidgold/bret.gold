"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { randomMatrixChar } from "@/lib/matrix-chars";

interface GlitchTextProps {
  text: string;
  className?: string;
  glitchInterval?: number;
  glitchDuration?: number;
  glitchIntensity?: number;
  as?: "h1" | "h2" | "h3" | "p" | "span" | "div";
}

// A single "glitch frame" - characters swapped + CRT distortion applied via CSS
type GlitchFrame = {
  text: string;
  // CRT effect: horizontal slices displaced
  slices: { top: string; height: string; translateX: number; skewX: number }[];
  rgbShift: { r: [number, number]; g: [number, number]; b: [number, number] };
  opacity: number;
};

function generateGlitchFrame(
  original: string,
  intensity: number
): GlitchFrame {
  // Swap characters with Matrix chars
  const glitched = original
    .split("")
    .map((char) => {
      if (char === " ") return " ";
      return Math.random() < intensity ? randomMatrixChar() : char;
    })
    .join("");

  // Generate 1-3 horizontal displacement slices (CRT tear effect)
  const sliceCount = Math.floor(Math.random() * 3) + 1;
  const slices = Array.from({ length: sliceCount }, () => {
    const top = `${Math.random() * 100}%`;
    const height = `${Math.random() * 15 + 3}%`;
    const translateX = (Math.random() - 0.5) * 20;
    const skewX = (Math.random() - 0.5) * 5;
    return { top, height, translateX, skewX };
  });

  // RGB channel split
  const shiftAmount = () => (Math.random() - 0.5) * 6;
  const rgbShift = {
    r: [shiftAmount(), shiftAmount()] as [number, number],
    g: [shiftAmount(), shiftAmount()] as [number, number],
    b: [shiftAmount(), shiftAmount()] as [number, number],
  };

  return {
    text: glitched,
    slices,
    rgbShift,
    opacity: Math.random() > 0.3 ? 1 : 0.7 + Math.random() * 0.3,
  };
}

export function GlitchText({
  text,
  className = "",
  glitchInterval = 4000,
  glitchDuration = 200,
  glitchIntensity = 0.3,
  as: Tag = "div",
}: GlitchTextProps) {
  const [displayText, setDisplayText] = useState(text);
  const [glitchFrame, setGlitchFrame] = useState<GlitchFrame | null>(null);
  const [isGlitching, setIsGlitching] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const frameCountRef = useRef(0);

  const glitch = useCallback(() => {
    setIsGlitching(true);
    frameCountRef.current = 0;

    // Rapid-fire glitch frames for the CRT effect
    const totalFrames = Math.floor(glitchDuration / 50);
    const frameInterval = setInterval(() => {
      frameCountRef.current++;
      const frame = generateGlitchFrame(text, glitchIntensity);
      setDisplayText(frame.text);
      setGlitchFrame(frame);

      if (frameCountRef.current >= totalFrames) {
        clearInterval(frameInterval);
        setDisplayText(text);
        setGlitchFrame(null);
        setIsGlitching(false);
      }
    }, 50);

    return () => clearInterval(frameInterval);
  }, [text, glitchIntensity, glitchDuration]);

  useEffect(() => {
    const interval = setInterval(glitch, glitchInterval);
    return () => clearInterval(interval);
  }, [glitch, glitchInterval]);

  return (
    <div ref={containerRef} className="relative inline-block">
      {/* Main text layer */}
      <Tag
        className={className}
        style={{
          position: "relative",
          opacity: glitchFrame?.opacity ?? 1,
        }}
      >
        {isGlitching
          ? displayText.split("").map((char, i) => (
              <span
                key={i}
                className={char !== text[i] && char !== " " ? "font-black" : ""}
              >
                {char}
              </span>
            ))
          : displayText}
      </Tag>

      {/* CRT horizontal glitch slices - displaced copies */}
      {isGlitching && glitchFrame && (
        <>
          {glitchFrame.slices.map((slice, i) => (
            <div
              key={i}
              className="pointer-events-none absolute left-0 right-0 overflow-hidden"
              style={{
                top: slice.top,
                height: slice.height,
                transform: `translateX(${slice.translateX}px) skewX(${slice.skewX}deg)`,
                zIndex: 10,
              }}
            >
              <Tag
                className={className}
                style={{
                  position: "relative",
                  top: `-${slice.top}`,
                  mixBlendMode: "screen",
                }}
              >
                {displayText}
              </Tag>
            </div>
          ))}

          {/* RGB split layers */}
          <Tag
            className={`${className} pointer-events-none`}
            style={{
              position: "absolute",
              inset: 0,
              color: "rgba(201, 168, 76, 0.6)",
              transform: `translate(${glitchFrame.rgbShift.r[0]}px, ${glitchFrame.rgbShift.r[1]}px)`,
              mixBlendMode: "screen",
              opacity: 0.5,
            }}
            aria-hidden
          >
            {displayText}
          </Tag>
          <Tag
            className={`${className} pointer-events-none`}
            style={{
              position: "absolute",
              inset: 0,
              color: "rgba(45, 212, 160, 0.4)",
              transform: `translate(${glitchFrame.rgbShift.g[0]}px, ${glitchFrame.rgbShift.g[1]}px)`,
              mixBlendMode: "screen",
              opacity: 0.4,
            }}
            aria-hidden
          >
            {displayText}
          </Tag>
          <Tag
            className={`${className} pointer-events-none`}
            style={{
              position: "absolute",
              inset: 0,
              color: "rgba(139, 32, 32, 0.4)",
              transform: `translate(${glitchFrame.rgbShift.b[0]}px, ${glitchFrame.rgbShift.b[1]}px)`,
              mixBlendMode: "screen",
              opacity: 0.3,
            }}
            aria-hidden
          >
            {displayText}
          </Tag>
        </>
      )}
    </div>
  );
}
