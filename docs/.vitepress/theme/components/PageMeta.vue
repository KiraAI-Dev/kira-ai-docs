<script setup lang="ts">
import { computed } from 'vue'
import { useData } from 'vitepress'
import { resolvePageMetaMessages } from '../locales/page-meta'

const { lang, page, frontmatter } = useData()

const text = computed(() => resolvePageMetaMessages(lang.value))
const wordCount = computed(() => Number(frontmatter.value.wordCount ?? 0))
const readingTime = computed(() => Number(frontmatter.value.readingTime ?? 0))
const lastUpdated = computed(() => page.value.lastUpdated)
const readingTimeUnit = computed(() => readingTime.value === 1 ? text.value.minute : text.value.minutes)
const lastUpdatedText = computed(() => {
  if (!lastUpdated.value) return ''

  return new Intl.DateTimeFormat(text.value.dateLocale, {
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
    :aria-label="text.pageInformation"
  >
    <span v-if="lastUpdatedText">
      {{ text.updated }}: {{ lastUpdatedText }}
    </span>
    <span>
      {{ text.words }}: {{ wordCount }}{{ text.wordSuffix }}
    </span>
    <span>
      {{ text.readTime }}: {{ readingTime }} {{ readingTimeUnit }}
    </span>
  </div>
</template>
