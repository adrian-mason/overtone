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
      {/* Search box */}
      <div className="relative mb-8">
        <svg
          className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400"
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
          className="w-full rounded-lg border border-gray-200 bg-white py-3 pl-12 pr-4 text-sm outline-none transition-shadow placeholder:text-gray-400 focus:border-gray-300 focus:shadow-sm"
          style={{ fontFamily: "'Noto Serif', serif" }}
        />
      </div>

      {/* Article list */}
      <div className="flex flex-col gap-4">
        {visible.map((article) => (
          <a
            key={article.id}
            href={`/${categorySlug}/${article.id}`}
            className="group rounded-xl border border-gray-200 bg-white p-5 transition-shadow hover:shadow-md sm:p-6"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <h3
                  className="text-xl font-bold leading-tight text-gray-900 sm:text-2xl"
                  style={{ fontFamily: "'Caveat', cursive" }}
                >
                  {article.title}
                </h3>
                <p className="mt-1 text-sm leading-relaxed text-gray-500">
                  {article.description}
                </p>
              </div>
              {article.featured && (
                <span
                  className="shrink-0 rounded-md px-2.5 py-1 text-xs font-medium text-gray-700"
                  style={{ backgroundColor: featuredBg }}
                >
                  Featured
                </span>
              )}
            </div>
            <div className="mt-3 flex items-center justify-between text-xs text-gray-400">
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

      {/* Show more button */}
      {!isSearching && !showAll && hiddenCount > 0 && (
        <div className="mt-8 text-center">
          <button
            onClick={() => setShowAll(true)}
            className="rounded-full border border-gray-300 bg-white px-6 py-2.5 text-sm text-gray-600 transition-shadow hover:shadow-md"
          >
            ↓ Show All Articles (+{hiddenCount} more)
          </button>
        </div>
      )}
    </div>
  );
}
