/**
 * ScrambleType core —— 框架无关的乱码解码打字机引擎。
 *
 * 算法（源自 20_HackerEnglish 线上验证实现）：
 * 1. 预生成每个字符的"落定帧" settle[i] = i + lo + random(hi..lo)
 *    → 整体从左到右推进，个体叠加 churn 区间内的随机抖动，形成解码波
 * 2. setInterval 按 speed(ms) 逐帧重绘：已到落定帧的位输出真实字符，否则随机乱码
 * 3. 超过 maxFrame 输出完整文本并停表
 *
 * 内置策略：
 * - 自适应提速：中长文本总解码时长封顶 maxDuration（默认 1600ms），短文本不受影响
 * - 超长直出：字符数超过 maxChars（默认 200）时不播动画，直接输出最终文本
 * - Array.from 逐字符处理，CJK 安全（emoji ZWJ 组合序列会被拆散，见 README 局限说明）
 *
 * 纯逻辑、零 DOM 依赖：可在 Node / SSR 环境安全创建（不会触碰 window/document）。
 */

/** 默认乱码字符池 */
export const DEFAULT_GLYPHS = "!<>-_\\/[]{}=+*^?#%&@$01";

/** 速度下限（ms/帧），防止长文本参数异常导致渲染风暴 */
const MIN_SPEED = 4;
const DEFAULT_SPEED = 34;
const DEFAULT_CHURN: readonly [number, number] = [3, 8];
const DEFAULT_MAX_CHARS = 200;
const DEFAULT_MAX_DURATION = 1600;

export type ChurnRange = [number, number];

export interface ScrambleOptions {
  /** 每 tick 间隔（ms），越小节奏越快；默认 34 */
  speed?: number;
  /** 每个字符落定前额外乱码跳动的帧数区间；默认 [3, 8] */
  churn?: ChurnRange;
  /** 启动延迟（ms），用于多行错峰节奏；默认 0 */
  delay?: number;
  /** 乱码字符池；默认 DEFAULT_GLYPHS */
  glyphs?: string;
  /** 超长直出阈值：字符数超过该值（或传 <=0 关闭动画）时静态输出；默认 200 */
  maxChars?: number;
  /** 自适应提速的总解码时长上限（ms）；默认 1600 */
  maxDuration?: number;
}

export interface ScrambleHandlers {
  /** 每帧回调（含乱码中间帧与最终帧）。progress ∈ [0,1] */
  onFrame: (text: string, progress: number) => void;
  /** 每帧回调（用于打字音等副作用；节流由使用方负责，可接 scramble-type/sound） */
  onTick?: () => void;
  /** 解码完成回调（start/skip 直达最终帧时同样触发，且每次 start 最多一次） */
  onDone?: () => void;
}

export interface ScrambleHandle {
  /** 开始/重新开始一段文本的解码动画 */
  start(text: string, options?: ScrambleOptions): void;
  /** 立即落定为最终文本（触发 onFrame 最终帧 + onDone） */
  skip(): void;
  /** 停止动画，停留在当前帧 */
  stop(): void;
  /** 停止动画并释放定时器；之后不可再 start */
  dispose(): void;
  readonly isDone: boolean;
}

/** 计算实际帧间隔：短文本按 speed 走；中长文本提速，总时长封顶 maxDuration */
export function resolveSpeed(
  charCount: number,
  speed: number = DEFAULT_SPEED,
  maxDuration: number = DEFAULT_MAX_DURATION,
): number {
  const s = Number.isFinite(speed) && speed > 0 ? speed : DEFAULT_SPEED;
  const capped = Math.max(1, charCount);
  return Math.max(MIN_SPEED, Math.min(s, Math.ceil(maxDuration / capped)));
}

