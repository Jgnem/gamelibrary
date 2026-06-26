# Game Library

A minimal, Vercel-ready browser game library built with Vite + React + TypeScript.

## Local development

```bash
npm install
npm run dev
```

## Adding a game

See the `/admin` route in the running app for step-by-step instructions.

The short version:

1. Drop the game folder into `public/games/[slug]/` (needs an `index.html`)
2. Add a thumbnail at `public/thumbnails/[slug].png`
3. Register the game in `src/data/games.ts`
4. Push to GitHub → Vercel redeploys automatically

## Deployment

Connect this repo to Vercel with:

- **Build command:** `npm run build`
- **Output directory:** `dist`

The included `vercel.json` handles client-side routing so `/play/[slug]` refreshes
work while still serving game files and thumbnails from `/public` unchanged.
