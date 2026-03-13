"use client";

import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { QUESTIONS, type Question, type Answer, type Category } from "@/lib/sorting/questions";
import { calculateResult } from "@/lib/sorting/engine";
import { GlitchText } from "@/components/effects/glitch-text";
import { CipherReveal } from "@/components/effects/cipher-reveal";

function StandardQuestion({
  question,
  onAnswer,
}: {
  question: Question;
  onAnswer: (answer: Answer) => void;
}) {
  return (
    <div className="flex flex-col items-center gap-10">
      <div className="max-w-lg text-center">
        <GlitchText
          text={question.prompt.toUpperCase()}
          className="whitespace-pre-line text-lg font-bold leading-relaxed text-foreground/70"
          as="p"
          glitchInterval={3000}
          glitchIntensity={0.35}
          glitchDuration={200}
        />
        {question.subtext && (
          <motion.p
            className="mt-3 text-xs text-foreground/35"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5 }}
          >
            {question.subtext}
          </motion.p>
        )}
      </div>
      <div className="flex max-w-md flex-col gap-3">
        {question.answers.map((answer, i) => (
          <motion.button
            key={answer.id}
            onClick={() => onAnswer(answer)}
            className="group w-full border border-foreground/10 px-6 py-3 text-left text-sm text-foreground/50 transition-all duration-300 hover:border-gold/30 hover:bg-gold/5 hover:text-foreground/80"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 + i * 0.12 }}
            whileTap={{ scale: 0.98 }}
          >
            {answer.id === "fight" ? (
              <span style={{ animation: "flicker 2s infinite" }}>
                {answer.text}
              </span>
            ) : (
              answer.text
            )}
          </motion.button>
        ))}
      </div>
    </div>
  );
}

function BinaryQuestion({
  question,
  onAnswer,
}: {
  question: Question;
  onAnswer: (answer: Answer) => void;
}) {
  const [hoveredSide, setHoveredSide] = useState<string | null>(null);

  return (
    <div className="flex flex-col items-center gap-10">
      <GlitchText
        text={question.prompt.toUpperCase()}
        className="text-2xl font-bold text-foreground/60"
        as="p"
        glitchInterval={2500}
        glitchIntensity={0.4}
        glitchDuration={200}
      />
      <div className="flex w-full max-w-2xl flex-col gap-4 sm:flex-row">
        {question.answers.map((answer) => (
          <motion.button
            key={answer.id}
            onClick={() => onAnswer(answer)}
            onMouseEnter={() => setHoveredSide(answer.id)}
            onMouseLeave={() => setHoveredSide(null)}
            className="flex-1 border border-foreground/10 p-8 text-center text-sm leading-relaxed text-foreground/50 transition-all duration-500 hover:border-gold/30 hover:text-foreground/80"
            initial={{ opacity: 0, y: 20 }}
            animate={{
              opacity:
                hoveredSide && hoveredSide !== answer.id ? 0.3 : 1,
              y: 0,
            }}
            transition={{ duration: 0.5, delay: 0.8 }}
            whileTap={{ scale: 0.97 }}
            style={{
              boxShadow:
                hoveredSide === answer.id
                  ? "inset 0 0 40px rgba(201, 168, 76, 0.05)"
                  : "none",
            }}
          >
            {answer.text}
          </motion.button>
        ))}
      </div>
    </div>
  );
}

function TerminalQuestion({
  question,
  onAnswer,
}: {
  question: Question;
  onAnswer: (answer: Answer) => void;
}) {
  return (
    <div className="w-full max-w-lg rounded border border-green-glow/20 bg-void p-6 font-mono">
      <div className="mb-4 flex items-center gap-2 text-xs text-green-glow/40">
        <div className="h-2 w-2 rounded-full bg-green-glow/60" />
        <span>terminal</span>
      </div>
      <GlitchText
        text={question.prompt.toUpperCase()}
        className="whitespace-pre-line text-sm font-bold leading-loose text-green-glow/70"
        as="p"
        glitchInterval={2500}
        glitchIntensity={0.4}
        glitchDuration={200}
      />
      <div className="mt-6 flex flex-col gap-2">
        {question.answers.map((answer, i) => (
          <motion.button
            key={answer.id}
            onClick={() => onAnswer(answer)}
            className="w-full px-4 py-2 text-left text-sm text-green-glow/50 transition-colors hover:bg-green-glow/5 hover:text-green-glow/90"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 + i * 0.15 }}
          >
            <span className="text-green-glow/30">[{i + 1}]</span>{" "}
            {answer.text}
          </motion.button>
        ))}
      </div>
    </div>
  );
}

