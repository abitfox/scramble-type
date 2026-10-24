/* jsdom 缺少 matchMedia：统一提供 stub，单个测试可覆写返回值 */
export function installMatchMediaStub() {
  if (typeof window.matchMedia === "function") return;
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener() {},
      removeListener() {},
      addEventListener() {},
      removeEventListener() {},
      dispatchEvent: () => false,
    }),
  });
}

installMatchMediaStub();
