import Link from "next/link";
import { notFound } from "next/navigation";
import {
  chapters,
  getChapter,
  getAdjacentChapters,
  type ContentBlock,
} from "@/lib/book";

export function generateStaticParams() {
  return chapters.map((ch) => ({ chapter: ch.slug }));
}

function ChapterNav({
  prev,
  next,
  position,
}: {
  prev: { slug: string; number: number; title: string } | null;
  next: { slug: string; number: number; title: string } | null;
  position: "top" | "bottom";
}) {
  const border =
    position === "top"
      ? { borderBottom: "1px solid #444" }
      : { borderTop: "1px solid #444" };
  const spacing =
    position === "top" ? "mb-6 pb-3" : "mt-12 pt-6";

  return (
    <div className={spacing} style={border}>
      <div className="flex justify-between items-start">
        <div className="max-w-[40%]">
          {prev && (
            <Link
              href={`/theSpaceBetweenBreaths/${prev.slug}`}
              className="hover:opacity-70 transition-opacity block"
              style={{ color: "#c9b88c" }}
            >
              <span className="text-xs block mb-0.5" style={{ color: "#999" }}>
                &larr; Previous
              </span>
              <span className="text-sm">
                {prev.number > 0 ? `${prev.number}. ${prev.title}` : prev.title}
              </span>
            </Link>
          )}
        </div>
        <div className="pt-1">
          <Link
            href="/theSpaceBetweenBreaths"
            className="text-xs hover:opacity-70 transition-opacity"
            style={{ color: "#999" }}
          >
            Contents
          </Link>
        </div>
        <div className="max-w-[40%] text-right">
          {next && (
            <Link
              href={`/theSpaceBetweenBreaths/${next.slug}`}
              className="hover:opacity-70 transition-opacity block"
              style={{ color: "#c9b88c" }}
            >
              <span className="text-xs block mb-0.5" style={{ color: "#999" }}>
                Next &rarr;
              </span>
              <span className="text-sm">
                {next.number > 0 ? `${next.number}. ${next.title}` : next.title}
              </span>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

function renderBlock(block: ContentBlock, i: number, prev: ContentBlock | null) {
  switch (block.type) {
    case "paragraph": {
      const indent = prev?.type === "paragraph";
      return (
        <p
          key={i}
          style={{
            textIndent: indent ? "1.5em" : undefined,
            marginBottom: "0.3em",
          }}
        >
          {block.text}
        </p>
      );
    }
    case "aside":
      return (
        <p
          key={i}
          className="italic"
          style={{
            color: "#a09880",
            margin: "1.8em 0",
            paddingLeft: "1.5em",
            borderLeft: "2px solid #333",
          }}
        >
          {block.text}
        </p>
      );
    case "section-break":
      return (
        <div
          key={i}
          className="text-center"
          style={{ color: "#555", margin: "2.5em 0" }}
        >
          &middot; &middot; &middot;
        </div>
      );
    case "subheading":
      return (
        <h3
          key={i}
          className="font-semibold"
          style={{
            color: "#e8e0d0",
            fontSize: "1.15em",
            marginTop: "2.5em",
            marginBottom: "1em",
          }}
        >
          {block.text}
        </h3>
      );
    case "whiteboard":
      return (
        <div
          key={i}
          style={{
            margin: "1.5em 0",
            paddingLeft: "1.5em",
          }}
        >
          {block.items.map((item, j) => (
            <p key={j} style={{ marginBottom: "0.15em" }}>
              {item}
            </p>
          ))}
        </div>
      );
  }
}

export default async function ChapterPage({
  params,
}: {
  params: Promise<{ chapter: string }>;
}) {
  const { chapter: slug } = await params;
  const parsed = getChapter(slug);
  if (!parsed) notFound();

  const { meta, blocks } = parsed;
  const { prev, next } = getAdjacentChapters(slug);

  return (
    <div className="max-w-xl mx-auto px-6 py-8 md:py-12">
      {/* Top navigation */}
      <ChapterNav prev={prev} next={next} position="top" />

      {/* Part header */}
      {meta.part && (
        <div className="text-center mb-6">
          <p
            className="text-xs uppercase tracking-[0.3em] mb-1"
            style={{ color: "#c9a84c" }}
          >
            Part {meta.part.number}
          </p>
          <p className="text-lg italic mb-1" style={{ color: "#c9b88c" }}>
            {meta.part.title}
          </p>
          <p className="text-sm italic" style={{ color: "#999" }}>
            {meta.part.subtitle}
          </p>
          <div
            className="w-12 h-px mx-auto mt-4"
            style={{ background: "#333" }}
          />
        </div>
      )}

      {/* Chapter title */}
      <div className="text-center mb-6">
        {meta.number > 0 && (
          <p
            className="text-xs uppercase tracking-[0.3em] mb-2"
            style={{ color: "#777" }}
          >
            Chapter {meta.number}
          </p>
        )}
        <h1
          className="text-2xl md:text-3xl font-light"
          style={{ color: "#e8e0d0" }}
        >
          {meta.title}
        </h1>
      </div>

      {/* Content */}
      <div className="mt-6">
        {blocks.map((block, i) =>
          renderBlock(block, i, i > 0 ? blocks[i - 1] : null)
        )}
      </div>

      {/* Bottom navigation */}
      <ChapterNav prev={prev} next={next} position="bottom" />
    </div>
  );
}
