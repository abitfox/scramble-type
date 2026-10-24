# Playground

Two runnable demos live in the repository's `playground/` directory:

```bash
npm install
npm run dev
# http://localhost:5173/       → React playground with live prop controls
# http://localhost:5173/plain.html → Web Component demo for plain HTML
```

The React playground lets you tune `text`, `glyphs`, `speed`, `delay`, `churn`, `maxChars`, `layout` and `sound` live, and demonstrates `replay()` / `skip()` plus an `active`-gated boot sequence with multi-line stagger.

::: tip Deployment
Deploy `playground/` (static build via `npx vite build`) to GitHub Pages or Vercel and link it here.
:::
