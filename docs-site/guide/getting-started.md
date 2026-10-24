# Getting Started

## Install

```bash
npm install scramble-type
```

## React (default entry)

```tsx
import { ScrambleText } from "scramble-type";

export function Banner() {
  return <ScrambleText text="ACCESS GRANTED" speed={24} />;
}
```

Works out of the box with Next.js App Router (the entry carries `"use client"`), Remix, Gatsby and plain Vite apps.

### Common patterns

```tsx
// Multi-line stagger
{lines.map((line, i) => (
  <ScrambleText key={line} text={line} delay={i * 150} speed={20} />
))}

// Gating for boot sequences — renders a blank, width-reserved placeholder
<ScrambleText text="BOOTING…" active={stage >= 2} />

// Imperative control
const ref = useRef<ScrambleTextRef>(null);
<ScrambleText ref={ref} text="REPLAY ME" />;
ref.current?.replay();
ref.current?.skip();
```

## Vue 3

```vue
<script setup>
import { ScrambleText } from "scramble-type/vue";
</script>

<template>
  <ScrambleText text="ACCESS GRANTED" :speed="24" @done="onDone" />
</template>
```

## Plain HTML via CDN

```html
<script src="https://cdn.jsdelivr.net/npm/scramble-type/dist/wc/global.js"></script>

<scramble-text text="ACCESS GRANTED" speed="24"></scramble-text>
```

Or with a bundler:

```ts
import "scramble-type/wc";
```

## Framework-agnostic core

For Solid, Svelte, vanilla JS or custom wrappers:

```ts
import { createScramble } from "scramble-type/core";

const handle = createScramble({
  onFrame: (text) => (el.textContent = text),
  onDone: () => console.log("decoded"),
});
handle.start("ACCESS GRANTED", { speed: 24, churn: [3, 8] });
```

## Optional typing sound

```tsx
import { createTickSound } from "scramble-type/sound";

<ScrambleText text="…" onTick={createTickSound()} />
// shorthand:
<ScrambleText text="…" sound />
```

The tick is synthesized with WebAudio at runtime — no audio files are downloaded. Browsers require a user gesture before audio can play; the plugin installs a one-time gesture listener automatically and stays silent until unlocked.
