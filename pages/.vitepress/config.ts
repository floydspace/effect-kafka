import fs from "fs";
import { DefaultTheme, defineConfig } from "vitepress";
import { groupIconMdPlugin, groupIconVitePlugin } from "vitepress-plugin-group-icons";

const meta = JSON.parse(fs.readFileSync("./package.json", "utf-8"));
const version = meta["version"];

export default defineConfig({
  lang: "en-US",
  title: "Effect Kafka",
  description: "Universal Kafka client for Effect",

  lastUpdated: true,

  themeConfig: {
    nav: nav(),

    sidebar: {
      "/docs/": sidebar(),
    },

    editLink: {
      pattern: "https://github.com/floydspace/effect-kafka/edit/main/pages/:path",
      text: "Edit this page on GitHub",
    },

    socialLinks: [{ icon: "github", link: "https://github.com/floydspace/effect-kafka" }],

    footer: {
      message: "Released under the MIT License.",
      copyright: "Copyright © 2024-present Victor Korzunin",
    },

    search: {
      provider: "local",
    },
  },

  markdown: {
    config: (md) => {
      md.use(groupIconMdPlugin);
    },
  },

  vite: {
    plugins: [groupIconVitePlugin()],
  },
});

function nav() {
  return [
    { text: "Docs", link: "/docs/what-is", activeMatch: "/docs/" },
    { text: "API Reference", link: "https://floydspace.github.io/effect-kafka" },
    { text: `Version: ${version}`, link: `https://github.com/floydspace/effect-kafka/releases/tag/v${version}` },
  ];
}

function sidebar(): DefaultTheme.SidebarItem[] {
  return [
    {
      text: "Introduction",
      collapsed: false,
      items: [
        { text: "What is Effect Kafka?", link: "/docs/what-is" },
        { text: "Installation", link: "/docs/installation" },
        { text: "Getting Started", link: "/docs/getting-started" },
      ],
    },
    {
      text: "Interfaces",
      collapsed: false,
      items: [
        { text: "Producer", link: "/docs/producer" },
        { text: "Consumer", link: "/docs/consumer" },
        { text: "Admin", link: "/docs/admin" },
      ],
    },
    {
      text: "Changelog",
      collapsed: false,
      link: "/docs/changelog",
    },
  ];
}
