# जीवनगाणे — blog (Astro)

A fast, static Marathi blog built from the **B4 "कप्पे" (tiles)** design, in a soft pastel palette.
Essays are plain Markdown files; the site is built into simple HTML you can host anywhere.

## What's inside

```
src/config.ts            ← site name, tagline, bio, topics, photo, email link
src/styles/global.css    ← colours and the whole look (change the colours at the top)
src/content/essays/*.md  ← one file per essay
src/pages/               ← home, all essays, single essay, topics, about, RSS
public/                  ← favicon, robots.txt, and any images (put your photo here)
```

## Run it on your computer

You need [Node.js](https://nodejs.org) 22 or newer.

```bash
npm install
npm run dev      # opens a live preview at http://localhost:4321
npm run build    # creates the finished site in the dist/ folder
```

## Before you go live (3 quick edits)

1. **Your domain** — in `astro.config.mjs` change `SITE_URL` to your real domain, e.g. `https://yourdomain.com`.
   Also change the `Sitemap:` line in `public/robots.txt`.
2. **Your details** — open `src/config.ts` and set your photo, Instagram, email and bio.
   Put your photo in `public/` (for example `public/kiran.jpg`) and set `photo: '/kiran.jpg'`.
3. **Replace the sample essays** — the six files in `src/content/essays/` are samples.
   Delete them (or add `draft: true` at the top of a file to hide it) and add your own.

## Writing a new essay

Create a new file in `src/content/essays/`, for example `my-first-essay.md`.
The file name becomes the web address (`/essays/my-first-essay/`) — use English letters and hyphens.

```md
---
title: "लेखाचं शीर्षक"
description: "एका-दोन ओळींत लेखाचा सारांश."
pubDate: 2026-11-02
topic: chintan
---

इथे तुमचा लेख लिहा. नवीन परिच्छेदासाठी एक रिकामी ओळ सोडा.

## उपशीर्षक

**ठळक**, *तिरकस*, [दुवा](https://example.com), आणि > कोट वापरता येतात.
```

`topic` must be one of the slugs in `src/config.ts`: `chintan`, `nirikshan`, `athavani`, `shahar`, `lekhanpravas`.
To add a topic, add a line to `TOPICS` in `src/config.ts`.

Reading time and the Marathi date are worked out automatically.

## Putting it online (free)

### Option A — Cloudflare Workers (recommended)

The project already contains `wrangler.jsonc`, which tells Cloudflare to serve the `dist/` folder.

1. Create a free account at cloudflare.com and a free GitHub account.
2. Upload this project to a new GitHub repository.
3. In Cloudflare: **Workers & Pages → Create application → Import a repository** (Get started), pick your repository.
4. Build command `npm run build`, deploy command `npx wrangler deploy`. The Worker name must match `name` in `wrangler.jsonc` (`jeewangane-blog`).
5. Click **Save and Deploy**. Every time you push a new essay to GitHub, the site updates by itself.
6. Custom domain: open the Worker → **Settings → Domains & Routes → Add → Custom Domain**.

### Option B — Netlify

Same idea: **Add new site → Import from Git**, build command `npm run build`, publish directory `dist`.

## Using your GoDaddy domain

Your domain can stay registered at GoDaddy. You only tell it where your site lives.

**Easiest: move DNS to Cloudflare (free)**

1. In Cloudflare choose **Add a domain** and enter your domain. Pick the free plan.
2. Cloudflare shows two nameservers. In GoDaddy open **My Products → your domain → DNS → Nameservers → Change**,
   choose **I'll use my own nameservers**, and paste the two Cloudflare ones.
3. In your Worker open **Settings → Domains & Routes → Add → Custom Domain**, enter your domain, and confirm.
   Cloudflare adds the needed records for you. It can take from a few minutes up to a few hours.

**Or keep DNS at GoDaddy**

In your host (Cloudflare Pages / Netlify) add your custom domain, then copy the records it shows into
GoDaddy's **DNS → Add New Record**. Typically a `CNAME` for `www`, and `A` records (or an `ALIAS`) for the plain domain.
GoDaddy cannot put a CNAME on the plain domain, which is why hosts also give A records.

Check the host's own instructions, because the exact values are specific to your project.

## Changing the look

All colours are at the top of `src/styles/global.css`:

```css
--accent: #ecbdca;  /* rose */
--butter: #ecddbb;  /* butter yellow */
--mint:   #c6e1d9;  /* mint */
```

Fonts are Poppins and Hind (both include Devanagari) loaded from Google Fonts in `src/layouts/Base.astro`.
