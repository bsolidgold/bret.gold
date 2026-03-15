import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { sendVisitorDigest } from "@/lib/discord/send-digest";

const anthropic = process.env.ANTHROPIC_API_KEY
  ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  : null;

/**
 * Generate a short AI summary of the visitor based on the interview transcript.
 * Written for Bret — casual, perceptive, like a concierge briefing.
 */
async function generateVisitorSummary(
  transcript: { role: string; content: string }[] | null,
  targetedQuestions: { question: string; answer: string }[] | null,
  relationshipType: string,
  archetype: string
): Promise<string | null> {
  if (!anthropic) return null;
  if ((!transcript || transcript.length === 0) && (!targetedQuestions || targetedQuestions.length === 0)) return null;

  try {
    // Build the full interaction text
    const parts: string[] = [];

    if (transcript && transcript.length > 0) {
      const transcriptText = transcript
        .map((m) =>
          m.role === "assistant"
            ? `ELEVATOR: ${m.content}`
            : `VISITOR: ${m.content}`
        )
        .join("\n");
      parts.push(`ELEVATOR INTERVIEW:\n${transcriptText}`);
    }

    if (targetedQuestions && targetedQuestions.length > 0) {
      const qaText = targetedQuestions
        .map((qa) => `Q: ${qa.question}\nA: ${qa.answer}`)
        .join("\n\n");
      parts.push(`SORTING QUESTIONS:\n${qaText}`);
    }

    const fullInteraction = parts.join("\n\n---\n\n");

    const response = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 200,
      system: `You are The Building's concierge, writing a private note to Bret (the building's owner) about a visitor who just came through the elevator. You've read their full interaction — the freeform elevator interview and the multiple-choice sorting questions — and know they were classified as "${relationshipType}" with the archetype "${archetype}".

Write a single short paragraph (2-4 sentences) summarizing your read on this person — their vibe, what they seem to care about, anything interesting or notable from the full interaction. Be perceptive and concise. Write like a trusted aide giving a quick briefing, not like a formal report. No headers, no bullet points, no labels — just the paragraph.`,
      messages: [
        {
          role: "user",
          content: `Here's the full interaction:\n\n${fullInteraction}`,
        },
      ],
    });

    const textBlock = response.content.find((b) => b.type === "text");
    if (textBlock && textBlock.type === "text") {
      return textBlock.text.trim();
    }
    return null;
  } catch (err) {
    console.error("Failed to generate visitor summary:", err);
    return null;
  }
}

/**
 * POST /api/visitor-digest
 * Called from the welcome page after OAuth completes.
 * Sends a digest DM to Bret with the visitor's sorting results, AI summary, and interview transcript.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { transcript, targetedQuestions, sortingResult, username } = body;

    if (!sortingResult || !username) {
      return NextResponse.json(
        { error: "sortingResult and username required" },
        { status: 400 }
      );
    }

    const relationshipType = sortingResult.relationshipType || "unknown";
    const archetype = sortingResult.archetype?.name || "unknown";

    // Generate AI summary from the full interaction
    const summary = await generateVisitorSummary(
      transcript,
      targetedQuestions,
      relationshipType,
      archetype
    );

    await sendVisitorDigest({
      username,
      relationshipType,
      archetype,
      primaryFloorRoles: sortingResult.primaryFloorRoles || [],
      autoApprovedFloorRoles: sortingResult.autoApprovedFloorRoles || [],
      gatewayFloorRoles: sortingResult.gatewayFloorRoles || [],
      transcript: transcript || null,
      targetedQuestions: targetedQuestions || null,
      summary,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Visitor digest error:", err);
    return NextResponse.json(
      { error: "Failed to send digest" },
      { status: 500 }
    );
  }
}
