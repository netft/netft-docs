import type {Config} from '@docusaurus/types';
import type {Options, ThemeConfig} from '@docusaurus/preset-classic';

const config: Config = {
  title: 'Net F/T',
  tagline: 'Open-source tools for ATI Net F/T sensors',
  favicon: 'img/netft-logo.png',
  url: 'https://netft.dev',
  baseUrl: '/',
  organizationName: 'netft',
  projectName: 'netft-docs',
  onBrokenLinks: 'throw',
  markdown: {
    hooks: {
      onBrokenMarkdownLinks: 'throw',
    },
  },
  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },
  presets: [
    [
      'classic',
      {
        docs: {
          routeBasePath: 'docs',
          sidebarPath: './sidebars.ts',
          editUrl: 'https://github.com/netft/netft-docs/edit/main/',
        },
        blog: false,
        theme: {
          customCss: './src/css/custom.css',
        },
        sitemap: {
          changefreq: 'weekly',
          priority: 0.5,
          filename: 'sitemap.xml',
        },
      } satisfies Options,
    ],
  ],
  plugins: [
    [
      '@easyops-cn/docusaurus-search-local',
      {
        hashed: 'filename',
        indexBlog: false,
        indexDocs: true,
        indexPages: true,
        language: 'en',
      },
    ],
    [
      '@docusaurus/plugin-client-redirects',
      {
        redirects: [
          {
            from: ['/docs/references/api'],
            to: '/docs/references/cpp-api/overview',
          },
          {
            from: ['/docs/references/cli'],
            to: '/docs/references/cli/overview',
          },
          {
            from: ['/docs/references/configuration'],
            to: '/docs/references/cpp-api/configuration',
          },
          {
            from: ['/docs/references/data-and-units'],
            to: '/docs/references/data-formats/native-sample',
          },
          {
            from: ['/docs/references/ros'],
            to: '/docs/references/ros/standalone',
          },
          {
            from: ['/docs/references/troubleshooting'],
            to: '/docs/tutorials/troubleshooting',
          },
          {
            from: ['/docs/references/viewer'],
            to: '/docs/tutorials/viewer/connect-and-inspect',
          },
          {
            from: ['/docs/tutorials/applications/cli'],
            to: '/docs/tutorials/cli/inspect-and-validate',
          },
          {
            from: ['/docs/tutorials/applications/viewer'],
            to: '/docs/tutorials/viewer/connect-and-inspect',
          },
          {
            from: ['/docs/tutorials/robotics/ros-standalone'],
            to: '/docs/tutorials/ros/standalone',
          },
          {
            from: ['/docs/tutorials/robotics/ros2-control'],
            to: '/docs/tutorials/ros/ros2-control',
          },
        ],
      },
    ],
  ],
  themeConfig: {
    image: 'img/netft-viewer.png',
    metadata: [
      {
        name: 'description',
        content:
          'Documentation for the Net F/T C++, Python, CLI, ROS, and desktop tools.',
      },
    ],
    colorMode: {
      defaultMode: 'light',
      disableSwitch: true,
      respectPrefersColorScheme: false,
    },
    navbar: {
      title: 'Net F/T',
      logo: {
        alt: 'Net F/T organization mark',
        src: 'img/netft-logo.png',
      },
      items: [
        {
          to: '/docs/get-started/introduction',
          label: 'Get started',
          position: 'left',
        },
        {
          to: '/docs/tutorials/fundamentals/sensor-measurements',
          label: 'Tutorials',
          position: 'left',
        },
        {
          to: '/docs/references/cpp-api/overview',
          label: 'References',
          position: 'left',
        },
        {
          type: 'search',
          position: 'right',
        },
        {
          href: 'https://github.com/netft',
          label: 'GitHub',
          position: 'right',
          className: 'header-github-link',
          'aria-label': 'Net F/T organization on GitHub',
        },
      ],
    },
    footer: {
      style: 'light',
      copyright:
        'Documentation licensed under <a href="https://github.com/netft/netft-docs/blob/main/LICENSE-DOCS">CC BY 4.0</a>.',
    },
  } satisfies ThemeConfig,
};

export default config;
