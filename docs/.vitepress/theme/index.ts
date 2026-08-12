import DefaultTheme from 'vitepress/theme'
import type { Theme } from 'vitepress'
import PageMeta from './components/PageMeta.vue'
import './custom.css'

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    app.component('PageMeta', PageMeta)
  }
} satisfies Theme
