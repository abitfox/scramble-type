import { defineConfig } from "tsup";

/**
 * 每个入口独立完整打包（splitting: false），core 在各入口内联——
 * 体积以百字节计，换来零跨入口 chunk 依赖，消费方与 CDN 加载都最简单。
 * peerDependencies（react / vue）由 tsup 自动 external。
 */
export default defineConfig([
  {
    // React 适配层 = 默认入口
    entry: { index: "src/react/index.tsx" },
    format: ["esm", "cjs"],
    dts: true,
    sourcemap: true,
    target: "es2020",
    clean: true,
  },
  {
    entry: { core: "src/core/index.ts" },
    format: ["esm", "cjs"],
    dts: true,
    sourcemap: true,
    target: "es2020",
  },
  {
    entry: { vue: "src/vue/index.ts" },
    format: ["esm", "cjs"],
    dts: true,
    sourcemap: true,
    target: "es2020",
  },
  {
    entry: { wc: "src/wc/index.ts" },
    format: ["esm", "cjs"],
    dts: true,
    sourcemap: true,
    target: "es2020",
  },
  {
    // <script> 直接引入即注册 <scramble-text>，供 jsdelivr/unpkg CDN 使用
    entry: { "wc/global": "src/wc/global.ts" },
    format: ["iife"],
    outExtension: () => ({ js: ".js" }), // 默认 .global.js，与 exports 路径保持一致
    minify: true,
    target: "es2020",
  },
  {
    entry: { sound: "src/sound/index.ts" },
    format: ["esm", "cjs"],
    dts: true,
    sourcemap: true,
    target: "es2020",
  },
]);
