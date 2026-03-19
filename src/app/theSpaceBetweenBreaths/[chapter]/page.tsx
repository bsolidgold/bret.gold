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
    <div className="max-w-xl mx-auto px-6 py-16 md:py-24">
      {/* Back to contents */}
      <div className="mb-16">
        <Link
          href="/theSpaceBetweenBreaths"
          className="text-sm hover:opacity-70 transition-opacity"
          style={{ color: "#777" }}
        >
          &larr; Contents
        </Link>
      </div>

      {/* Part header */}
      {meta.part && (
        <div className="text-center mb-12">
          <p
            className="text-xs uppercase tracking-[0.3em] mb-2"
            style={{ color: "#c9a84c" }}
          >
            Part {meta.part.number}
          </p>
          <p className="text-xl italic mb-1" style={{ color: "#a09880" }}>
            {meta.part.title}
          </p>
          <p className="text-sm italic" style={{ color: "#666" }}>
            {meta.part.subtitle}
          </p>
          <div
            className="w-16 h-px mx-auto mt-8"
            style={{ background: "#333" }}
          />
        </div>
      )}

      {/* Chapter title */}
      <div className="text-center mb-12">
        {meta.number > 0 && (
          <p
            className="text-xs uppercase tracking-[0.3em] mb-3"
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
      <div className="mt-12">
        {blocks.map((block, i) =>
          renderBlock(block, i, i > 0 ? blocks[i - 1] : null)
        )}
      </div>

      {/* Navigation */}
      <div
        className="mt-20 pt-8 flex justify-between items-center"
        style={{ borderTop: "1px solid #222" }}
      >
        {prev ? (
          <Link
            href={`/theSpaceBetweenBreaths/${prev.slug}`}
            className="hover:opacity-70 transition-opacity"
            style={{ color: "#a09880" }}
          >
            <span className="text-xs block" style={{ color: "#666" }}>
              Previous
            </span>
            {prev.number > 0
              ? `${prev.number}. ${prev.title}`
              : prev.title}
          </Link>
        ) : (
          <div />
        )}
        {next ? (
          <Link
            href={`/theSpaceBetweenBreaths/${next.slug}`}
            className="text-right hover:opacity-70 transition-opacity"
            style={{ color: "#a09880" }}
          >
            <span className="text-xs block" style={{ color: "#666" }}>
              Next
            </span>
            {next.number > 0
              ? `${next.number}. ${next.title}`
              : next.title}
          </Link>
        ) : (
          <div />
        )}
      </div>
    </div>
  );
}
