import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
// 导入即注册 <scramble-text>
import "../src/wc";

const NBSP = "\u00A0";

function makeEl(text: string): HTMLElement & { skip(): void; replay(): void } {
  const el = document.createElement("scramble-text") as HTMLElement & {
    skip(): void;
    replay(): void;
  };
  el.setAttribute("text", text);
  document.body.appendChild(el);
  return el;
}

function overlayText(el: HTMLElement): string {
  const shadow = el.shadowRoot as ShadowRoot;
  return shadow.getElementById("overlay")?.textContent ?? "";
}

beforeEach(() => {
  vi.useFakeTimers();
  document.body.innerHTML = "";
});
afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
});

describe("<scramble-text> (web component)", () => {
  it("已注册为自定义元素", () => {
    expect(customElements.get("scramble-text")).toBeDefined();
  });

  it("从 NBSP 占位开始，最终落定为完整文本", async () => {
    const el = makeEl("HELLO");
    expect(overlayText(el)).toBe(NBSP.repeat(5));
    await vi.advanceTimersByTimeAsync(5000);
    expect(overlayText(el)).toBe("HELLO");
  });

  it("宿主带 aria-label=最终文本", () => {
    const el = makeEl("HELLO");
    expect(el.getAttribute("aria-label")).toBe("HELLO");
  });

  it("超长文本静态直出", () => {
    const text = "x".repeat(201);
    const el = makeEl(text);
    expect(overlayText(el)).toBe(text);
  });

  it("active=false 渲染占位", () => {
    const el = makeEl("HELLO");
    el.setAttribute("active", "false");
    expect(overlayText(el)).toBe(NBSP.repeat(5));
  });

  it("skip() 立即落定", () => {
    const el = makeEl("HELLO");
    el.skip();
    expect(overlayText(el)).toBe("HELLO");
  });

  it("text 属性变化重启动画", async () => {
    const el = makeEl("ONE");
    await vi.advanceTimersByTimeAsync(5000);
    el.setAttribute("text", "TWO");
    await vi.advanceTimersByTimeAsync(5000);
    expect(overlayText(el)).toBe("TWO");
  });

  it("解码完成派发 scramble-done 事件", async () => {
    const el = makeEl("HELLO");
    const onDone = vi.fn();
    el.addEventListener("scramble-done", onDone);
    await vi.advanceTimersByTimeAsync(5000);
    expect(onDone).toHaveBeenCalledTimes(1);
  });

  it("从文档移除后清理定时器不抛错", async () => {
    const el = makeEl("HELLO");
    await vi.advanceTimersByTimeAsync(50); // 已至少产出 1 帧乱码
    const frozen = overlayText(el);
    expect(frozen).not.toBe("");
    el.remove();
    await vi.advanceTimersByTimeAsync(5000);
    expect(overlayText(el)).toBe(frozen); // 引擎已 dispose，停留在移除前内容
  });
});
