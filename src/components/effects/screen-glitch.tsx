"use client";

import { useState, useEffect, useCallback, useRef } from "react";

/*
 * Pool of full-screen glitch effects triggered at random intervals.
 * Each effect is a short-lived CSS transform/filter/overlay combo
 * applied to the wrapper div. No two bursts look the same.
 */

type GlitchEffect = {
  // CSS applied to the main content wrapper
  transform?: string;
  filter?: string;
  clipPath?: string;
  opacity?: number;
  // Duration in ms for this particular effect
  duration: number;
  // Optional overlay layers (static noise, color bars, etc.)
  overlays?: OverlayConfig[];
};

type OverlayConfig = {
  background: string;
  mixBlendMode?: string;
  opacity: number;
  transform?: string;
  clipPath?: string;
};

// --- EFFECT GENERATORS ---
// Each returns a randomized GlitchEffect so no two are identical.

function horizontalTear(): GlitchEffect {
  const offset = (Math.random() - 0.5) * 30;
  const skew = (Math.random() - 0.5) * 3;
  const bandTop = Math.random() * 80;
  const bandHeight = 5 + Math.random() * 20;

  return {
    clipPath: `inset(${bandTop}% 0 ${100 - bandTop - bandHeight}% 0)`,
    transform: `translateX(${offset}px) skewX(${skew}deg)`,
    filter: `saturate(${1 + Math.random() * 1.5}) brightness(${0.8 + Math.random() * 0.4})`,
    duration: 60 + Math.random() * 80,
  };
}

function rgbSplit(): GlitchEffect {
  const rx = (Math.random() - 0.5) * 10;
  const ry = (Math.random() - 0.5) * 4;
  const bx = (Math.random() - 0.5) * 10;
  const by = (Math.random() - 0.5) * 4;

  return {
    duration: 80 + Math.random() * 100,
    overlays: [
      {
        background: "inherit",
        mixBlendMode: "screen",
        opacity: 0.6,
        transform: `translate(${rx}px, ${ry}px)`,
        clipPath: `inset(${Math.random() * 30}% 0 ${Math.random() * 30}% 0)`,
      },
      {
        background: "inherit",
        mixBlendMode: "screen",
        opacity: 0.4,
        transform: `translate(${bx}px, ${by}px)`,
        clipPath: `inset(${Math.random() * 30}% 0 ${Math.random() * 30}% 0)`,
      },
    ],
  };
}

function verticalShift(): GlitchEffect {
  const shift = (Math.random() - 0.5) * 15;
  return {
    transform: `translateY(${shift}px)`,
    duration: 50 + Math.random() * 60,
  };
}

function brightnessSpike(): GlitchEffect {
  const bright = 1.3 + Math.random() * 0.7;
  return {
    filter: `brightness(${bright}) contrast(${1.1 + Math.random() * 0.3})`,
    duration: 40 + Math.random() * 60,
  };
}

function staticNoise(): GlitchEffect {
  const bandTop = Math.random() * 70;
  const bandHeight = 3 + Math.random() * 15;
  return {
    duration: 100 + Math.random() * 120,
    overlays: [
      {
        background: `repeating-linear-gradient(
          0deg,
          transparent,
          transparent 1px,
          rgba(200, 200, 200, 0.03) 1px,
          rgba(200, 200, 200, 0.03) 2px
        )`,
        opacity: 1,
        clipPath: `inset(${bandTop}% 0 ${100 - bandTop - bandHeight}% 0)`,
      },
    ],
  };
}

function signalLoss(): GlitchEffect {
  return {
    opacity: Math.random() * 0.15,
    duration: 30 + Math.random() * 50,
  };
}

function horizontalRoll(): GlitchEffect {
  // Multiple slices displaced in the same direction - VHS tracking feel
  const direction = Math.random() > 0.5 ? 1 : -1;
  const overlays: OverlayConfig[] = [];
  const sliceCount = 2 + Math.floor(Math.random() * 3);
  for (let i = 0; i < sliceCount; i++) {
    const top = Math.random() * 90;
    const height = 2 + Math.random() * 8;
    overlays.push({
      background: "rgba(201, 168, 76, 0.03)",
      opacity: 0.5 + Math.random() * 0.5,
      transform: `translateX(${direction * (5 + Math.random() * 20)}px)`,
      clipPath: `inset(${top}% 0 ${Math.max(0, 100 - top - height)}% 0)`,
    });
  }
  return {
    duration: 80 + Math.random() * 100,
    overlays,
  };
}

