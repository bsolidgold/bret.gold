"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { GlitchText } from "@/components/effects/glitch-text";
import { InterviewTerminal } from "@/components/sorting/interview-terminal";
import { TargetedQuestions } from "@/components/sorting/targeted-questions";
import { calculateRelationshipResult } from "@/lib/sorting/engine";
import { RELATIONSHIP_CONFIGS } from "@/lib/sorting/relationships";
import { getResident } from "@/lib/resident";
import type { ResidentData } from "@/lib/resident";
import type { RelationshipType } from "@/lib/sorting/interview-prompt";
import type { Category } from "@/lib/sorting/questions";

type Phase = "interview" | "transition" | "questions" | "processing";

export default function SortingPage() {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("interview");
  const [relationshipType, setRelationshipType] =
    useState<RelationshipType | null>(null);
  const [residentData, setResidentData] = useState<ResidentData | null>(null);

  useEffect(() => {
    const data = getResident();
    if (data) setResidentData(data);
  }, []);

  // Handle AI classification
  const handleClassified = (type: RelationshipType) => {
    setRelationshipType(type);

    const config = RELATIONSHIP_CONFIGS[type];
    if (config.skipQuestions) {
      // Ex-partner and recruiter skip questions entirely
      setPhase("processing");
      const result = calculateRelationshipResult(type, {});
      sessionStorage.setItem("sorting_result", JSON.stringify(result));
      setTimeout(() => router.push("/result"), 1500);
    } else {
      // Transition to targeted questions
      setPhase("transition");
      setTimeout(() => setPhase("questions"), 2000);
    }
  };

  // Handle targeted question completion
  const handleQuestionsComplete = (
    answers: Record<number, Partial<Record<Category, number>>>
  ) => {
    if (!relationshipType) return;
    setPhase("processing");

    const result = calculateRelationshipResult(relationshipType, answers);
    sessionStorage.setItem("sorting_result", JSON.stringify(result));

    setTimeout(() => router.push("/result"), 1200);
  };

  // Returning resident gate
  if (residentData) {
    return (
      <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-void px-8">
        <motion.div
          className="flex flex-col items-center gap-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.5 }}
        >
          <p className="text-xs tracking-[0.3em] text-foreground/30">
            THE ELEVATOR RECOGNIZES YOU
          </p>

          <GlitchText
            text={residentData.archetype.toUpperCase()}
            className="text-3xl font-bold tracking-wider text-gold sm:text-4xl"
            as="h1"
            glitchInterval={3000}
            glitchIntensity={0.2}
          />

          <p className="max-w-sm text-center text-sm leading-relaxed text-foreground/40">
            You have already been sorted.
            <br />
            The building remembers.
          </p>

          <div className="mt-8">
            <a
              href="/"
              className="border border-gold/30 px-8 py-3 text-sm tracking-[0.2em] text-gold/70 transition-all duration-500 hover:border-gold/60 hover:bg-gold/5"
            >
              RETURN TO LOBBY
            </a>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-void px-4 sm:px-8">
      <AnimatePresence mode="wait">
        {/* Phase 1: AI Interview */}
        {phase === "interview" && (
          <motion.div
            key="interview"
            className="flex w-full flex-col items-center gap-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, y: -30 }}
            transition={{ duration: 0.6 }}
          >
            <motion.p
              className="text-[10px] tracking-[0.4em] text-foreground/20"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              STEP INSIDE
            </motion.p>

            <InterviewTerminal onClassified={handleClassified} />
          </motion.div>
        )}

        {/* Transition: elevator moving */}
        {phase === "transition" && (
          <motion.div
            key="transition"
            className="flex flex-col items-center gap-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            <p className="text-xs tracking-[0.5em] text-foreground/30">
              THE ELEVATOR IS DECIDING
            </p>

            <motion.div
              className="flex h-20 w-20 items-center justify-center border border-gold/20"
              animate={{
                borderColor: [
                  "rgba(201, 168, 76, 0.2)",
                  "rgba(201, 168, 76, 0.5)",
                  "rgba(201, 168, 76, 0.2)",
                ],
              }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              <motion.span
                className="text-xs tracking-[0.2em] text-gold/60"
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{ duration: 0.8, repeat: Infinity }}
              >
                {relationshipType &&
                  RELATIONSHIP_CONFIGS[relationshipType].label}
              </motion.span>
            </motion.div>

            <motion.div
              className="h-px w-32 bg-gold/20"
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 1.5 }}
            />
          </motion.div>
        )}

        {/* Phase 2: Targeted Questions */}
        {phase === "questions" && relationshipType && (
          <motion.div
            key="questions"
            className="flex w-full flex-col items-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
          >
            <TargetedQuestions
              relationshipType={relationshipType}
              onComplete={handleQuestionsComplete}
            />
          </motion.div>
        )}

        {/* Processing */}
        {phase === "processing" && (
          <motion.div
            key="processing"
            className="flex flex-col items-center gap-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <p className="text-xs tracking-[0.5em] text-foreground/30">
              THE BUILDING IS DECIDING
            </p>
            <motion.div
              className="h-px w-48 bg-gold/30"
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 1 }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Back to lobby */}
      <motion.a
        href="/"
        className="fixed bottom-8 left-8 text-xs text-foreground/20 transition-colors hover:text-foreground/40"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
      >
        {"<"} abandon
      </motion.a>
    </div>
  );
}