function DarknessQuestion({
  question,
  onAnswer,
}: {
  question: Question;
  onAnswer: (answer: Answer) => void;
}) {
  const [blink, setBlink] = useState(false);

  useEffect(() => {
    // Simulate blinks - brief blackouts as eyes adjust
    const blinkTimes = [1200, 2400, 4000];
    const timers = blinkTimes.map((t) =>
      setTimeout(() => {
        setBlink(true);
        setTimeout(() => setBlink(false), 150);
      }, t)
    );
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <div className="relative flex flex-col items-center gap-10">
      {/* Blink overlay */}
      <motion.div
        className="pointer-events-none fixed inset-0 z-50 bg-void"
        animate={{ opacity: blink ? 1 : 0 }}
        transition={{ duration: 0.08 }}
      />

      <motion.div
        className="max-w-lg text-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 3, ease: "easeIn" }}
      >
        <GlitchText
          text={question.prompt.toUpperCase()}
          className="whitespace-pre-line text-lg font-bold leading-relaxed text-foreground/40"
          as="p"
          glitchInterval={4000}
          glitchIntensity={0.3}
          glitchDuration={200}
        />
      </motion.div>
      <div className="flex max-w-md flex-col gap-3">
        {question.answers.map((answer, i) => (
          <motion.button
            key={answer.id}
            onClick={() => onAnswer(answer)}
            className="w-full px-6 py-3 text-left text-sm text-foreground/35 transition-all duration-500 hover:text-gold/70"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 2, delay: 2.5 + i * 0.6, ease: "easeIn" }}
          >
            {answer.text}
          </motion.button>
        ))}
      </div>
      <motion.p
        className="text-xs text-foreground/20"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 2, delay: 6 }}
      >
        your eyes are adjusting.
      </motion.p>
    </div>
  );
}

function ProgressHallway({
  current,
  total,
}: {
  current: number;
  total: number;
}) {
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={`h-1 w-6 transition-all duration-500 ${
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

export default function SortingPage() {
  const router = useRouter();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<
    Record<number, Partial<Record<Category, number>>>
  >({});
  const [transitioning, setTransitioning] = useState(false);

  const handleAnswer = useCallback(
    (answer: Answer) => {
      if (transitioning) return;
      setTransitioning(true);

      const question = QUESTIONS[currentQuestion];
      setAnswers((prev) => ({
        ...prev,
        [question.id]: answer.scores,
      }));

      setTimeout(() => {
        if (currentQuestion < QUESTIONS.length - 1) {
          setCurrentQuestion((c) => c + 1);
          setTransitioning(false);
        } else {
          // Calculate and store result
          const allAnswers = {
            ...answers,
            [question.id]: answer.scores,
          };
          const result = calculateResult(allAnswers);
          sessionStorage.setItem(
            "sorting_result",
            JSON.stringify(result)
          );
          router.push("/result");
        }
      }, 600);
    },
    [currentQuestion, answers, transitioning, router]
  );

  const question = QUESTIONS[currentQuestion];

  const renderQuestion = (q: Question) => {
    switch (q.style) {
      case "binary":
        return <BinaryQuestion question={q} onAnswer={handleAnswer} />;
      case "terminal":
        return <TerminalQuestion question={q} onAnswer={handleAnswer} />;
      case "flashlight":
        return <DarknessQuestion question={q} onAnswer={handleAnswer} />;
      case "scattered":
      case "standard":
      default:
        return <StandardQuestion question={q} onAnswer={handleAnswer} />;
    }
  };

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-void px-8">
      {/* Floor indicator */}
      <motion.div
        className="fixed top-8 right-8 text-xs text-foreground/25"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        Q{currentQuestion + 1} / {QUESTIONS.length}
      </motion.div>

      {/* Progress */}
      <div className="fixed top-8 left-1/2 -translate-x-1/2">
        <ProgressHallway
          current={currentQuestion}
          total={QUESTIONS.length}
        />
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={question.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-2xl"
        >
          {renderQuestion(question)}
        </motion.div>
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
