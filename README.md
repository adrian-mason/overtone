# Overtone

Adrian's digital garden. Three domains: Performance Engineering, Classical Records, AI Thoughts.

**Stack**: Astro + TypeScript + Tailwind CSS + React islands, deployed to Cloudflare Pages.

## Development

```sh
pnpm install
pnpm dev          # http://localhost:4321
pnpm build        # output → ./dist/
pnpm preview      # preview production build
```

## Project Structure

```
src/
├── content/              # Markdown articles (Astro Content Collections)
│   ├── performance/
│   ├── classical/
│   └── ai/
├── components/           # Astro + React components
├── layouts/              # BaseLayout, ArticleLayout
├── lib/                  # Shared types and config
├── pages/                # Routes
│   ├── index.astro       # Landing page
│   ├── performance.astro # Category list
│   ├── classical.astro
│   ├── ai.astro
│   ├── contact.astro
│   ├── 404.astro
│   ├── rss.xml.ts        # RSS feed
│   └── [category]/[slug].astro  # Article detail
└── styles/global.css     # Tailwind entry
```

## Deploy to Cloudflare Pages

### Option A: Git integration (recommended)

1. Push this repo to GitHub/GitLab
2. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/) → Pages → Create a project
3. Connect your repository
4. Set build configuration:
   - **Build command**: `pnpm build`
   - **Build output directory**: `dist`
   - **Node.js version**: `20` (set via environment variable `NODE_VERSION=20`)
5. Deploy

Cloudflare Pages will auto-deploy on every push to `main`.

### Option B: Direct upload via CLI

```sh
# Install wrangler globally (if not already)
pnpm add -g wrangler

# Login to Cloudflare
wrangler login

# Build the site
pnpm build

# Deploy
wrangler pages deploy dist --project-name=overtone
```

### Custom domain

After the first deploy, add your domain in Cloudflare Pages settings:
- Pages project → Custom domains → Add `overtone.dev`
- Update DNS: CNAME `overtone.dev` → `overtone.pages.dev`

### Environment notes

- **Output mode**: Static (no SSR, no adapter needed)
- **Build output**: `dist/`
- **No `wrangler.toml` required** — Cloudflare Pages handles static site hosting natively
- **Sitemap**: auto-generated at `/sitemap-index.xml`
- **RSS**: available at `/rss.xml`
