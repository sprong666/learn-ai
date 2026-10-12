import type { Config } from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

const config: Config = {
  title: '技术指导文档',
  tagline: '系列交互式教程与指南',
  favicon: 'img/favicon.ico',

  url: 'https://sprong666.github.io',
  baseUrl: '/learn-ai',
  organizationName: 'sprong666',
  projectName: 'learn-ai',

  onBrokenLinks: 'warn',
  onBrokenMarkdownLinks: 'warn',

  i18n: { defaultLocale: 'zh-CN', locales: ['zh-CN'] },

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
          routeBasePath: '/',
          showLastUpdateTime: true,
          editUrl: 'https://github.com/sprong666/learn-ai/tree/main/',
        },
        blog: false,
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    image: 'img/docusaurus-social-card.jpg',
    navbar: {
      title: '技术指南',
      logo: { alt: 'Logo', src: 'img/logo.svg' },
      items: [
        { type: 'docSidebar', sidebarId: 'tutorialSidebar', label: '教程', position: 'left' },
        { href: 'https://github.com/sprong666/learn-ai', label: 'GitHub', position: 'right' },
      ],
    },
    footer: {
      style: 'dark',
      copyright: `Copyright © ${new Date().getFullYear()} 技术指南`,
    },
    prism: { theme: require('prism-react-renderer').themes.github, additionalLanguages: ['bash', 'python', 'rust', 'go'] },
    mermaid: { theme: { light: 'neutral', dark: 'dark' } },
  } satisfies Preset.ThemeConfig,

  themes: ['@docusaurus/theme-mermaid'],

  markdown: {
    mermaid: true,
  },
};

export default config;
