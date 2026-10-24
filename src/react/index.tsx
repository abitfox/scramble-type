"use client";

/**
 * ScrambleText —— React 适配层（默认入口）。
 *
 * import { ScrambleText } from "scramble-type";
 * <ScrambleText text="ACCESS GRANTED" speed={24} />
 *
 * 与源项目（20_HackerEnglish scramble-text.tsx）的 props 完全兼容：
 * text / delay / speed / churn / sound / className / active 全部同名同语义。
 * 差异：sound 不再依赖站点音效引擎，改用内置合成音；默认布局改为 underlay（任意字体零跳动）。
 */

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ElementType,
} from "react";
import {
  createScramble,
  DEFAULT_GLYPHS,
  prefersReducedMotion,
  type ScrambleOptions,
} from "../core";
import { createTickSound, unlockAudio } from "../sound";

const NBSP = "\u00A0";

export type ScrambleLayout = "underlay" | "nbsp" | "none";

export interface ScrambleTextRef {
  /** 重新播放当前文本 */
  replay(): void;
  /** 立即落定为最终文本 */
  skip(): void;
}

export interface ScrambleTextProps extends ScrambleOptions {
  text: string;
  /** false 时不启动动画：渲染动画前的占位状态（空白但保留宽度），用于开机序列等阶段门控 */
  active?: boolean;
  /**
   * 宽度稳定策略，默认 "underlay"：
   * - underlay：隐藏的真实文本打底 + 绝对定位乱码层覆盖，任意字体（含中文/比例字体）零跳动
   * - nbsp：等量 NBSP 占位（源实现行为，最轻量，适合等宽字体）
   * - none：不占位
   */
  layout?: ScrambleLayout;
  /** 尊重 prefers-reduced-motion（为 true 时直接渲染最终文本），默认 true */
  respectReducedMotion?: boolean;
  /** 宿主标签，默认 "span" */
  as?: ElementType;
  className?: string;
  style?: CSSProperties;
  /** 解码期间播放内置合成打字音（可用 onTick 接自己的音效） */
  sound?: boolean;
  onTick?: () => void;
  onDone?: () => void;
}

const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

export const ScrambleText = forwardRef<ScrambleTextRef, ScrambleTextProps>(
  function ScrambleText(props, ref) {
    const {
      text,
      active = true,
      layout = "underlay",
      respectReducedMotion = true,
      as,
      className,
      style,
      sound = false,
      onTick,
      onDone,
      speed,
      delay,
      churn,
      glyphs,
      maxChars,
      maxDuration,
    } = props;

    const chars = useMemo(() => Array.from(text), [text]);
    // 空文本不算 longText（交给 core 的 finish() 统一触发 onDone）
    const longText =
      maxChars !== undefined ? maxChars <= 0 || chars.length > maxChars : chars.length > 200;
    const [out, setOut] = useState<string>(() =>
      longText ? text : NBSP.repeat(chars.length),
    );

    // 回调经 ref 转接，避免 effect 因回调身份变化重启动画
    const churnRef = useRef(churn);
    churnRef.current = churn;
    const soundRef = useRef(sound);
    soundRef.current = sound;
    const onTickRef = useRef(onTick);
    onTickRef.current = onTick;
    const onDoneRef = useRef(onDone);
    onDoneRef.current = onDone;
    const textRef = useRef(text);
    textRef.current = text;
    const engineRef = useRef<ReturnType<typeof createScramble> | null>(null);
    const tickRef = useRef<(() => void) | null>(null);

    useImperativeHandle(
      ref,
      () => ({
        replay() {
          engineRef.current?.start(textRef.current);
        },
        skip() {
          engineRef.current?.skip();
        },
      }),
      [],
    );

    // sound=true 时提前解锁 AudioContext（浏览器自动播放策略）
    useEffect(() => {
      if (sound) unlockAudio();
    }, [sound]);

    useIsomorphicLayoutEffect(() => {
      if (longText) {
        setOut(text);
        return;
      }
      if (!active) return;
      if (respectReducedMotion && prefersReducedMotion()) {
        setOut(text);
        onDoneRef.current?.();
        return;
      }
      const engine = createScramble(
        {
          onFrame: (s) => setOut(s),
          onTick: () => {
            onTickRef.current?.();
            if (soundRef.current) {
              tickRef.current ??= createTickSound();
              tickRef.current();
            }
          },
          onDone: () => onDoneRef.current?.(),
        },
        { speed, delay, churn: churnRef.current, glyphs, maxChars, maxDuration },
      );
      engineRef.current = engine;
      engine.start(text);
      return () => {
        engineRef.current = null;
        engine.dispose();
      };
      // churn 以 join 后的字符串参与依赖（数组身份每渲染都变）
    }, [
      text,
      active,
      longText,
      respectReducedMotion,
      speed,
      delay,
      churn ? churn.join(",") : "",
      glyphs ?? DEFAULT_GLYPHS,
      maxChars,
      maxDuration,
    ]);

    const Host = (as ?? "span") as ElementType;
    if (layout === "underlay") {
      return (
        <Host
          className={className}
          style={{ position: "relative", ...(as === undefined || as === "span" ? { display: "inline-block" } : {}), ...style }}
          aria-label={text}
        >
          <span style={{ visibility: "hidden" }}>{text}</span>
          <span aria-hidden="true" style={{ position: "absolute", inset: 0 }}>
            {out}
          </span>
        </Host>
      );
    }
    return (
      <Host className={className} style={style} aria-label={text}>
        <span aria-hidden="true">{out}</span>
      </Host>
    );
  },
);