function colorShift(): GlitchEffect {
  const hue = Math.random() * 30 - 15;
  return {
    filter: `hue-rotate(${hue}deg) saturate(${1.5 + Math.random()})`,
    duration: 60 + Math.random() * 80,
  };
}

function doubleTear(): GlitchEffect {
  // Two horizontal bands displaced in opposite directions
  const t1 = Math.random() * 40;
  const t2 = 50 + Math.random() * 30;
  return {
    duration: 70 + Math.random() * 70,
    overlays: [
      {
        background: "transparent",
        opacity: 1,
        transform: `translateX(${8 + Math.random() * 15}px) skewX(${(Math.random() - 0.5) * 2}deg)`,
        clipPath: `inset(${t1}% 0 ${100 - t1 - 8}% 0)`,
      },
      {
        background: "transparent",
        opacity: 1,
        transform: `translateX(${-8 - Math.random() * 15}px) skewX(${(Math.random() - 0.5) * 2}deg)`,
        clipPath: `inset(${t2}% 0 ${100 - t2 - 6}% 0)`,
      },
    ],
  };
}

// All available effect generators
const EFFECTS = [
  horizontalTear,
  horizontalTear, // weighted heavier - it's the classic
  rgbSplit,
  verticalShift,
  brightnessSpike,
  staticNoise,
  signalLoss,
  horizontalRoll,
  colorShift,
  doubleTear,
];

// A "burst" is 1-4 rapid-fire frames, simulating a real signal disruption
function generateBurst(): GlitchEffect[] {
  const frameCount = 1 + Math.floor(Math.random() * 4);
  const frames: GlitchEffect[] = [];
  for (let i = 0; i < frameCount; i++) {
    const gen = EFFECTS[Math.floor(Math.random() * EFFECTS.length)];
    frames.push(gen());
  }
  return frames;
}

export function ScreenGlitch({ children }: { children: React.ReactNode }) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [activeEffect, setActiveEffect] = useState<GlitchEffect | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>(null);
  const burstRef = useRef<GlitchEffect[]>([]);
  const frameIndexRef = useRef(0);

  const playFrame = useCallback(() => {
    const frames = burstRef.current;
    const idx = frameIndexRef.current;

    if (idx >= frames.length) {
      // Burst complete - clear and schedule next
      setActiveEffect(null);
      scheduleNext();
      return;
    }

    const frame = frames[idx];
    setActiveEffect(frame);
    frameIndexRef.current = idx + 1;

    timeoutRef.current = setTimeout(playFrame, frame.duration);
  }, []);

  const scheduleNext = useCallback(() => {
    // Random interval: 3-9 seconds between bursts
    const delay = 3000 + Math.random() * 6000;
    timeoutRef.current = setTimeout(() => {
      burstRef.current = generateBurst();
      frameIndexRef.current = 0;
      playFrame();
    }, delay);
  }, [playFrame]);

  useEffect(() => {
    // Initial delay before first glitch
    const initialDelay = 2000 + Math.random() * 3000;
    timeoutRef.current = setTimeout(() => {
      burstRef.current = generateBurst();
      frameIndexRef.current = 0;
      playFrame();
    }, initialDelay);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [playFrame]);

  return (
    <div className="relative">
      {/* Main content - transforms applied here */}
      <div
        ref={wrapperRef}
        style={{
          transform: activeEffect?.transform,
          filter: activeEffect?.filter,
          clipPath: activeEffect?.clipPath,
          opacity: activeEffect?.opacity ?? 1,
          transition: "none",
        }}
      >
        {children}
      </div>

      {/* Overlay layers for composite effects */}
      {activeEffect?.overlays?.map((overlay, i) => (
        <div
          key={i}
          className="pointer-events-none fixed inset-0"
          style={{
            background: overlay.background,
            mixBlendMode: overlay.mixBlendMode as React.CSSProperties["mixBlendMode"],
            opacity: overlay.opacity,
            transform: overlay.transform,
            clipPath: overlay.clipPath,
            zIndex: 9990,
          }}
        />
      ))}
    </div>
  );
}
