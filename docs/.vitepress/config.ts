import { defineConfig } from 'vitepress'
import MarkdownIt from 'markdown-it'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { getPageStatistics } from './utils/page-statistics'

const statisticsParser = new MarkdownIt()

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "KiraAI",
  description: "KiraAI Digital Life Platform",
  base: '/',
  ignoreDeadLinks: true,
  head: [
    // ['link', { rel: 'icon', type: 'image/svg+xml', href: '/logo.svg' }],
    ['meta', { name: 'theme-color', content: '#3eaf7c' }],
    ['meta', { property: 'og:type', content: 'website' }],
    ['meta', { property: 'og:title', content: 'KiraAI - Digital Life Platform' }],
    ['meta', { property: 'og:description', content: 'Powerful, flexible, and extensible AI digital life with Agent capabilities' }],
  ],

  locales: {
    // 默认语言（英语），对应根目录 `/`
    root: {
      label: 'English',
      lang: 'en', // HTML 的 lang 属性
      title: 'KiraAI',
      description: 'KiraAI Digital Life Platform',
      themeConfig: {
        nav: [
          { text: 'Home', link: '/' },
          { text: 'Guide', link: '/guide/introduction' },
          { text: 'Deployment', link: '/deployment/windows' },
          { text: 'Development', link: '/development/guide' },
          { text: 'Plugins', link: 'https://plugins.kira-ai.top', target: '_blank' },
          { text: 'GitHub', link: 'https://github.com/xxynet/KiraAI', target: '_blank' }
        ],
        footer: {
          message: 'AGPL 3.0 License',
          copyright: `Copyright © ${new Date().getFullYear()} KiraAI`
        },
        outline: {
          level: 'deep',
          label: 'Page Navigation'
        },
        lastUpdated: {
          text: 'Last Updated',
          formatOptions: {
            dateStyle: 'short',
            timeStyle: 'medium'
          }
        },
        docFooter: {
          prev: 'Previous',
          next: 'Next'
        },
        darkModeSwitchLabel: 'Dark Mode',
        sidebarMenuLabel: 'Menu',
        returnToTopLabel: 'Return to Top',
        sidebar: [
          {
            text: 'Introduction',
            collapsed: false,
            items: [
              { text: 'What is KiraAI', link: '/guide/introduction' },
              { text: 'Quick Start', link: '/guide/quickstart' },
              { text: 'Community', link: '/guide/community' },
              { text: 'FAQ', link: '/guide/faq' },
            ]
          },
          {
            text: 'Deployment',
            collapsed: false,
            items: [
              { text: 'Deploy on Windows', link: '/deployment/windows' },
              { text: 'Deploy on Linux', link: '/deployment/linux' },
              { text: 'Deploy with Docker', link: '/deployment/docker' },
              { text: 'Deploy on Termux', link: '/deployment/termux' },
              { text: 'Deploy on Desktop', link: '/deployment/desktop' },
            ]
          },
          {
            text: 'Configuration',
            collapsed: false,
            items: [
              { 
                text: 'Adapter', 
                collapsed: false,
                link: '/configuration/adapter/adapter',
                items: [
                  { text: 'QQ', link: '/configuration/adapter/qq' },
                  { text: 'Telegram', link: '/configuration/adapter/telegram' },
                  { text: 'BiliBili', link: '/configuration/adapter/bilibili' },
                  { text: 'WeChat', link: '/configuration/adapter/wechat' },
                ]
               },
              { text: 'Provider', link: '/configuration/provider' },
            ]
          },
          {
            text: 'Usage',
            collapsed: false,
            items: [
              { text: 'WebUI', link: '/usage/webui' },
              {
                text: 'Features',
                collapsed: false,
                items: [
                  { text: 'Plugins', link: '/usage/features/plugins' },
                  { text: 'MCP', link: '/usage/features/mcp' },
                  { text: 'Skills', link: '/usage/features/skills' },
                ]
              }
            ]
          },
          {
            text: 'Development',
            collapsed: false,
            items: [
              { 
                text: 'Plugin Development', 
                collapsed: true,
                items: [
                  { text: 'Development Guide', link: '/development/plugins/dev-guide' },
                  { text: 'Manifest', link: '/development/plugins/manifest' },
                  { text: 'Config System', link: '/development/plugins/config-system' },
                  { text: 'Main Class', link: '/development/plugins/main-class' },
                  { text: 'Hook System', link: '/development/plugins/hooks' },
                  { text: 'API Registration', link: '/development/plugins/fast-api' },
                  { text: 'Plugin Context', link: '/development/plugins/context' },
                ]
              },
              { text: 'Provider Development', link: '/development/providers' },
              { text: 'Adapter Development', link: '/development/adapters' },
              { text: 'API Reference', link: '/development/api' },
            ]
          }
        ],
      }
    },

    zh: {
      label: '简体中文',
      lang: 'zh', 
      link: '/zh/',
      title: 'KiraAI',
      description: 'KiraAI数字生命搭建平台',
      themeConfig: {
        nav: [
          { text: '首页', link: '/zh/' },
          { text: '指南', link: '/zh/guide/introduction' },
          { text: '部署教程', link: '/zh/deployment/windows' },
          { text: '开发指南', link: '/zh/development/guide' },
          { text: '插件', link: 'https://plugins.kira-ai.top', target: '_blank' },
          { text: 'GitHub', link: 'https://github.com/xxynet/KiraAI', target: '_blank' }
        ],
        footer: {
          message: 'AGPL 3.0 License',
          copyright: `Copyright © ${new Date().getFullYear()} KiraAI`
        },
        outline: {
          level: 'deep',
          label: '页面导航'
        },
        lastUpdated: {
          text: '最后更新',
          formatOptions: {
            dateStyle: 'short',
            timeStyle: 'medium'
          }
        },
        docFooter: {
          prev: '上一页',
          next: '下一页'
        },
        darkModeSwitchLabel: '深色模式',
        sidebarMenuLabel: '菜单',
        returnToTopLabel: '返回顶部',
        sidebar: [
          {
            text: '介绍',
            collapsed: false,
            items: [
              { text: '什么是KiraAI', link: '/zh/guide/introduction' },
              { text: '快速开始', link: '/zh/guide/quickstart' },
              { text: '社区', link: '/zh/guide/community' },
              { text: '常见问题', link: '/zh/guide/faq' },
            ]
          },
          {
            text: '部署',
            collapsed: false,
            items: [
              { text: 'Windows 部署', link: '/zh/deployment/windows' },
              { text: 'Linux 部署', link: '/zh/deployment/linux' },
              { text: 'Docker 部署', link: '/zh/deployment/docker' },
              { text: 'Termux 部署', link: '/zh/deployment/termux' },
              { text: '桌面端部署', link: '/zh/deployment/desktop' },
            ]
          },
          {
            text: '配置',
            collapsed: false,
            items: [
              { 
                text: '适配器', 
                collapsed: false,
                link: '/zh/configuration/adapter/adapter',
                items: [
                  { text: 'QQ', link: '/zh/configuration/adapter/qq' },
                  { text: 'Telegram', link: '/zh/configuration/adapter/telegram' },
                  { text: 'BiliBili', link: '/zh/configuration/adapter/bilibili' },
                  { text: '微信', link: '/zh/configuration/adapter/wechat' },
                ]
              },
              { text: '提供商', link: '/zh/configuration/provider' },
            ]
          },
          {
            text: '使用',
            collapsed: false,
            items: [
              { text: 'WebUI', link: '/zh/usage/webui' },
              {
                text: '附加功能',
                collapsed: false,
                items: [
                  { text: '插件', link: '/zh/usage/features/plugins' },
                  { text: 'MCP', link: '/zh/usage/features/mcp' },
                  { text: 'Skills', link: '/zh/usage/features/skills' },
                ]
              }
            ]
          },
          {
            text: '开发',
            collapsed: false,
            items: [
              { 
                text: '插件开发', 
                collapsed: true,
                items: [
                  { text: '开发指南', link: '/zh/development/plugins/dev-guide' },
                  { text: '清单文件', link: '/zh/development/plugins/manifest' },
                  { text: '配置系统', link: '/zh/development/plugins/config-system' },
                  { text: '主类', link: '/zh/development/plugins/main-class' },
                  { text: '钩子系统', link: '/zh/development/plugins/hooks' },
                  { text: 'API注册', link: '/zh/development/plugins/fast-api' },
                  { text: '插件上下文', link: '/zh/development/plugins/context' },
                ]
              },
              { text: '提供商开发', link: '/zh/development/providers' },
              { text: '适配器开发', link: '/zh/development/adapters' },
              { text: 'API参考', link: '/zh/development/api' },
            ]
          }
        ],
      }
    }
  },

  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    // logo: '/logo.svg',
    
    // 全局导航栏将由locales下的配置覆盖
    nav: [],

    // 全局侧边栏将由locales下的配置覆盖
    sidebar: [],

    socialLinks: [
      { icon: 'github', link: 'https://github.com/xxynet/KiraAI' }
    ],

    search: {
      provider: 'local'
    },
  },

  markdown: {
    config(md) {
      const renderHeadingClose = md.renderer.rules.heading_close
      md.renderer.rules.heading_close = (tokens, index, options, env, self) => {
        const html = renderHeadingClose
          ? renderHeadingClose(tokens, index, options, env, self)
          : self.renderToken(tokens, index, options)

        if (
          tokens[index].tag !== 'h1' ||
          env.pageMetaRendered ||
          env.frontmatter?.pageMeta === false
        ) {
          return html
        }

        env.pageMetaRendered = true
        return `${html}<PageMeta />`
      }
    },
    lineNumbers: true,
    toc: {
      level: [1, 2, 3]
    }
  },

  transformPageData(pageData, { siteConfig }) {
    if (!pageData.filePath) return

    try {
      const source = readFileSync(resolve(siteConfig.srcDir, pageData.filePath), 'utf-8')
      return {
        frontmatter: {
          ...pageData.frontmatter,
          ...getPageStatistics(source, (markdown) => statisticsParser.parse(markdown, {}))
        }
      }
    } catch {
      return
    }
  },

  lastUpdated: true,

  vite: {
    server: {
      port: 5173,
      host: true
    }
  }
})
