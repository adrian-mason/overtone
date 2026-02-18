import { useState, useMemo } from "react";
import Fuse from "fuse.js";

interface Article {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly date: string;
  readonly featured: boolean;
  readonly tags: readonly string[];
}

interface Props {
  readonly articles: readonly Article[];
  readonly categorySlug: string;
  readonly featuredBg: string;
  readonly initialCount?: number;
}

/* Three sketch border-radius variations for visual rhythm */
const sketchVariants = [
  "255px 15px 225px 15px / 15px 225px 15px 255px",
  "15px 225px 15px 255px / 255px 15px 225px 15px",
  "225px 15px 255px 15px / 15px 255px 15px 225px",
];

/* Subtle tilt rotations matching CSS tilt classes */
const tiltVariants = ["-1deg", "0.8deg", "-0.5deg"];

export default function ArticleSearch({
  articles,
  categorySlug,
  featuredBg,
  initialCount = 3,
}: Props) {
  const [query, setQuery] = useState("");
  const [showAll, setShowAll] = useState(false);

  const fuse = useMemo(
    () =>
      new Fuse([...articles], {
        keys: ["title", "description", "tags"],
        threshold: 0.4,
      }),
    [articles],
  );

  const filtered = query.trim()
    ? fuse.search(query).map((r) => r.item)
    : [...articles];

  const isSearching = query.trim().length > 0;
  const visible = isSearching || showAll ? filtered : filtered.slice(0, initialCount);
  const hiddenCount = filtered.length - initialCount;

  return (
    <div>
      {/* Search box — sketchy border */}
      <div className="relative mb-10">
        <svg
          className="absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        <input
          type="text"
          placeholder="Search articles..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="sketch-input w-full bg-white py-4 pl-14 pr-5 text-base outline-none transition-shadow placeholder:text-gray-400"
          style={{ fontFamily: "'Noto Serif', serif" }}
        />
      </div>

      {/* Article list */}
      <div className="flex flex-col gap-5">
        {visible.map((article, index) => (
          <a
            key={article.id}
            href={`/${categorySlug}/${article.id}`}
            className="group bg-white p-6 transition-all sm:p-8"
            style={{
              border: "2px solid #2a2a2a",
              borderRadius: sketchVariants[index % sketchVariants.length],
              boxShadow: "4px 4px 0 rgba(0, 0, 0, 0.08)",
              transform: `rotate(${tiltVariants[index % tiltVariants.length]})`,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "rotate(0deg) translateY(-2px)";
              e.currentTarget.style.boxShadow = "6px 8px 0 rgba(0, 0, 0, 0.1)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = `rotate(${tiltVariants[index % tiltVariants.length]})`;
              e.currentTarget.style.boxShadow = "4px 4px 0 rgba(0, 0, 0, 0.08)";
            }}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <h3
                  className="text-2xl font-bold leading-tight text-gray-900 sm:text-3xl"
                  style={{ fontFamily: "'Caveat', cursive" }}
                >
                  {article.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-500">
                  {article.description}
                </p>
              </div>
              {article.featured && (
                <span
                  className="shrink-0 px-3 py-1 text-xs font-medium text-gray-700"
                  style={{
                    backgroundColor: featuredBg,
                    border: "1.5px solid #2a2a2a",
                    borderRadius: "255px 25px 225px 25px / 25px 225px 25px 255px",
                  }}
                >
                  Featured
                </span>
              )}
            </div>
            <div className="mt-4 flex items-center justify-between text-xs text-gray-400">
              <time dateTime={article.date}>
                {new Date(article.date).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })}
              </time>
              <span className="transition-colors group-hover:text-gray-900">
                Read →
              </span>
            </div>
          </a>
        ))}
      </div>

      {/* Empty state */}
      {visible.length === 0 && (
        <p className="py-12 text-center text-gray-400">
          No articles found for &ldquo;{query}&rdquo;
        </p>
      )}

      {/* Show more button — sketchy pill */}
      {!isSearching && !showAll && hiddenCount > 0 && (
        <div className="mt-10 text-center">
          <button
            onClick={() => setShowAll(true)}
            className="bg-white px-8 py-3 text-sm text-gray-600 transition-shadow hover:shadow-md"
            style={{
              border: "2px solid #2a2a2a",
              borderRadius: "255px 25px 225px 25px / 25px 225px 25px 255px",
            }}
          >
            ↓ Show All Articles (+{hiddenCount} more)
          </button>
        </div>
      )}
    </div>
  );
}
