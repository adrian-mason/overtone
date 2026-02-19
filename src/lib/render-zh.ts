import { marked, type Tokens } from "marked";
import { createHighlighter, type Highlighter } from "shiki";
import DOMPurify from "isomorphic-dompurify";

const ZH_SEPARATOR = "<!-- zh -->";

export interface TocHeading {
  readonly depth: number;
  readonly slug: string;
  readonly text: string;
}

export interface BilingualContent {
  readonly enHtml: string;
  readonly zhHtml: string;
  readonly enHeadings: TocHeading[];
  readonly zhHeadings: TocHeading[];
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\u4e00-\u9fff\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

function extractHeadings(tokens: Tokens.Generic[]): TocHeading[] {
  const headings: TocHeading[] = [];
  for (const token of tokens) {
    if (token.type === "heading") {
      const h = token as Tokens.Heading;
      if (h.depth === 2 || h.depth === 3) {
        headings.push({ depth: h.depth, slug: slugify(h.text), text: h.text });
      }
    }
  }
  return headings;
}

let highlighterPromise: Promise<Highlighter> | null = null;

function getHighlighter(): Promise<Highlighter> {
  if (!highlighterPromise) {
    highlighterPromise = createHighlighter({
      themes: ["github-light"],
      langs: [
        "c", "cpp", "rust", "go", "python", "java",
        "javascript", "typescript", "bash", "shell",
        "json", "yaml", "toml", "sql", "html", "css",
        "diff", "markdown",
      ],
    });
  }
  return highlighterPromise;
}

function renderTokensWithHighlighter(
  tokens: Tokens.Generic[],
  highlighter: Highlighter,
): string {
  const renderer = new marked.Renderer();
  renderer.code = ({ text, lang }: Tokens.Code) => {
    const language = lang ?? "";
    try {
      if (language && highlighter.getLoadedLanguages().includes(language)) {
        return highlighter.codeToHtml(text, {
          lang: language,
          theme: "github-light",
        });
      }
    } catch {
      // fall through to plain text
    }
    const escaped = text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
    return `<pre><code>${escaped}</code></pre>`;
  };

  return marked.parser(tokens, { renderer });
}

export async function extractBilingual(
  body: string | undefined,
): Promise<BilingualContent | undefined> {
  if (!body) return undefined;
  const idx = body.indexOf(ZH_SEPARATOR);
  if (idx === -1) return undefined;

  const enMarkdown = body.slice(0, idx).trim();
  const zhMarkdown = body.slice(idx + ZH_SEPARATOR.length).trim();
  if (zhMarkdown.length === 0) return undefined;

  const highlighter = await getHighlighter();
  const enTokens = marked.lexer(enMarkdown);
  const zhTokens = marked.lexer(zhMarkdown);

  return {
    enHtml: DOMPurify.sanitize(renderTokensWithHighlighter(enTokens, highlighter)),
    zhHtml: DOMPurify.sanitize(renderTokensWithHighlighter(zhTokens, highlighter)),
    enHeadings: extractHeadings(enTokens),
    zhHeadings: extractHeadings(zhTokens),
  };
}