function normalizeChurn(churn: ChurnRange | undefined): [number, number] {
  if (
    !Array.isArray(churn) ||
    churn.length !== 2 ||
    !Number.isFinite(churn[0]) ||
    !Number.isFinite(churn[1])
  ) {
    return [DEFAULT_CHURN[0], DEFAULT_CHURN[1]];
  }
  const [a, b] = churn as [number, number];
  return a <= b ? [a, b] : [b, a];
}

/** 预生成落定帧计划（随机性集中在此，便于测试注入种子） */
export function makeSettlePlan(charCount: number, churn?: ChurnRange): number[] {
  const [lo, hi] = normalizeChurn(churn);
  const plan = new Array<number>(charCount);
  for (let i = 0; i < charCount; i++) {
    plan[i] = i + lo + Math.floor(Math.random() * (hi - lo + 1));
  }
  return plan;
}

export function pickGlyph(glyphs: string): string {
  return glyphs[(Math.random() * glyphs.length) | 0];
}

/** 尊重系统"减弱动态效果"设置；非浏览器环境恒为 false */
export function prefersReducedMotion(): boolean {
  try {
    return (
      typeof window !== "undefined" &&
      !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
    );
  } catch {
    return false;
  }
}

export function createScramble(
  handlers: ScrambleHandlers,
  defaults: ScrambleOptions = {},
): ScrambleHandle {
  let currentText = "";
  let chars: string[] = [];
  let plan: number[] = [];
  let maxFrame = 0;
  let frame = 0;
  let speed = DEFAULT_SPEED;
  let glyphs = DEFAULT_GLYPHS;
  let maxChars = DEFAULT_MAX_CHARS;
  let done = true;
  let disposed = false;
  let delayTimer: ReturnType<typeof setTimeout> | null = null;
  let intervalTimer: ReturnType<typeof setInterval> | null = null;

  const clearTimers = () => {
    if (delayTimer !== null) {
      clearTimeout(delayTimer);
      delayTimer = null;
    }
    if (intervalTimer !== null) {
      clearInterval(intervalTimer);
      intervalTimer = null;
    }
  };

  const finish = () => {
    clearTimers();
    done = true;
    handlers.onFrame(currentText, 1);
    handlers.onDone?.();
  };

  const tick = () => {
    frame += 1;
    // frame === maxFrame 时所有 settle[i] 都已到达（settle[i] ≤ i+hi ≤ maxFrame），
    // 文本已完整显示，无需再跑一个空 tick
    if (frame >= maxFrame) {
      finish();
      return;
    }
    let s = "";
    for (let i = 0; i < chars.length; i++) {
      s += frame >= plan[i] ? chars[i] : pickGlyph(glyphs);
    }
    handlers.onFrame(s, maxFrame > 0 ? frame / maxFrame : 1);
    handlers.onTick?.();
  };

  const handle: ScrambleHandle = {
    start(text, options) {
      if (disposed) return;
      clearTimers();
      currentText = text;
      done = false;
      const o = { ...defaults, ...options };
      glyphs = o.glyphs && o.glyphs.length > 0 ? o.glyphs : DEFAULT_GLYPHS;
      maxChars = o.maxChars ?? DEFAULT_MAX_CHARS;
      chars = Array.from(text);
      const n = chars.length;
      // 空文本 / 显式关闭动画 / 超长文本：跳过动画直接出最终帧
      if (n === 0 || maxChars <= 0 || n > maxChars) {
        finish();
        return;
      }
      speed = resolveSpeed(n, o.speed, o.maxDuration);
      plan = makeSettlePlan(n, o.churn);
      maxFrame = plan.length > 0 ? Math.max(...plan) : 0;
      frame = 0;
      delayTimer = setTimeout(
        () => {
          delayTimer = null;
          intervalTimer = setInterval(tick, speed);
        },
        Math.max(0, o.delay ?? 0),
      );
    },
    skip() {
      if (disposed || done) return;
      finish();
    },
    stop() {
      if (disposed) return;
      clearTimers();
    },
    dispose() {
      disposed = true;
      clearTimers();
    },
    get isDone() {
      return done;
    },
  };
  return handle;
}
