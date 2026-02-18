import { marked, type Tokens } from "marked";

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

export function extractBilingual(body: string | undefined): BilingualContent | undefined {
  if (!body) return undefined;
  const idx = body.indexOf(ZH_SEPARATOR);
  if (idx === -1) return undefined;

  const enMarkdown = body.slice(0, idx).trim();
  const zhMarkdown = body.slice(idx + ZH_SEPARATOR.length).trim();
  if (zhMarkdown.length === 0) return undefined;

  const enTokens = marked.lexer(enMarkdown);
  const zhTokens = marked.lexer(zhMarkdown);

  return {
    enHtml: marked.parser(enTokens),
    zhHtml: marked.parser(zhTokens),
    enHeadings: extractHeadings(enTokens),
    zhHeadings: extractHeadings(zhTokens),
  };
}
