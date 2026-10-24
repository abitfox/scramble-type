/**
 * ScrambleType sound —— 可选的打字音插件。
 *
 * WebAudio 纯合成（短噪声脉冲 + 带通滤波），无采样文件、无配置拉取，
 * 与任何站点级音效引擎解耦。典型用法：
 *
 *   import { createTickSound } from "scramble-type/sound";
 *   <ScrambleText text="ACCESS GRANTED" onTick={createTickSound()} />
 *
 * 自动播放策略：AudioContext 首次创建后可能处于 suspended 状态。
 * createTickSound() 会自动安装一次性的用户手势监听（pointerdown / keydown）
 * 提前解锁上下文；解锁前触发打字音时静默跳过，解锁后自动恢复出声。
 */

interface AudioContextWindow extends Window {
  webkitAudioContext?: typeof AudioContext;
}

let ctx: AudioContext | null = null;
let noiseBuffer: AudioBuffer | null = null;
let unlockInstalled = false;

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  try {
    const AC = window.AudioContext ?? (window as AudioContextWindow).webkitAudioContext;
    if (!AC) return null;
    if (!ctx) ctx = new AC();
    return ctx;
  } catch {
    return null;
  }
}

/** 尽早解锁音频上下文（在任意用户手势里调用最保险；插件内部也会自动安装一次性手势监听） */
export function unlockAudio(): void {
  const c = getCtx();
  if (!c) return;
  try {
    void c.resume();
  } catch {
    /* 忽略 */
  }
  if (unlockInstalled) return;
  unlockInstalled = true;
  const unlock = () => {
    try {
      void c.resume();
    } catch {
      /* 忽略 */
    }
  };
  window.addEventListener("pointerdown", unlock, { once: true, capture: true });
  window.addEventListener("keydown", unlock, { once: true, capture: true });
}

export interface TickSoundOptions {
  /** 峰值音量（0-1）；默认 0.07 */
  volume?: number;
  /** 两次触发的最小间隔（ms）；默认 40 */
  throttleMs?: number;
  /** 播放速率随机抖动幅度（0-1），连发时避免"机关枪"感；默认 0.06 */
  jitter?: number;
  /** 带通滤波中心频率（Hz）；默认 4000 */
  freq?: number;
  /** 单击时长（秒）；默认 0.02 */
  dur?: number;
}

/** 创建打字单音函数：返回值可直接作为 ScrambleText 的 onTick */
export function createTickSound(options: TickSoundOptions = {}): () => void {
  const volume = options.volume ?? 0.07;
  const throttleMs = options.throttleMs ?? 40;
  const jitter = options.jitter ?? 0.06;
  const freq = options.freq ?? 4000;
  const dur = options.dur ?? 0.02;
  let last = -Infinity;
  unlockAudio();
  return () => {
    const c = getCtx();
    if (!c || c.state !== "running") return;
    const now = c.currentTime;
    if (now - last < throttleMs / 1000) return;
    last = now;

    if (!noiseBuffer || noiseBuffer.sampleRate !== c.sampleRate) {
      const len = Math.ceil(c.sampleRate * 0.03);
      noiseBuffer = c.createBuffer(1, len, c.sampleRate);
      const data = noiseBuffer.getChannelData(0);
      for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    }
    const t0 = now;
    const src = c.createBufferSource();
    src.buffer = noiseBuffer;
    src.playbackRate.value = 1 + (Math.random() * 2 - 1) * jitter;
    const filter = c.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.value = freq;
    filter.Q.value = 2;
    const gain = c.createGain();
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(Math.max(volume, 0.0002), t0 + 0.002);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    src.connect(filter).connect(gain).connect(c.destination);
    src.start(t0);
    src.stop(t0 + dur + 0.02);
  };
}
