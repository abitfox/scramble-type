/**
 * ScrambleText —— Web Component 适配层。
 *
 * import "scramble-type/wc";        // 自动注册 <scramble-text>
 * <scramble-text text="ACCESS GRANTED" speed="24"></scramble-text>
 *
 * 属性：text / speed / delay / churn（如 "3,8"）/ glyphs / max-chars / active / sound
 * 事件：scramble-tick / scramble-done（冒泡）
 * 方法：skip() / replay()
 * 使用 Shadow DOM（open）：宿主字体颜色可穿透继承，内部结构不污染页面。
 * 导入本模块即注册元素（package.json 已将该入口标记为 side effect）。
 */

import {
  createScramble,
  DEFAULT_GLYPHS,
  prefersReducedMotion,
  type ScrambleHandle,
  type ScrambleOptions,
} from "../core";
import { createTickSound, unlockAudio } from "../sound";

const NBSP = "\u00A0";

function attrNum(el: Element, name: string, fallback: number): number {
  const raw = el.getAttribute(name);
  if (raw === null) return fallback;
  const v = Number(raw);
  return Number.isFinite(v) ? v : fallback;
}

function parseChurn(raw: string | null): [number, number] | undefined {
  if (!raw) return undefined;
  const parts = raw.split(",").map((s) => Number(s.trim()));
  if (parts.length !== 2 || !Number.isFinite(parts[0]) || !Number.isFinite(parts[1])) {
    return undefined;
  }
  return [parts[0], parts[1]];
}

export class ScrambleTextElement extends HTMLElement {
  static get observedAttributes(): string[] {
    return ["text", "speed", "delay", "churn", "glyphs", "max-chars", "active", "sound"];
  }

  private engine: ScrambleHandle | null = null;
  private tick: (() => void) | null = null;
  private underlayEl!: HTMLSpanElement;
  private overlayEl!: HTMLSpanElement;
  private connected = false;

  constructor() {
    super();
    const root = this.attachShadow({ mode: "open" });
    root.innerHTML =
      '<style>:host{position:relative;display:inline-block}</style>' +
      '<span id="underlay" part="underlay" aria-hidden="true" style="visibility:hidden"></span>' +
      '<span id="overlay" part="text" aria-hidden="true" style="position:absolute;inset:0"></span>';
    this.underlayEl = root.getElementById("underlay") as HTMLSpanElement;
    this.overlayEl = root.getElementById("overlay") as HTMLSpanElement;
  }

  connectedCallback(): void {
    this.connected = true;
    this.render();
  }

  disconnectedCallback(): void {
    this.connected = false;
    this.engine?.dispose();
    this.engine = null;
  }

  attributeChangedCallback(_name: string, oldValue: string | null, newValue: string | null): void {
    if (oldValue !== newValue && this.connected) this.render();
  }

  get text(): string {
    return this.getAttribute("text") ?? "";
  }
  set text(value: string) {
    this.setAttribute("text", value);
  }
  get active(): boolean {
    return this.getAttribute("active") !== "false";
  }
  set active(value: boolean) {
    this.setAttribute("active", String(value));
  }

  skip(): void {
    this.engine?.skip();
  }

  replay(): void {
    this.render();
  }

  /** 重新渲染/重启解码动画 */
  render(): void {
    this.engine?.dispose();
    this.engine = null;

    const text = this.text;
    const n = Array.from(text).length;
    // 屏幕阅读器只读最终文本；动画层 aria-hidden
    this.setAttribute("aria-label", text);
    this.underlayEl.textContent = text;

    if (!this.active) {
      // 阶段门控：空白占位（保留宽度），等待 active 翻真后动画
      this.overlayEl.textContent = NBSP.repeat(n);
      return;
    }

    const maxChars = attrNum(this, "max-chars", 200);
    const staticOut = n === 0 || maxChars <= 0 || n > maxChars;
    if (staticOut || prefersReducedMotion()) {
      this.overlayEl.textContent = text;
      return;
    }
    // 首帧前与 React 版一致：等量 NBSP 占位
    this.overlayEl.textContent = NBSP.repeat(n);

    const opts: ScrambleOptions = {
      speed: attrNum(this, "speed", 34),
      delay: attrNum(this, "delay", 0),
      churn: parseChurn(this.getAttribute("churn")),
      glyphs: this.getAttribute("glyphs") ?? DEFAULT_GLYPHS,
      maxChars,
      maxDuration: attrNum(this, "max-duration", 1600),
    };
    const sound = this.getAttribute("sound") === "true";
    if (sound) unlockAudio();

    this.engine = createScramble(
      {
        onFrame: (s) => {
          this.overlayEl.textContent = s;
        },
        onTick: () => {
          this.dispatchEvent(new CustomEvent("scramble-tick"));
          if (sound) {
            this.tick ??= createTickSound();
            this.tick();
          }
        },
        onDone: () => {
          this.dispatchEvent(new CustomEvent("scramble-done", { bubbles: true }));
        },
      },
      opts,
    );
    this.engine.start(text);
  }
}

/** 注册自定义元素（幂等，可换标签名；导入本模块时会以默认名自动注册） */
export function defineScrambleTextElement(tagName = "scramble-text"): void {
  if (typeof customElements === "undefined") return;
  if (customElements.get(tagName)) return;
  customElements.define(tagName, ScrambleTextElement);
}

defineScrambleTextElement();

declare global {
  interface HTMLElementTagNameMap {
    "scramble-text": ScrambleTextElement;
  }
}
