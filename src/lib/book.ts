import fs from "fs";
import path from "path";

export interface ChapterMeta {
  number: number;
  slug: string;
  title: string;
  part?: { number: string; title: string; subtitle: string };
  fileName: string;
}

export const chapters: ChapterMeta[] = [
  { number: 0, slug: "preface", title: "Preface", fileName: "Chapter_00_Preface.txt" },
  { number: 1, slug: "1", title: "The Stillness Between Waves", fileName: "Chapter_01_The_Stillness_Between_Waves.txt", part: { number: "I", title: "The Pause Before the Storm", subtitle: "Anticipation, fear, and the weight of what\u2019s coming" } },
  { number: 2, slug: "2", title: "The Moment Before the Fall", fileName: "Chapter_02_The_Moment_Before_the_Fall.txt" },
  { number: 3, slug: "3", title: "The Fear That Finds You", fileName: "Chapter_03_The_Fear_That_Finds_You.txt" },
  { number: 4, slug: "4", title: "Why We Freeze Before We Move", fileName: "Chapter_04_Why_We_Freeze_Before_We_Move.txt" },
  { number: 5, slug: "5", title: "Existing Is Enough (Sometimes)", fileName: "Chapter_05_Existing_Is_Enough_Sometimes.txt", part: { number: "II", title: "When Breathing Feels Like Work", subtitle: "Survival in the in-between \u2014 heavy, slow, stuck" } },
  { number: 6, slug: "6", title: "The Noise Inside the Quiet", fileName: "Chapter_06_The_Noise_Inside_the_Quiet.txt" },
  { number: 7, slug: "7", title: "What Survival Costs", fileName: "Chapter_07_What_Survival_Costs.txt" },
  { number: 8, slug: "8", title: "Why Rest Feels Like Failure", fileName: "Chapter_08_Why_Rest_Feels_Like_Failure.txt" },
  { number: 9, slug: "9", title: "Nothing Is Happening, and That\u2019s a Lot", fileName: "Chapter_09_Nothing_Is_Happening_and_Thats_a_Lot.txt", part: { number: "III", title: "The Weight of Waiting", subtitle: "Stagnation, liminal space, nothing happening and that being a lot" } },
  { number: 10, slug: "10", title: "The Agony of Almost", fileName: "Chapter_10_The_Agony_of_Almost.txt" },
  { number: 11, slug: "11", title: "When the Future Feels Heavy", fileName: "Chapter_11_When_the_Future_Feels_Heavy.txt" },
  { number: 12, slug: "12", title: "Between Before and After", fileName: "Chapter_12_Between_Before_and_After.txt" },
  { number: 13, slug: "13", title: "Hope Isn\u2019t Loud", fileName: "Chapter_13_Hope_Isnt_Loud.txt", part: { number: "IV", title: "The Shaky Inhale of Hope", subtitle: "Fragile, imperfect, slow progress" } },
  { number: 14, slug: "14", title: "One Step, One Breath, One More Try", fileName: "Chapter_14_One_Step_One_Breath_One_More_Try.txt" },
  { number: 15, slug: "15", title: "The Strength in Softness", fileName: "Chapter_15_The_Strength_in_Softness.txt" },
  { number: 16, slug: "16", title: "The Space Between Almost", fileName: "Chapter_16_The_Space_Between_Almost.txt" },
  { number: 17, slug: "17", title: "The Sharp Edge of Memory", fileName: "Chapter_17_The_Sharp_Edge_of_Memory.txt", part: { number: "V", title: "Memory as a Mirror", subtitle: "The past, sharp edges, stories we carry" } },
  { number: 18, slug: "18", title: "The Myth of Endings", fileName: "Chapter_18_The_Myth_of_Endings.txt" },
  { number: 19, slug: "19", title: "The Ember in the Dark", fileName: "Chapter_19_The_Ember_in_the_Dark.txt" },
  { number: 20, slug: "20", title: "Enough Is Everything", fileName: "Chapter_20_Enough_Is_Everything.txt" },
];

export type ContentBlock =
  | { type: "paragraph"; text: string }
  | { type: "aside"; text: string }
  | { type: "section-break" }
  | { type: "subheading"; text: string }
  | { type: "whiteboard"; items: string[] };

export interface ParsedChapter {
  meta: ChapterMeta;
  blocks: ContentBlock[];
}

