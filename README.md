<div align="center">

# ScrambleType

**A zero-dependency scramble/decode typewriter text effect for React, Vue and plain HTML.**

`npm install scramble-type`

[![npm version](https://img.shields.io/npm/v/scramble-type)](https://www.npmjs.com/package/scramble-type)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)
[![CI](https://github.com/abitfox/scramble-type/actions/workflows/ci.yml/badge.svg)](./.github/workflows/ci.yml)
[![gzip size](https://img.shields.io/badge/gzip-%3C2%20kB-brightgreen)](./package.json)

[中文文档](./README.zh-CN.md)

</div>

---

Text resolves from left to right, and every character jitters through random glyphs before it locks in — a "decoding wave" with real texture, made for terminal / hacker / sci-fi UIs.

<div align="center">
  <img src="assets/demo.gif" alt="ScrambleType decode animation" width="720" />
</div>

```tsx
import { ScrambleText } from "scramble-type";

<ScrambleText text="ACCESS GRANTED" speed={24} />;
```

## Features

- **Zero runtime dependencies** — React entry is under 2 kB brotli, core engine is ~0.7 kB.
- **One package, every stack** — React (default), Vue 3, Web Component, and a framework-agnostic core engine.
- **Zero layout shift** — the default `underlay` layout keeps width stable in *any* font, including proportional and CJK fonts.
- **SSR-safe & accessible** — renders final text on the server, reads as one string to screen readers (`aria-label`), and respects `prefers-reduced-motion`.
- **Controllable** — `onDone` / `onTick` callbacks, `replay()` / `skip()` via ref, stagger multi-line with `delay`.
- **Optional typing sound** — a synthesized WebAudio tick with no audio assets and no config files.
- **Typed** — full TypeScript definitions shipped.

## Screenshots

| React playground (live prop controls) | Plain HTML · Web Component |
| --- | --- |
| ![React playground](assets/playground.png) | ![Plain HTML Web Component](assets/plain-html.png) |

## Install

```bash
npm install scramble-type   # or pnpm / yarn / bun add
```

Pick the entry for your stack:

| Stack | Import |
| --- | --- |
| React / Next.js / Remix | `import { ScrambleText } from "scramble-type"` |
| Vue 3 / Nuxt | `import { ScrambleText } from "scramble-type/vue"` |
| Any framework / custom | `import { createScramble } from "scramble-type/core"` |
| Web Component | `import "scramble-type/wc"` |
| Plain HTML via CDN | `<script src="https://cdn.jsdelivr.net/npm/scramble-type/dist/wc/global.js"></script>` |
| Typing sound (optional) | `import { createTickSound } from "scramble-type/sound"` |

### React

```tsx
import { ScrambleText } from "scramble-type";

// A title
<ScrambleText text="ACCESS GRANTED" speed={24} onDone={() => console.log("done")} />

// Multi-line stagger
{lines.map((line, i) => (
  <ScrambleText key={line} text={line} delay={i * 150} speed={20} />
))}

// Gating (renders a blank placeholder until active)
<ScrambleText text="BOOTING…" active={stage >= 2} />

// Imperative control
const ref = useRef<ScrambleTextRef>(null);
<ScrambleText ref={ref} text="REPLAY ME" />;
ref.current?.replay();
ref.current?.skip();
```

### Vue 3

```vue
<script setup>
import { ScrambleText } from "scramble-type/vue";
</script>

<template>
  <ScrambleText text="ACCESS GRANTED" :speed="24" @done="onDone" />
</template>
```

### Plain HTML (no build step)

```html
<script src="https://cdn.jsdelivr.net/npm/scramble-type/dist/wc/global.js"></script>

<scramble-text text="ACCESS GRANTED" speed="24"></scramble-text>
<scramble-text text="中文解码 · 零布局跳动" speed="22" delay="400"></scramble-text>

<script>
  document.querySelector("scramble-text").addEventListener("scramble-done", () => {
    console.log("decoded!");
  });
</script>
```

### Framework-agnostic core

```ts
import { createScramble } from "scramble-type/core";

const handle = createScramble({
  onFrame: (text) => (el.textContent = text),
  onTick: () => tickSound(),
  onDone: () => console.log("decoded"),
});
handle.start("ACCESS GRANTED", { speed: 24, churn: [3, 8] });
```

### Optional typing sound

```tsx
import { ScrambleText } from "scramble-type";
import { createTickSound } from "scramble-type/sound";

// Bring your own audio pipeline…
<ScrambleText text="…" onTick={createTickSound({ volume: 0.07 })} />

// …or use the shorthand (built-in synthesized tick)
<ScrambleText text="…" sound />
```

## API

### `<ScrambleText />` (React / Vue, same names and defaults)

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `text` | `string` | — | Target text (required) |
| `speed` | `number` | `34` | Interval per tick, ms. Smaller = faster |
| `delay` | `number` | `0` | Start delay, ms. Use for multi-line stagger |
| `churn` | `[number, number]` | `[3, 8]` | Range of jitter frames per character before it settles |
| `glyphs` | `string` | `"!<>-_\\/[]{}=+*^?#%&@$01"` | Scramble glyph pool |
| `maxChars` | `number` | `200` | Above this length the text renders statically; `0` disables animation |
| `maxDuration` | `number` | `1600` | Adaptive speed-up cap: total decode time ceiling (ms) for medium/long text |
| `active` | `boolean` | `true` | `false` renders the pre-animation placeholder (blank, width reserved) |
| `layout` | `"underlay" \| "nbsp" \| "none"` | `"underlay"` | Width-stability strategy (see below) |
| `respectReducedMotion` | `boolean` | `true` | Render final text when `prefers-reduced-motion: reduce` |
| `sound` | `boolean` | `false` | Play the built-in synthesized typing tick |
| `className` / `style` / `as` | — | `"span"` | Host element passthrough (`as` sets the tag) |
| `onTick` | `() => void` | — | Fired every animation frame |
| `onDone` | `() => void` | — | Fired once when decoding completes |

**Layout strategies**

- `underlay` *(default)* — the real text is rendered invisible underneath, the animated layer is absolutely positioned on top. Zero width shift in any font, including CJK in proportional fonts.
- `nbsp` — NBSP placeholder (lightest; ideal for monospace fonts).
- `none` — no placeholder.

**Ref methods** (React `ref` / Vue `expose`): `replay()`, `skip()`.

### `scramble-type/core`

```ts
createScramble(handlers, defaults?) → ScrambleHandle
handle.start(text, options?)  // restart with new text
handle.skip()                 // snap to final text
handle.stop()                 // freeze on the current frame
handle.dispose()              // release timers
handle.isDone                 // boolean
resolveSpeed(charCount, speed?, maxDuration?)  // the adaptive-speed rule, exported for reuse
prefersReducedMotion()        // SSR-safe media query helper
```

### `<scramble-text>` (Web Component)

| Attribute | Example | Description |
| --- | --- | --- |
| `text` | `text="ACCESS GRANTED"` | Target text |
| `speed` / `delay` / `max-chars` / `max-duration` | `speed="24"` | Numbers as strings |
| `churn` | `churn="3,8"` | Two numbers, comma separated |
| `glyphs` | `glyphs="ABCDEF#%"` | Glyph pool |
| `active` / `sound` | `active="false"` | `"true"` / `"false"` |

Events: `scramble-tick`, `scramble-done` (bubbling). Methods: `replay()`, `skip()`.

## Notes & limitations

- **SSR** — the server renders the final text; the animation starts after hydration (no flash, no hydration mismatch). The React entry carries a `"use client"` directive for Next.js App Router.
- **Accessibility** — the host element carries `aria-label={text}` while the animated layer is `aria-hidden`, so screen readers read the final string once. With `prefers-reduced-motion: reduce` the text renders statically by default.
- **CJK** — fully supported; the `underlay` layout keeps width stable even in proportional fonts.
- **Emoji / ZWJ sequences** — combined emoji may be split into scrambled chunks (chars are iterated with `Array.from`, i.e. per code point). Keep such text out of scope or render it statically (`maxChars={0}`).
- **Background tabs** — browsers throttle `setInterval`; the animation pauses and resumes correctly, the final state is always exact.
- **Browsers** — evergreen browsers (ES2020). No polyfills shipped.

## Origin

ScrambleType was born inside the HackerEnglish project. See the decode effect
live at [www.hackerenglish.com](https://www.hackerenglish.com).

## License

[MIT](./LICENSE) © ScrambleType Authors

This project is released under the **MIT License** — free for commercial and personal use, modification and redistribution. The only requirement is keeping the copyright notice. MIT is the de-facto standard for JavaScript UI libraries; it maximizes adoption (also for closed-source products) while remaining compatible with nearly every other license. If you need a patent grant for legal reasons, open an issue — an Apache-2.0 dual listing can be considered.
