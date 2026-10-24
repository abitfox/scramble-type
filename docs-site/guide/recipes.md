# Recipes

## Boot sequence with stage gating

Render blank placeholders that reserve space, then flip `active` per stage:

```tsx
<ScrambleText text="HACKER ENGLISH" active={stage >= 2} speed={22} />
<ScrambleText text="AGENT WORKSTATION ONLINE" active={stage >= 3} delay={300} />
```

## Terminal multi-line output

Stagger lines with `delay`; drop `delay` for lines that arrive later:

```tsx
{lines.map((line, i) =>
  line.bootDelay !== undefined ? (
    <ScrambleText key={line.id} text={line.text} delay={line.bootDelay} speed={22} />
  ) : (
    <ScrambleText key={line.id} text={line.text} speed={16} />
  ),
)}
```

## Chinese text without layout shift

The default `underlay` layout holds the final text's width, so CJK in proportional fonts never jitters:

```tsx
<ScrambleText text="特工工作站已接管" speed={22} />
```

If your page is fully monospace anyway, `layout="nbsp"` is slightly lighter.

## Sound with your own audio engine

`onTick` is the decoupling point — wire it to Howler, Tone.js or an in-house synth:

```tsx
<ScrambleText text="DECRYPTING" sound={false} onTick={myThrottledTick} />
```

Keep throttle ≥ 35 ms in your tick handler; the animation runs at 4–80 ms per frame.

## Long paragraphs

Above `maxChars` (default 200) the component renders statically to avoid a long, flickery decode. Raise it deliberately or animate per-paragraph:

```tsx
<ScrambleText text={paragraph} maxChars={600} maxDuration={2400} />
```

## Reduced motion

`respectReducedMotion` (default `true`) renders the final text when the user asked for less motion. Turn it off only when the animation itself carries meaning.

## Web Component with events

```html
<scramble-text id="t" text="SCRAMBLE-DONE EVENT" speed="28"></scramble-text>
<script>
  document.getElementById("t").addEventListener("scramble-done", () => {
    console.log("decoded at", Date.now());
  });
</script>
```
