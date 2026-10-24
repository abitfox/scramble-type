# API Reference

## `<ScrambleText />` (React / Vue — same names, same defaults)

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
| `layout` | `"underlay" \| "nbsp" \| "none"` | `"underlay"` | Width-stability strategy |
| `respectReducedMotion` | `boolean` | `true` | Render final text when `prefers-reduced-motion: reduce` |
| `sound` | `boolean` | `false` | Play the built-in synthesized typing tick |
| `className` / `style` / `as` | — | `"span"` | Host element passthrough (`as` sets the tag, Vue uses `tag`) |
| `onTick` | `() => void` | — | Fired every animation frame |
| `onDone` | `() => void` | — | Fired once when decoding completes |

Vue events: `@done`, `@tick`. Ref methods (React `ref`, Vue `expose`): `replay()`, `skip()`.

### Layout strategies

- **`underlay`** *(default)* — the real text is rendered invisible underneath; the animated layer is absolutely positioned on top. Zero width shift in any font, including CJK in proportional fonts. Adds one extra child element.
- **`nbsp`** — an equal-length NBSP placeholder. Lightest option; ideal for monospace fonts.
- **`none`** — no placeholder; width starts at 0 and grows as characters appear.

### Animation timing model

Each character `i` settles at frame `i + lo + random(hi - lo + 1)` where `[lo, hi] = churn`. The effective interval is clamped so that the total duration stays under `maxDuration`:

```
effSpeed = max(4, min(speed, ceil(maxDuration / charCount)))
```

Empty text, `maxChars <= 0`, and text longer than `maxChars` render statically and call `onDone` immediately.

## `scramble-type/core`

```ts
createScramble(handlers: ScrambleHandlers, defaults?: ScrambleOptions): ScrambleHandle

interface ScrambleHandlers {
  onFrame(text: string, progress: number): void; // every frame incl. final
  onTick?(): void;                               // every non-final frame
  onDone?(): void;                               // once per start
}

interface ScrambleHandle {
  start(text: string, options?: ScrambleOptions): void;
  skip(): void;
  stop(): void;
  dispose(): void;
  readonly isDone: boolean;
}
```

Helpers: `resolveSpeed(charCount, speed?, maxDuration?)`, `makeSettlePlan(charCount, churn?)`, `pickGlyph(glyphs)`, `prefersReducedMotion()`, `DEFAULT_GLYPHS`.

## `scramble-type/sound`

```ts
createTickSound(options?: TickSoundOptions): () => void
unlockAudio(): void
```

| Option | Default | Description |
| --- | --- | --- |
| `volume` | `0.07` | Peak gain (0–1) |
| `throttleMs` | `40` | Minimum interval between ticks |
| `jitter` | `0.06` | Playback-rate randomization, avoids a machine-gun feel |
| `freq` | `4000` | Bandpass center frequency (Hz) |
| `dur` | `0.02` | Tick duration (seconds) |

## `<scramble-text>` (Web Component)

| Attribute | Example |
| --- | --- |
| `text` | `text="ACCESS GRANTED"` |
| `speed` / `delay` / `max-chars` / `max-duration` | `speed="24"` |
| `churn` | `churn="3,8"` |
| `glyphs` | `glyphs="ABCDEF#%"` |
| `active` / `sound` | `active="false"` |

Events: `scramble-tick`, `scramble-done` (bubbling).
Methods: `replay()`, `skip()`.
Parts for styling: `underlay`, `text`.
