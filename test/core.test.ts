import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  createScramble,
  DEFAULT_GLYPHS,
  makeSettlePlan,
  resolveSpeed,
  type ScrambleHandle,
} from "../src/core";

beforeEach(() => {
  vi.useFakeTimers();
});
afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
});

describe("resolveSpeed", () => {
  it("短文本按原 speed 走", () => {
    expect(resolveSpeed(10, 34)).toBe(34);
  });
  it("中长文本提速，总时长封顶 maxDuration", () => {
    // 100 字符 @34 → ceil(1600/100)=16
    expect(resolveSpeed(100, 34)).toBe(16);
  });
  it("有速度下限 4ms", () => {
    expect(resolveSpeed(100000, 34)).toBe(4);
  });
  it("非法 speed 回落默认 34", () => {
    expect(resolveSpeed(10, NaN)).toBe(34);
    expect(resolveSpeed(10, -5)).toBe(34);
  });
});

describe("makeSettlePlan", () => {
  it("随机值为 0 时落在区间下界 settle[i] = i + lo", () => {
    vi.spyOn(Math, "random").mockReturnValue(0);
    expect(makeSettlePlan(4, [3, 8])).toEqual([3, 4, 5, 6]);
  });
  it("随机值接近 1 时落在区间上界 settle[i] = i + hi", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.9999);
    expect(makeSettlePlan(4, [3, 8])).toEqual([8, 9, 10, 11]);
  });
  it("乱序 churn 区间自动归一化", () => {
    vi.spyOn(Math, "random").mockReturnValue(0);
    expect(makeSettlePlan(2, [8, 3])).toEqual([3, 4]);
  });
});

describe("createScramble", () => {
  it("最终帧输出完整文本且 onDone 只触发一次", () => {
    const frames: string[] = [];
    const onDone = vi.fn();
    const h = createScramble({ onFrame: (s) => frames.push(s), onDone });
    h.start("AB", { churn: [1, 1] });
    vi.advanceTimersByTime(1000);
    expect(frames[frames.length - 1]).toBe("AB");
    expect(onDone).toHaveBeenCalledTimes(1);
  });

  it("字符从左到右依序落定（churn 固定时逐帧推进）", () => {
    const frames: string[] = [];
    const h = createScramble({ onFrame: (s) => frames.push(s) });
    h.start("AB", { churn: [1, 1], speed: 10 });
    vi.advanceTimersByTime(0); // delay=0 的 starter
    vi.advanceTimersByTime(10); // frame 1: settle=[1,2] → 第 1 位已落定
    expect(frames[0][0]).toBe("A");
    expect(DEFAULT_GLYPHS.includes(frames[0][1])).toBe(true); // 第 2 位仍是乱码
    vi.advanceTimersByTime(10); // frame 2 = maxFrame → 全部落定，直接收尾
    expect(frames[1]).toBe("AB");
  });

  it("中间帧只使用自定义字符池", () => {
    const frames: string[] = [];
    const h = createScramble({ onFrame: (s) => frames.push(s) });
    h.start("ABC", { churn: [5, 5], glyphs: "XY" });
    vi.advanceTimersByTime(1000);
    expect(frames[0]).toMatch(/^[XY]{3}$/);
    expect(frames[frames.length - 1]).toBe("ABC");
  });

  it("onTick 每个非最终帧触发一次", () => {
    const onTick = vi.fn();
    const h = createScramble({ onFrame: () => {}, onTick });
    h.start("AB", { churn: [1, 1], speed: 10 });
    vi.advanceTimersByTime(1000);
    // frame1（乱码帧）触发；frame2 为最终帧不触发
    expect(onTick).toHaveBeenCalledTimes(1);
  });

  it("delay 期间不产帧，延迟结束后才开始", () => {
    const onFrame = vi.fn();
    const h = createScramble({ onFrame });
    h.start("AB", { delay: 100, speed: 10 });
    vi.advanceTimersByTime(99);
    expect(onFrame).not.toHaveBeenCalled();
    vi.advanceTimersByTime(11); // t=110：starter(100) 已到点，首个 interval tick(110) 触发
    expect(onFrame).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(10); // t=120：第二帧（frame2 = maxFrame，收尾）
    expect(onFrame).toHaveBeenCalledTimes(2);
  });

  it("空文本立即输出最终帧并触发 onDone", () => {
    const onFrame = vi.fn();
    const onDone = vi.fn();
    const h = createScramble({ onFrame, onDone });
    h.start("");
    expect(onFrame).toHaveBeenCalledWith("", 1);
    expect(onDone).toHaveBeenCalledTimes(1);
  });

  it("超过 maxChars 静态直出", () => {
    const onFrame = vi.fn();
    const h = createScramble({ onFrame });
    h.start("x".repeat(201));
    expect(onFrame).toHaveBeenCalledTimes(1);
    expect(onFrame).toHaveBeenCalledWith("x".repeat(201), 1);
  });

  it("maxChars <= 0 关闭动画（永久直出）", () => {
    const onFrame = vi.fn();
    const h = createScramble({ onFrame });
    h.start("HELLO", { maxChars: 0 });
    expect(onFrame).toHaveBeenCalledWith("HELLO", 1);
  });

  it("skip 立即落定且不重复触发 onDone", () => {
    const onDone = vi.fn();
    const h = createScramble({ onFrame: () => {}, onDone });
    h.start("ABCDEF", { speed: 10 });
    vi.advanceTimersByTime(25);
    h.skip();
    expect(onDone).toHaveBeenCalledTimes(1);
    h.skip();
    expect(onDone).toHaveBeenCalledTimes(1);
  });

  it("stop 停留在当前帧，不再产帧", () => {
    const onFrame = vi.fn();
    const h = createScramble({ onFrame });
    h.start("ABCDEF", { speed: 10 });
    vi.advanceTimersByTime(20);
    const count = onFrame.mock.calls.length;
    h.stop();
    vi.advanceTimersByTime(1000);
    expect(onFrame).toHaveBeenCalledTimes(count);
    expect(h.isDone).toBe(false);
  });

  it("dispose 后 start 不再生效", () => {
    const onFrame = vi.fn();
    const h: ScrambleHandle = createScramble({ onFrame });
    h.dispose();
    h.start("AB");
    vi.advanceTimersByTime(1000);
    expect(onFrame).not.toHaveBeenCalled();
  });

  it("start 可复用：换文本重启且旧定时器被清理", () => {
    const frames: string[] = [];
    const h = createScramble({ onFrame: (s) => frames.push(s) });
    h.start("AAA", { speed: 10, churn: [1, 1] });
    vi.advanceTimersByTime(15); // AAA 只播了 1 帧
    const before = frames.length;
    expect(before).toBe(1);
    h.start("BB", { speed: 10, churn: [1, 1] });
    vi.advanceTimersByTime(1000);
    expect(frames[frames.length - 1]).toBe("BB");
    // 旧的 AAA interval 不再产帧：重启后所有帧都来自 "BB"（GLYPHS 不含字母 A）
    expect(frames.slice(before).every((f) => !f.includes("A"))).toBe(true);
  });

  it("CJK 文本按字符处理", () => {
    const frames: string[] = [];
    const h = createScramble({ onFrame: (s) => frames.push(s) });
    h.start("特工", { churn: [1, 1], speed: 10, glyphs: DEFAULT_GLYPHS });
    vi.advanceTimersByTime(1000);
    expect(frames[frames.length - 1]).toBe("特工");
  });
});
