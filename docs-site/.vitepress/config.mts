import { defineConfig } from "vitepress";

export default defineConfig({
  lang: "en-US",
  title: "ScrambleType",
  description:
    "Zero-dependency scramble/decode typewriter text effect for React, Vue and plain HTML.",
  themeConfig: {
    siteTitle: "ScrambleType",
    nav: [
      { text: "Guide", link: "/guide/getting-started" },
      { text: "API", link: "/guide/api" },
      { text: "Playground", link: "/guide/playground" },
    ],
    sidebar: [
      {
        text: "Guide",
        items: [
          { text: "Getting Started", link: "/guide/getting-started" },
          { text: "API Reference", link: "/guide/api" },
          { text: "Recipes", link: "/guide/recipes" },
          { text: "Playground", link: "/guide/playground" },
        ],
      },
    ],
    socialLinks: [
      { icon: "github", link: "https://github.com/abitfox/scramble-type" },
    ],
    footer: {
      message: "Released under the MIT License.",
      copyright: "Copyright © 2026 ScrambleType Authors",
    },
  },
});
