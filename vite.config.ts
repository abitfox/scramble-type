import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// playground 演示直接引用源码（alias 到 src/），改组件即时热更，无需先 build
const r = (p: string) => fileURLToPath(new URL(p, import.meta.url));

export default defineConfig({
  root: "playground",
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        main: r("./playground/index.html"),
        plain: r("./playground/plain.html"),
      },
    },
  },
  resolve: {
    alias: [
      { find: "scramble-type/core", replacement: r("./src/core/index.ts") },
      { find: "scramble-type/sound", replacement: r("./src/sound/index.ts") },
      { find: "scramble-type/vue", replacement: r("./src/vue/index.ts") },
      { find: "scramble-type/wc", replacement: r("./src/wc/index.ts") },
      { find: "scramble-type", replacement: r("./src/react/index.tsx") },
    ],
  },
  server: { port: 5173 },
});
