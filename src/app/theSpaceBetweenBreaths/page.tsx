import Link from "next/link";
import { chapters } from "@/lib/book";

const parts = [
  {
    number: "I",
    title: "The Pause Before the Storm",
    subtitle: "Anticipation, fear, and the weight of what\u2019s coming",
    chapters: chapters.slice(1, 5),
  },
  {
    number: "II",
    title: "When Breathing Feels Like Work",
    subtitle: "Survival in the in-between \u2014 heavy, slow, stuck",
    chapters: chapters.slice(5, 9),
  },
  {
    number: "III",
    title: "The Weight of Waiting",
    subtitle:
      "Stagnation, liminal space, nothing happening and that being a lot",
    chapters: chapters.slice(9, 13),
  },
  {
    number: "IV",
    title: "The Shaky Inhale of Hope",
    subtitle: "Fragile, imperfect, slow progress",
    chapters: chapters.slice(13, 17),
  },
  {
    number: "V",
    title: "Memory as a Mirror",
    subtitle: "The past, sharp edges, stories we carry",
    chapters: chapters.slice(17, 21),
  },
];

export default function BookCover() {
  return (
    <div className="max-w-xl mx-auto px-6 py-20 md:py-32">
      <div className="text-center mb-24">
        <h1
          className="text-4xl md:text-5xl font-light tracking-wide mb-6"
          style={{ color: "#e8e0d0" }}
        >
          The Space Between Breaths
        </h1>
        <div
          className="w-16 h-px mx-auto mb-6"
          style={{ background: "#555" }}
        />
        <p
          className="text-lg tracking-[0.25em] uppercase"
          style={{ color: "#a09880" }}
        >
          Bret Gold
        </p>
      </div>

      <div className="mb-16">
        <Link
          href="/theSpaceBetweenBreaths/preface"
          className="hover:opacity-70 transition-opacity"
          style={{ color: "#d4cfc4" }}
        >
          Preface
        </Link>
      </div>

      {parts.map((part) => (
        <div key={part.number} className="mb-14">
          <p
            className="text-xs uppercase tracking-[0.3em] mb-1"
            style={{ color: "#c9a84c" }}
          >
            Part {part.number}
          </p>
          <p className="text-lg italic mb-5" style={{ color: "#a09880" }}>
            {part.title}
          </p>
          <ul className="space-y-2.5 pl-5">
            {part.chapters.map((ch) => (
              <li key={ch.slug}>
                <Link
                  href={`/theSpaceBetweenBreaths/${ch.slug}`}
                  className="hover:opacity-70 transition-opacity"
                  style={{ color: "#d4cfc4" }}
                >
                  <span style={{ color: "#777" }}>{ch.number}.</span>{" "}
                  {ch.title}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
