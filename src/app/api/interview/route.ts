import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { INTERVIEW_SYSTEM_PROMPT, RELATIONSHIP_TYPES } from "@/lib/sorting/interview-prompt";

const anthropic = process.env.ANTHROPIC_API_KEY
  ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  : null;

type Message = {
  role: "user" | "assistant";
  content: string;
};

/**
 * POST /api/interview
 * Sends conversation to Claude to get The Elevator's response + optional classification.
 */
export async function POST(request: Request) {
  if (!anthropic) {
    return NextResponse.json(
      {
        message: "the elevator's cables have gone slack. something is wrong with the wiring.",
        classification: null,
      },
      { status: 200 }
    );
  }

  try {
    const { messages } = (await request.json()) as { messages: Message[] };

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: "messages required" },
        { status: 400 }
      );
    }

    // If empty messages, this is the initial request — seed with a knock
    const apiMessages =
      messages.length === 0
        ? [{ role: "user" as const, content: "*knocks on the door*" }]
        : messages.map((m) => ({
            role: m.role as "user" | "assistant",
            content: m.content,
          }));

    // Count assistant messages to track exchanges
    const assistantCount = messages.filter((m) => m.role === "assistant").length;

    // After 3 exchanges (3 assistant messages), force classification
    const forceClassify = assistantCount >= 3;
    const systemPrompt = forceClassify
      ? `${INTERVIEW_SYSTEM_PROMPT}\n\nIMPORTANT: You have had enough exchanges. You MUST classify this visitor NOW. Set the classification field to one of the valid types. Do not ask any more questions.`
      : INTERVIEW_SYSTEM_PROMPT;

    const response = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 300,
      system: systemPrompt,
      messages: apiMessages,
    });

    // Extract the text response
    const textBlock = response.content.find((b) => b.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      return NextResponse.json({
        message: "the elevator hums. silence.",
        classification: null,
      });
    }

    // Parse JSON from Claude's response
    let parsed: { message: string; classification: string | null };
    try {
      // Try to extract JSON from the response (Claude sometimes wraps in markdown)
      const jsonMatch = textBlock.text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("No JSON found");
      parsed = JSON.parse(jsonMatch[0]);
    } catch {
      // If JSON parsing fails, treat the whole thing as a message
      parsed = { message: textBlock.text, classification: null };
    }

    // Validate classification if present
    if (
      parsed.classification &&
      !RELATIONSHIP_TYPES.includes(parsed.classification as (typeof RELATIONSHIP_TYPES)[number])
    ) {
      parsed.classification = null;
    }

    return NextResponse.json({
      message: parsed.message,
      classification: parsed.classification,
    });
  } catch (err: unknown) {
    const e = err as { status?: number; message?: string };
    console.error("Interview API error:", e.status, e.message);

    if (e.status === 400 && e.message?.includes("credit")) {
      return NextResponse.json({
        message: "the elevator reaches for words but finds empty pockets. the wiring needs funding.",
        classification: null,
        error: "credits_depleted",
      });
    }

    if (e.status === 429) {
      return NextResponse.json({
        message: "the elevator is overwhelmed. too many visitors at once. try again in a moment.",
        classification: null,
        error: "rate_limited",
      });
    }

    return NextResponse.json({
      message: "the cables groan. something is wrong in the shaft. try again.",
      classification: null,
      error: "api_error",
    });
  }
}
