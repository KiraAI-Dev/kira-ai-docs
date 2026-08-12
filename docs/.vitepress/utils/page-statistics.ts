export interface MarkdownToken {
  type: string
  content: string
  children?: MarkdownToken[] | null
}

export type MarkdownParser = (source: string) => MarkdownToken[]

const CHINESE_READING_SPEED = 300
const ENGLISH_READING_SPEED = 200

function removeFrontmatter(markdown: string) {
  const lines = markdown.split(/\r?\n/)
  const firstLine = lines[0]?.replace(/^﻿/, '') ?? ''
  if (!/^---\s*$/.test(firstLine)) return markdown

  const isDelimiter = (line: string) =>
    /^(?:---|\.\.\.)\s*$/.test(line)

  const endIndex = lines.findIndex(
    (line, index) => index > 0 && isDelimiter(line)
  )

  return endIndex === -1 ? markdown : lines.slice(endIndex + 1).join('\n')
}

export function getPageStatistics(markdown: string, parseMarkdown: MarkdownParser) {
  const content = parseMarkdown(removeFrontmatter(markdown))
    .filter((token) => token.type === 'inline')
    .flatMap((token) => token.children ?? [])
    .filter((token) => token.type === 'text')
    .map((token) => token.content)
    .join(' ')

  const chineseCharacters = content.match(/[\u3400-\u9fff]/g)?.length ?? 0
  const otherWords = content
    .replace(/[\u3400-\u9fff]/g, ' ')
    .match(/[\p{L}\p{N}]+(?:['’-][\p{L}\p{N}]+)*/gu)?.length ?? 0
  const wordCount = chineseCharacters + otherWords
  const readingSpeed = chineseCharacters > otherWords
    ? CHINESE_READING_SPEED
    : ENGLISH_READING_SPEED

  return {
    wordCount,
    readingTime: Math.max(1, Math.ceil(wordCount / readingSpeed))
  }
}
