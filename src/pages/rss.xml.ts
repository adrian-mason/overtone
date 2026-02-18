import rss from "@astrojs/rss";
import { getCollection } from "astro:content";
import type { APIContext } from "astro";

export async function GET(context: APIContext) {
  const [performance, classical, ai] = await Promise.all([
    getCollection("performance"),
    getCollection("classical"),
    getCollection("ai"),
  ]);

  const categorySlug: Record<string, string> = {
    performance: "performance",
    classical: "classical",
    ai: "ai",
  };

  const allArticles = [
    ...performance.map((a) => ({ ...a, category: "performance" })),
    ...classical.map((a) => ({ ...a, category: "classical" })),
    ...ai.map((a) => ({ ...a, category: "ai" })),
  ].sort((a, b) => b.data.date.getTime() - a.data.date.getTime());

  return rss({
    title: "Overtone — Adrian's Digital Garden",
    description:
      "Performance Engineering, Classical Records, and AI Thoughts.",
    site: context.site!.toString(),
    items: allArticles.map((article) => ({
      title: article.data.title,
      description: article.data.description,
      pubDate: article.data.date,
      link: `/${categorySlug[article.category]}/${article.id}/`,
    })),
  });
}
