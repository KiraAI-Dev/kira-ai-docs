<script setup lang="ts">
import { computed } from 'vue'
import { useData } from 'vitepress'

const { lang, page, frontmatter } = useData()

const isChinese = computed(() => lang.value.startsWith('zh'))
const wordCount = computed(() => Number(frontmatter.value.wordCount ?? 0))
const readingTime = computed(() => Number(frontmatter.value.readingTime ?? 0))
const lastUpdated = computed(() => page.value.lastUpdated)
const locale = computed(() => (isChinese.value ? 'zh-CN' : 'en-US'))
const lastUpdatedText = computed(() => {
  if (!lastUpdated.value) return ''

  return new Intl.DateTimeFormat(locale.value, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(new Date(lastUpdated.value))
})
</script>

<template>
  <div
    v-if="wordCount > 0"
    class="page-meta"
    :aria-label="isChinese ? '页面信息' : 'Page information'"
  >
    <span v-if="lastUpdatedText">
      {{ isChinese ? '更新' : 'Updated' }}: {{ lastUpdatedText }}
    </span>
    <span>
      {{ isChinese ? '字数' : 'Words' }}: {{ wordCount }}{{ isChinese ? ' 字' : '' }}
    </span>
    <span>
      {{ isChinese ? '时长' : 'Read time' }}: {{ readingTime }} {{ isChinese ? '分钟' : readingTime === 1 ? 'min' : 'mins' }}
    </span>
  </div>
</template>
