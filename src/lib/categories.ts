export interface CategoryConfig {
  readonly slug: string;
  readonly title: string;
  readonly description: string;
  readonly bgColor: string;
  readonly iconBg: string;
  readonly iconColor: string;
  readonly collection: "performance" | "classical" | "ai";
}

export const categories: Record<string, CategoryConfig> = {
  performance: {
    slug: "performance",
    title: "Performance Engineering",
    description:
      "Deep dives into system optimization, profiling, and latency hunting.",
    bgColor: "#DBEAFE",
    iconBg: "#DBEAFE",
    iconColor: "#3B82F6",
    collection: "performance",
  },
  classical: {
    slug: "classical",
    title: "Classical Records",
    description: "Reviews of timeless recordings. From Bach to Mahler.",
    bgColor: "#FEF3C7",
    iconBg: "#FEF3C7",
    iconColor: "#F59E0B",
    collection: "classical",
  },
  ai: {
    slug: "ai",
    title: "Artificial Intelligence",
    description:
      "Exploring the frontier of LLMs, agents, and generative art.",
    bgColor: "#F3E8FF",
    iconBg: "#F3E8FF",
    iconColor: "#A855F7",
    collection: "ai",
  },
} as const;
