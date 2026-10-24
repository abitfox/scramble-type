---
layout: home

hero:
  name: ScrambleType
  text: The scramble/decode typewriter effect.
  tagline: Zero dependencies · React · Vue · Web Component · plain HTML. Zero layout shift, SSR-safe, accessible, optional typing sound.
  actions:
    - theme: brand
      text: Get Started
      link: /guide/getting-started
    - theme: alt
      text: API Reference
      link: /guide/api
    - theme: alt
      text: Playground
      link: /guide/playground

features:
  - icon: ⚡
    title: Zero dependencies
    details: ~0.7 kB core engine, <2 kB React entry (brotli). No polyfills, no audio assets.
  - icon: 🧩
    title: Every stack, one package
    details: React (default), Vue 3, Web Component for any HTML page, and a framework-agnostic core engine — same props, same behavior.
  - icon: 📐
    title: Zero layout shift
    details: The underlay layout keeps width stable in any font — including CJK in proportional fonts.
  - icon: ♿
    title: Accessible & SSR-safe
    details: Screen readers read the final text once; prefers-reduced-motion renders statically; server renders the final string.
  - icon: 🎮
    title: Controllable
    details: onDone / onTick callbacks, replay() and skip() via ref, multi-line stagger with delay.
  - icon: 🔊
    title: Optional typing sound
    details: A synthesized WebAudio tick — no samples, no config files, fully tree-shakeable.
---
