# Contributing to ScrambleType

Thanks for your interest! Issues, bug reports and PRs are all welcome.

## Development setup

```bash
git clone https://github.com/abitfox/scramble-type.git && cd scramble-type
npm install
npm test          # vitest, 48 tests
npm run dev       # playground at http://localhost:5173
npm run build     # tsup, five entries + dts
npm run lint      # eslint
npm run typecheck # tsc --noEmit
npm run size      # size-limit budget guard
```

## Workflow

1. Open an issue first for anything that changes the public API — we keep the surface small on purpose.
2. Branch from `main`, keep changes focused.
3. Add or update tests for behavior changes. The core engine's timing tests use `vi.useFakeTimers()`; keep randomness contained in `makeSettlePlan` / `pickGlyph` so tests can seed it.
4. Run `npm run lint && npm run typecheck && npm test` before pushing.
5. For a release, add a changeset: `npx changeset` and commit the generated file. Releases are automated via Changesets + GitHub Actions.

## Project layout

```
src/core/    framework-agnostic engine (no DOM, no imports)
src/react/   React adapter (default entry, "use client")
src/vue/     Vue 3 adapter
src/wc/      Web Component (+ global IIFE entry for CDN)
src/sound/   optional WebAudio typing-tick plugin
test/        vitest suites per entry
playground/  interactive demos (React app + plain HTML)
docs-site/   VitePress documentation
```

## Conventions

- TypeScript strict mode; no runtime dependencies — ever.
- The core engine must stay DOM-free so it can run anywhere (SSR, tests, web workers).
- Behavior parity across adapters is a hard requirement: props/attributes with the same name must behave identically in React, Vue and the Web Component.
- Comments in Chinese or English are both fine; keep API docs in English (README) with the Chinese mirror updated alongside.

## License

By contributing you agree that your contributions are licensed under the [MIT License](./LICENSE).
