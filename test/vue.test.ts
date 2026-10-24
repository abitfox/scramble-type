import { mount } from "@vue/test-utils";
import { nextTick } from "vue";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ScrambleText } from "../src/vue";

const NBSP = "\u00A0";

beforeEach(() => {
  vi.useFakeTimers();
});
afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
});

/** 取乱码层（aria-hidden 的内层 span）文本 */
function overlayText(wrapper: ReturnType<typeof mount>): string {
  const el = wrapper.find("span[aria-hidden]");
  return el.exists() ? (el.element.textContent ?? "") : "";
}

describe("ScrambleText (vue)", () => {
  it("从 NBSP 占位开始，最终落定为完整文本", async () => {
    const wrapper = mount(ScrambleText, { props: { text: "HELLO" } });
    expect(overlayText(wrapper)).toBe(NBSP.repeat(5));
    await vi.advanceTimersByTimeAsync(5000);
    await nextTick();
    expect(overlayText(wrapper)).toBe("HELLO");
  });

  it("解码完成触发 done 事件一次", async () => {
    const wrapper = mount(ScrambleText, { props: { text: "HELLO" } });
    await vi.advanceTimersByTimeAsync(5000);
    await nextTick();
    expect(wrapper.emitted("done")).toHaveLength(1);
  });

  it("超长文本静态直出", () => {
    const text = "x".repeat(201);
    const wrapper = mount(ScrambleText, { props: { text } });
    expect(overlayText(wrapper)).toBe(text);
  });

  it("active=false 渲染占位，翻真后启动动画", async () => {
    const wrapper = mount(ScrambleText, { props: { text: "HELLO", active: false } });
    expect(overlayText(wrapper)).toBe(NBSP.repeat(5));
    await wrapper.setProps({ active: true });
    await vi.advanceTimersByTimeAsync(5000);
    await nextTick();
    expect(overlayText(wrapper)).toBe("HELLO");
  });

  it("text 变化重新播放", async () => {
    const wrapper = mount(ScrambleText, { props: { text: "ONE" } });
    await vi.advanceTimersByTimeAsync(5000);
    await wrapper.setProps({ text: "TWO" });
    await vi.advanceTimersByTimeAsync(5000);
    await nextTick();
    expect(overlayText(wrapper)).toBe("TWO");
  });

  it("通过模板 ref 调用 skip() 立即落定", async () => {
    const wrapper = mount(ScrambleText, { props: { text: "HELLO" } });
    (wrapper.vm as unknown as { skip(): void }).skip();
    await nextTick();
    expect(overlayText(wrapper)).toBe("HELLO");
  });

  it("卸载时清理定时器不抛错", async () => {
    const wrapper = mount(ScrambleText, { props: { text: "HELLO" } });
    await vi.advanceTimersByTimeAsync(50);
    expect(() => wrapper.unmount()).not.toThrow();
    await vi.advanceTimersByTimeAsync(5000);
  });
});
