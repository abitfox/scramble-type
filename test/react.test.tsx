import { act, render } from "@testing-library/react";
import { createRef } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ScrambleText } from "../src/react";

const NBSP = "\u00A0";

beforeEach(() => {
  vi.useFakeTimers();
});
afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
});

/** 推进假定时器并刷新 React 渲染 */
function advance(ms: number) {
  act(() => {
    vi.advanceTimersByTime(ms);
  });
}

/** 取乱码层（aria-hidden 的内层 span）文本 */
function overlayText(container: HTMLElement): string {
  return container.querySelector("span[aria-hidden]")?.textContent ?? "";
}

describe("ScrambleText (react)", () => {
  it("从 NBSP 占位开始，最终落定为完整文本", () => {
    const { container } = render(<ScrambleText text="HELLO" />);
    expect(overlayText(container)).toBe(NBSP.repeat(5));
    advance(5000);
    expect(overlayText(container)).toBe("HELLO");
  });

  it("宿主元素带 aria-label=最终文本，动画层 aria-hidden", () => {
    const { container } = render(<ScrambleText text="HELLO" />);
    expect(container.firstElementChild?.getAttribute("aria-label")).toBe("HELLO");
    expect(container.querySelector("span[aria-hidden]")).toBeTruthy();
  });

  it("超长文本（> maxChars）静态直出", () => {
    const text = "x".repeat(201);
    const { container } = render(<ScrambleText text={text} />);
    expect(overlayText(container)).toBe(text);
    advance(1000);
    expect(overlayText(container)).toBe(text);
  });

  it("maxChars={0} 关闭动画", () => {
    const { container } = render(<ScrambleText text="HELLO" maxChars={0} />);
    expect(overlayText(container)).toBe("HELLO");
  });

  it("active=false 渲染占位（空白但保留宽度），翻真后启动动画", () => {
    const { container, rerender } = render(<ScrambleText text="HELLO" active={false} />);
    expect(overlayText(container)).toBe(NBSP.repeat(5));
    rerender(<ScrambleText text="HELLO" active={true} />);
    advance(5000);
    expect(overlayText(container)).toBe("HELLO");
  });

  it("respectReducedMotion：系统减弱动态时直出最终文本", () => {
    vi.spyOn(window, "matchMedia").mockImplementation(
      (query: string) =>
        ({
          matches: query.includes("prefers-reduced-motion"),
          media: query,
          onchange: null,
          addListener() {},
          removeListener() {},
          addEventListener() {},
          removeEventListener() {},
          dispatchEvent: () => false,
        }) as unknown as MediaQueryList,
    );
    const onDone = vi.fn();
    const { container } = render(<ScrambleText text="HELLO" onDone={onDone} />);
    expect(overlayText(container)).toBe("HELLO");
    expect(onDone).toHaveBeenCalledTimes(1);
  });

  it("onDone 在解码完成后触发一次", () => {
    const onDone = vi.fn();
    render(<ScrambleText text="HELLO" onDone={onDone} />);
    advance(5000);
    advance(5000);
    expect(onDone).toHaveBeenCalledTimes(1);
  });

  it("text 变化重新播放", () => {
    const { container, rerender } = render(<ScrambleText text="ONE" />);
    advance(5000);
    rerender(<ScrambleText text="TWO" />);
    advance(5000);
    expect(overlayText(container)).toBe("TWO");
  });

  it("ref.replay / ref.skip 可用", () => {
    const ref = createRef<{ replay(): void; skip(): void }>();
    const { container } = render(<ScrambleText ref={ref} text="HELLO" />);
    act(() => {
      ref.current?.skip();
    });
    expect(overlayText(container)).toBe("HELLO");
  });

  it("卸载后定时器被清理（不抛错、无状态更新）", () => {
    const { unmount } = render(<ScrambleText text="HELLO" />);
    advance(50);
    expect(() => {
      unmount();
      advance(5000);
    }).not.toThrow();
  });

  it("sound=true 在无 AudioContext 环境（jsdom）下安全无输出", () => {
    const { container } = render(<ScrambleText text="HELLO" sound />);
    advance(5000);
    expect(overlayText(container)).toBe("HELLO");
  });

  it("layout=nbsp 保持源实现行为", () => {
    const { container } = render(<ScrambleText text="HELLO" layout="nbsp" />);
    expect(container.textContent).toBe(NBSP.repeat(5));
    advance(5000);
    expect(container.textContent).toBe("HELLO");
  });
});
