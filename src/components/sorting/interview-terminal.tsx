"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { RelationshipType } from "@/lib/sorting/interview-prompt";

type Message = {
  role: "user" | "assistant";
  content: string;
};

interface InterviewTerminalProps {
  onClassified: (type: RelationshipType, transcript: Message[]) => void;
}

export function InterviewTerminal({ onClassified }: InterviewTerminalProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(true); // Start loading for initial message
  const [typingText, setTypingText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [classified, setClassified] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const hasInitialized = useRef(false);
  const messagesRef = useRef<Message[]>([]);

  // Keep messagesRef in sync for closure access
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, typingText]);

  // Focus input when not loading
  useEffect(() => {
    if (!isLoading && !isTyping && !classified && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isLoading, isTyping, classified]);

  // Typewriter effect for assistant messages
  const typeMessage = useCallback(
    (text: string, classification: string | null) => {
      setIsTyping(true);
      setTypingText("");
      let i = 0;
      const speed = 25 + Math.random() * 15;

      const tick = () => {
        if (i < text.length) {
          setTypingText(text.slice(0, i + 1));
          i++;
          setTimeout(tick, speed + (Math.random() * speed * 0.5 - speed * 0.25));
        } else {
          // Done typing
          setMessages((prev) => [...prev, { role: "assistant", content: text }]);
          setTypingText("");
          setIsTyping(false);

          if (classification) {
            // Classified! Trigger transition after a beat
            setClassified(true);
            // Build full transcript (use ref for latest messages + this final assistant message)
            const fullTranscript = [...messagesRef.current, { role: "assistant" as const, content: text }];
            setTimeout(() => {
              onClassified(classification as RelationshipType, fullTranscript);
            }, 1500);
          } else {
            setIsLoading(false);
          }
        }
      };

      tick();
    },
    [onClassified]
  );

  // Fetch initial elevator message
  useEffect(() => {
    if (hasInitialized.current) return;
    hasInitialized.current = true;

    const fetchInitial = async () => {
      try {
        const res = await fetch("/api/interview", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: [] }),
        });
        const data = await res.json();
        typeMessage(data.message, data.classification);
      } catch {
        typeMessage(
          "the cables groan. the elevator stalls. try knocking again.",
          null
        );
      }
    };

    // Small delay for atmosphere
    setTimeout(fetchInitial, 800);
  }, [typeMessage]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || isLoading || isTyping || classified) return;

    setInput("");
    setIsLoading(true);

    const userMsg: Message = { role: "user", content: text };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);

    try {
      const res = await fetch("/api/interview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: updatedMessages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });
      const data = await res.json();
      typeMessage(data.message, data.classification);
    } catch {
      typeMessage(
        "the elevator shudders. something went wrong in the shaft.",
        null
      );
    }
  };

  // Render assistant messages with the question line (last line ending with ?) in bold
  const renderAssistantMessage = (text: string) => {
    const lines = text.split("\n");
    const lastLine = lines[lines.length - 1];
    const isQuestion = lastLine.trim().endsWith("?");

    if (lines.length > 1 && isQuestion) {
      const atmosphere = lines.slice(0, -1).join("\n");
      return (
        <>
          <span className="text-green-glow/60">{atmosphere}</span>
          {"\n"}
          <span className="font-bold text-green-glow">{lastLine}</span>
        </>
      );
    }
    return <span className="text-green-glow/70">{text}</span>;
  };

  return (
    <div className="flex w-full max-w-xl flex-col">
      {/* Terminal header */}
      <div className="flex items-center gap-2 border border-b-0 border-green-glow/15 bg-green-glow/[0.02] px-4 py-2">
        <div className="h-1.5 w-1.5 rounded-full bg-green-glow/50" />
        <span className="font-mono text-[10px] tracking-wider text-green-glow/40">
          THE ELEVATOR
        </span>
      </div>

      {/* Messages area */}
      <div
        ref={scrollRef}
        className="flex min-h-[300px] max-h-[400px] flex-col gap-3 overflow-y-auto border border-green-glow/15 bg-void p-4 font-mono sm:min-h-[350px]"
      >
        {/* Rendered messages */}
        {messages.map((msg, i) => (
          <div key={i} className="flex flex-col gap-1">
            {msg.role === "assistant" ? (
              <div className="whitespace-pre-wrap text-sm leading-relaxed">
                {renderAssistantMessage(msg.content)}
              </div>
            ) : (
              <p className="text-sm text-gold/70">
                <span className="text-gold/30">{"> "}</span>
                {msg.content}
              </p>
            )}
          </div>
        ))}

        {/* Currently typing assistant message */}
        {isTyping && (
          <p className="whitespace-pre-wrap text-sm leading-relaxed">
            {renderAssistantMessage(typingText)}
            <motion.span
              className="text-green-glow"
              animate={{ opacity: [1, 1, 0, 0] }}
              transition={{
                duration: 1,
                repeat: Infinity,
                times: [0, 0.49, 0.5, 1],
              }}
            >
              _
            </motion.span>
          </p>
        )}

        {/* Loading dots (waiting for API) */}
        {isLoading && !isTyping && messages.length > 0 && (
          <motion.div
            className="flex gap-1"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {[0, 1, 2].map((i) => (
              <motion.span
                key={i}
                className="text-sm text-green-glow/40"
                animate={{ opacity: [0.2, 0.8, 0.2] }}
                transition={{
                  duration: 1.2,
                  repeat: Infinity,
                  delay: i * 0.2,
                }}
              >
                .
              </motion.span>
            ))}
          </motion.div>
        )}

        {/* Classification animation */}
        <AnimatePresence>
          {classified && (
            <motion.div
              className="mt-4 flex flex-col items-center gap-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <motion.div
                className="h-px w-full bg-gold/20"
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 0.8 }}
              />
              <motion.p
                className="text-xs tracking-[0.3em] text-gold/40"
                animate={{ opacity: [0.3, 0.8, 0.3] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                THE ELEVATOR IS MOVING
              </motion.p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Input area */}
      <div className="flex items-center border border-t-0 border-green-glow/15 bg-void px-4 py-3">
        <span className="mr-2 font-mono text-sm text-gold/30">{"> "}</span>
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") sendMessage();
          }}
          disabled={isLoading || isTyping || classified}
          placeholder={
            classified
              ? ""
              : isLoading || isTyping
                ? "..."
                : "speak"
          }
          className="flex-1 bg-transparent font-mono text-sm text-gold/70 placeholder-foreground/15 outline-none"
          autoComplete="off"
        />
      </div>
    </div>
  );
}
