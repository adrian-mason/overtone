export interface CategoryConfig {
  readonly slug: string;
  readonly title: string;
  readonly description: string;
  readonly bgColor: string;
  readonly iconBg: string;
  readonly iconColor: string;
  readonly hoverColor: string;
  readonly featuredBg: string;
  readonly collection: "performance" | "classical" | "ai" | "life";
}

export const categories: Record<string, CategoryConfig> = {
  performance: {
    slug: "performance",
    title: "Performance Engineering",
    description:
      "Deep dives into system optimization, profiling, and latency hunting.",
    bgColor: "#f0f9ff",
    iconBg: "#DBEAFE",
    iconColor: "#3B82F6",
    hoverColor: "#2563EB",
    featuredBg: "#DBEAFE",
    collection: "performance",
  },
  classical: {
    slug: "classical",
    title: "Classical Records",
    description: "Reviews of timeless recordings. From Bach to Mahler.",
    bgColor: "#fffcf0",
    iconBg: "#FEF3C7",
    iconColor: "#CA8A04",
    hoverColor: "#A16207",
    featuredBg: "#FEF3C7",
    collection: "classical",
  },
  ai: {
    slug: "ai",
    title: "AI Thoughts",
    description:
      "Exploring the frontier of LLMs, agents, and generative art.",
    bgColor: "#f8fafc",
    iconBg: "#F3E8FF",
    iconColor: "#9333EA",
    hoverColor: "#9333EA",
    featuredBg: "#F3E8FF",
    collection: "ai",
  },
  life: {
    slug: "life",
    title: "Life",
    description:
      "No flame graph captures it. No recording preserves it. No model predicts it. Yet here we are.",
    bgColor: "#faf6f1",
    iconBg: "#e8ddd0",
    iconColor: "#8b7355",
    hoverColor: "#6b5b45",
    featuredBg: "#e8ddd0",
    collection: "life",
  },
} as const;
