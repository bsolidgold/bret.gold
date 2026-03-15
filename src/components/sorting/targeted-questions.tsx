"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GlitchText } from "@/components/effects/glitch-text";
import type { RelationshipType } from "@/lib/sorting/interview-prompt";
import type { Answer, Category } from "@/lib/sorting/questions";
import { TARGETED_QUESTIONS, RELATIONSHIP_CONFIGS } from "@/lib/sorting/relationships";

interface TargetedQuestionsProps {
  relationshipType: RelationshipType;
  onComplete: (answers: Record<number, Partial<Record<Category, number>>>) => void;
}

function ProgressDots({
  current,
  total,
}: {
  current: number;
  total: number;
}) {
  return (
    <div className="flex items-center gap-1.5">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={`h-1 w-5 transition-all duration-500 ${
            i < current
              ? "bg-gold/50"
              : i === current
                ? "bg-gold/30"
                : "bg-foreground/10"
          }`}
        />
      ))}
    </div>
  );
}

export function TargetedQuestions({
  relationshipType,
  onComplete,
}: TargetedQuestionsProps) {
  const questions = TARGETED_QUESTIONS[relationshipType];
  const config = RELATIONSHIP_CONFIGS[relationshipType];
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<
    Record<number, Partial<Record<Category, number>>>
  >({});
  const [transitioning, setTransitioning] = useState(false);

  const handleAnswer = useCallback(
    (answer: Answer) => {
      if (transitioning) return;
      setTransitioning(true);

      const question = questions[currentIndex];
      const updatedAnswers = {
        ...answers,
        [question.id]: answer.scores,
      };
      setAnswers(updatedAnswers);

      setTimeout(() => {
        if (currentIndex < questions.length - 1) {
          setCurrentIndex((i) => i + 1);
          setTransitioning(false);
        } else {
          onComplete(updatedAnswers);
        }
      }, 500);
    },
    [currentIndex, answers, transitioning, questions, onComplete]
  );

  if (!questions || questions.length === 0) {
    // Skip questions (ex-partner, recruiter) — should not reach here
    onComplete({});
    return null;
  }

  const question = questions[currentIndex];

  return (
    <div className="flex w-full max-w-2xl flex-col items-center gap-8">
      {/* Relationship context header */}
      <motion.div
        className="flex flex-col items-center gap-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
      >
        <p className="text-[10px] tracking-[0.4em] text-foreground/20">
          {config.label}
        </p>
        <ProgressDots current={currentIndex} total={questions.length} />
      </motion.div>

      {/* Question */}
      <AnimatePresence mode="wait">
        <motion.div
          key={question.id}
          className="flex w-full flex-col items-center gap-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="max-w-lg text-center">
            <GlitchText
              text={question.prompt.toUpperCase()}
              className="whitespace-pre-line text-lg font-bold leading-relaxed text-foreground/70"
              as="p"
              glitchInterval={3000}
              glitchIntensity={0.35}
              glitchDuration={200}
            />
          </div>

          <div className="flex max-w-md flex-col gap-3">
            {question.answers.map((answer, i) => (
              <motion.button
                key={answer.id}
                onClick={() => handleAnswer(answer)}
                className="group w-full border border-foreground/10 px-6 py-3 text-left text-sm text-foreground/50 transition-all duration-300 hover:border-gold/30 hover:bg-gold/5 hover:text-foreground/80"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + i * 0.1 }}
                whileTap={{ scale: 0.98 }}
              >
                {answer.text}
              </motion.button>
            ))}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
