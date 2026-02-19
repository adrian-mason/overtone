import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

const articleSchema = z.object({
  title: z.string(),
  subtitle: z.string().optional(),
  description: z.string(),
  date: z.coerce.date(),
  featured: z.boolean().default(false),
  tags: z.array(z.string()).default([]),
});

const performance = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "src/content/performance" }),
  schema: articleSchema,
});

const classical = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "src/content/classical" }),
  schema: articleSchema,
});

const ai = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "src/content/ai" }),
  schema: articleSchema,
});

export const collections = { performance, classical, ai };
