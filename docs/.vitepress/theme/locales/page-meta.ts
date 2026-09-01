const messages = {
  en: {
    dateLocale: 'en-US',
    pageInformation: 'Page information',
    updated: 'Updated',
    words: 'Words',
    wordSuffix: '',
    readTime: 'Read time',
    minute: 'min',
    minutes: 'mins',
  },
  'zh-CN': {
    dateLocale: 'zh-CN',
    pageInformation: '页面信息',
    updated: '更新',
    words: '字数',
    wordSuffix: ' 字',
    readTime: '时长',
    minute: '分钟',
    minutes: '分钟',
  },
} as const

export type PageMetaMessages = (typeof messages)[keyof typeof messages]

export function resolvePageMetaMessages(locale: string): PageMetaMessages {
  return messages[locale as keyof typeof messages] ?? messages.en
}
