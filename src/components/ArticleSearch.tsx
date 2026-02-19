import { useState, useMemo } from "react";
import Fuse from "fuse.js";

interface Article {
  readonly id: string;
  readonly title: string;
  readonly subtitle?: string;
  readonly description: string;
  readonly date: string;
  readonly featured: boolean;
  readonly tags: readonly string[];
}

interface Props {
  readonly articles: readonly Article[];
  readonly categorySlug: string;
  readonly featuredBg: string;
  readonly hoverColor?: string;
  readonly initialCount?: number;
}

export default function ArticleSearch({
  articles,
  categorySlug,
  featuredBg,
  hoverColor = "#2563EB",
  initialCount = 3,
}: Props) {
  const [query, setQuery] = useState("");
  const [showAll, setShowAll] = useState(false);

  const fuse = useMemo(
    () =>
      new Fuse([...articles], {
        keys: ["title", "description", "tags"],
        threshold: 0.3,
        ignoreLocation: true,
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
    <div className="space-y-6">
      {/* Search bar — neo-brutalist with paper rotation effect */}
      <div className="relative">
        <div
          className="pointer-events-none absolute inset-0 rounded-lg border-2 border-black bg-white"
          style={{ transform: "rotate(1deg)" }}
        />
        <div className="relative flex items-center gap-3 rounded-lg border-2 border-black bg-white p-4">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-gray-400"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>
          <input
            type="text"
            placeholder="Search articles..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-transparent text-xl outline-none placeholder:text-gray-400"
          />
        </div>
      </div>

      {/* Article list */}
      <div className="space-y-6">
        {visible.map((article) => (
          <a
            key={article.id}
            href={`/${categorySlug}/${article.id}`}
            className="group block"
          >
            <div className="relative">
              {/* Background shadow card */}
              <div className="absolute inset-0 rounded-lg border-2 border-black bg-white transition-transform group-hover:translate-x-1 group-hover:translate-y-1" />
              {/* Main card */}
              <div
                className="neo-card-sm relative space-y-3 p-6"
              >
                <div className="flex items-start justify-between gap-4">
                  <h3
                    className="text-2xl font-bold transition-colors md:text-3xl"
                    style={{ color: "inherit" }}
                    onMouseEnter={() => {}}
                  >
                    {article.title}
                  </h3>
                  {article.subtitle && (
                    <p className="text-lg text-gray-500">{article.subtitle}</p>
                  )}
                  {article.featured && (
                    <span
                      className="neo-badge shrink-0 px-3 py-1"
                      style={{ backgroundColor: featuredBg }}
                    >
                      Featured
                    </span>
                  )}
                </div>
                <div className="text-lg text-gray-600">
                  {article.description}
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <div className="flex items-center gap-1">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M8 2v4" /><path d="M16 2v4" /><rect width="18" height="18" x="3" y="4" rx="2" /><path d="M3 10h18" /></svg>
                    <time dateTime={article.date}>
                      {new Date(article.date).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </time>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                    <span>Read more</span>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>
                  </div>
                </div>
              </div>
            </div>
          </a>
        ))}
      </div>

      {/* Empty state */}
      {visible.length === 0 && (
        <p className="py-12 text-center text-xl text-gray-400">
          No articles found for &ldquo;{query}&rdquo;
        </p>
      )}

      {/* Show All button — neo-brutalist pill */}
      {!isSearching && !showAll && hiddenCount > 0 && (
        <div className="flex justify-center pt-4">
          <button onClick={() => setShowAll(true)} className="group relative">
            <div className="absolute inset-0 rounded-full border-2 border-black bg-white transition-transform group-hover:translate-x-1 group-hover:translate-y-1" />
            <div className="neo-pill relative flex items-center gap-3 px-8 py-4 text-xl font-bold">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
              <span>Show All Articles (+{hiddenCount} more)</span>
            </div>
          </button>
        </div>
      )}
    </div>
  );
}