export function parseChapterContent(
  text: string,
  meta: ChapterMeta
): ParsedChapter {
  const lines = text.split("\n");
  const blocks: ContentBlock[] = [];

  // Skip header lines (Part header, subtitle, chapter title)
  let startIndex = 0;
  for (let i = 0; i < lines.length && i < 10; i++) {
    const line = lines[i].trim();
    if (
      line.startsWith("PART ") ||
      (line.startsWith("(") && line.endsWith(")") && line.length < 100) ||
      line.startsWith("Chapter ") ||
      line === "Preface" ||
      line === ""
    ) {
      startIndex = i + 1;
    } else {
      break;
    }
  }

  // Split into raw blocks: use blank lines first, then treat each
  // remaining line as its own block (many chapter files use single newlines)
  const bodyLines = lines.slice(startIndex);
  const rawBlocks: string[] = [];
  let currentBlock: string[] = [];

  for (const line of bodyLines) {
    if (line.trim() === "") {
      if (currentBlock.length > 0) {
        rawBlocks.push(currentBlock.join(" "));
        currentBlock = [];
      }
    } else {
      // If this line starts with » or is a section break, it's its own block
      // even without a blank line before it
      const trimmed = line.trim();
      if (
        /^[\*]?\u00bb/.test(trimmed) ||
        /^-{3,}$/.test(trimmed)
      ) {
        if (currentBlock.length > 0) {
          rawBlocks.push(currentBlock.join(" "));
          currentBlock = [];
        }
        rawBlocks.push(trimmed);
      } else {
        // Check if previous block content ends with « (aside just ended)
        // or if this is clearly a new paragraph (short lines often are)
        if (currentBlock.length > 0) {
          const prev = currentBlock[currentBlock.length - 1].trim();
          if (prev.endsWith("\u00ab") || prev.endsWith("\u00ab*")) {
            rawBlocks.push(currentBlock.join(" "));
            currentBlock = [];
          }
        }
        currentBlock.push(line);
      }
    }
  }
  if (currentBlock.length > 0) {
    rawBlocks.push(currentBlock.join(" "));
  }

  // Now also split any block that has an inline »...« embedded within it
  const paragraphs: string[] = [];
  for (const block of rawBlocks) {
    const trimmed = block.trim();
    if (!trimmed) continue;

    // Check for inline asides: text before »...« text after
    const asidePattern = /([\*]?\u00bb[^\u00ab]+\u00ab[\*]?)/g;
    if (asidePattern.test(trimmed) && !trimmed.startsWith("\u00bb") && !trimmed.startsWith("*\u00bb")) {
      // Split around the aside(s)
      const parts = trimmed.split(/([\*]?\u00bb[^\u00ab]+\u00ab[\*]?)/g);
      for (const part of parts) {
        const p = part.trim();
        if (p) paragraphs.push(p);
      }
    } else {
      paragraphs.push(trimmed);
    }
  }

  for (const para of paragraphs) {
    if (/^-{3,}$/.test(para)) {
      blocks.push({ type: "section-break" });
      continue;
    }

    if (/^[\*]?\u00bb/.test(para)) {
      const cleaned = para
        .replace(/^\*?\u00bb\s*/, "")
        .replace(/\s*\u00ab\*?$/, "");
      blocks.push({ type: "aside", text: cleaned });
      continue;
    }

    // Whiteboard list: "Wake up. Get out of bed. Take a shower. Go outside."
    if (
      para.includes("Wake up") &&
      para.includes("Get out of bed") &&
      para.includes("Take a shower") &&
      para.includes("Go outside")
    ) {
      const wakeIdx = para.indexOf("Wake up");
      const checkBefore = para.lastIndexOf("\u2713", wakeIdx);
      const listStart =
        checkBefore >= 0 && wakeIdx - checkBefore <= 2
          ? checkBefore
          : wakeIdx;

      const before = para.slice(0, listStart).trim();
      if (before) {
        blocks.push({ type: "paragraph", text: before });
      }

      const listText = para.slice(listStart);
      const hasCheckmarks = listText.includes("\u2713");
      const hasChecks = /\bCheck\b/i.test(listText);

      let items: string[];
      if (hasCheckmarks) {
        items = [
          "\u2713 Wake up",
          "\u2713 Get out of bed",
          "\u2713 Take a shower",
          "\u2713 Go outside",
        ];
      } else if (hasChecks) {
        items = [
          "Wake up. Check.",
          "Get out of bed. Check.",
          "Take a shower. Check.",
          "Go outside. Check.",
        ];
      } else {
        items = [
          "Wake up.",
          "Get out of bed.",
          "Take a shower.",
          "Go outside.",
        ];
      }

      blocks.push({ type: "whiteboard", items });
      continue;
    }

    // Subheading: short, no ending sentence punctuation, 2-10 words
    const words = para.split(/\s+/);
    if (
      words.length >= 2 &&
      words.length <= 10 &&
      para.length < 60 &&
      !/[.!?\u00ab\u00bb\u2026"']$/.test(para) &&
      !para.includes("\n")
    ) {
      blocks.push({ type: "subheading", text: para });
      continue;
    }

    blocks.push({ type: "paragraph", text: para });
  }

  return { meta, blocks };
}

export function getChapter(slug: string): ParsedChapter | null {
  const meta = chapters.find((c) => c.slug === slug);
  if (!meta) return null;

  const filePath = path.join(
    process.cwd(),
    "src",
    "content",
    "book",
    meta.fileName
  );
  const text = fs.readFileSync(filePath, "utf-8");
  return parseChapterContent(text, meta);
}

export function getAdjacentChapters(slug: string) {
  const index = chapters.findIndex((c) => c.slug === slug);
  return {
    prev: index > 0 ? chapters[index - 1] : null,
    next: index < chapters.length - 1 ? chapters[index + 1] : null,
  };
}
