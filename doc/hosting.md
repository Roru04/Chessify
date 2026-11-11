# Hosting

The app is a **static site**: `npm run build` produces plain HTML, JS, CSS and
the Stockfish `.wasm` file in `dist/`. The engine runs in the visitor's
browser, so no server is needed. Any free static host works.

## Current deployment: GitHub Pages

Live at **https://roru04.github.io/Chessify/** (since 2026-11-11).

- Repository `Roru04/Chessify` is public; Settings → Pages → Source:
  "GitHub Actions".
- `.github/workflows/deploy.yml` runs on every push to `main` (or manually
  from the Actions tab): `npm ci`, `npm run build` (copies Stockfish,
  type-checks, builds) and publishes `dist/`.
- No extra account needed. The app uses relative paths and the
  single-threaded Stockfish build, so it works under `/Chessify/` without
  special server headers. Multi-threaded Stockfish would need COOP/COEP
  headers, which GitHub Pages can't send (see below).

## Options

| Host | Free tier | Custom response headers | Notes |
|------|-----------|-------------------------|-------|
| **Cloudflare Pages** (recommended) | Unlimited bandwidth, 500 builds/month | Yes, via a `_headers` file | Auto-deploys on every push to GitHub |
| Netlify | 100 GB bandwidth/month | Yes, via `_headers` or `netlify.toml` | Very similar to Cloudflare Pages |
| Vercel | Hobby plan, non-commercial use only | Yes, via `vercel.json` | Fine for personal projects |
| GitHub Pages | Free for public repos | **No** | Simplest option, but can't use multi-threaded Stockfish later |
| Railway | No permanent free tier (trial credit, then paid) | Yes | Made for servers and databases, which this app doesn't need. Not recommended. |

### Why custom headers matter

Version 1 uses the single-threaded Stockfish build, which runs on any host.
The faster multi-threaded build (roadmap phase 4) needs two response headers
so the browser enables `SharedArrayBuffer`:

```
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Embedder-Policy: require-corp
```

Cloudflare Pages, Netlify and Vercel can set them. GitHub Pages cannot.

## Recommended setup: Cloudflare Pages

1. Push the project to a GitHub repository.
2. In the Cloudflare dashboard: **Workers & Pages → Create → Pages →
   Connect to Git**, and pick the repository.
3. Build settings:
   - Framework preset: **Vite**
   - Build command: `npm run build`
   - Output directory: `dist`
4. Deploy. The app is available at `https://<project>.pages.dev`; every push
   to `main` redeploys it automatically, and pull requests get preview URLs.
5. Optional: add your own domain under **Custom domains**.

For multi-threaded Stockfish later, add `public/_headers`:

```
/*
  Cross-Origin-Opener-Policy: same-origin
  Cross-Origin-Embedder-Policy: require-corp
```

## Size and caching

- The Stockfish lite WASM file is roughly 7 MB. Hosts serve it compressed and
  browsers cache it after the first visit.
- Cloudflare Pages has a 25 MB limit per file. The full Stockfish build with
  the large neural network is bigger than that, which is one reason version 1
  uses the lite build.

## Installable app (optional, later)

With a web app manifest and a service worker, the site can be "added to the
home screen" on phones and work offline. The engine already runs locally, so
offline play would work fully.
