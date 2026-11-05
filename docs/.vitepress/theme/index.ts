import DefaultTheme from 'vitepress/theme'
import type { Theme } from 'vitepress'
import LauncherDownload from './components/LauncherDownload.vue'
import PageMeta from './components/PageMeta.vue'
import './custom.css'

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    app.component('LauncherDownload', LauncherDownload)
    app.component('PageMeta', PageMeta)
  }
} satisfies Theme
