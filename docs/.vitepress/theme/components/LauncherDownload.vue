<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import MarkdownIt from 'markdown-it'
import { useData } from 'vitepress'
import { resolveLauncherDownloadMessages } from '../locales/launcher-download'

const repository = 'KiraAI-Dev/KiraAI-Launcher'
const releasesUrl = `https://github.com/${repository}/releases`
const latestReleaseUrl = `https://api.github.com/repos/${repository}/releases/latest`

interface GitHubAsset {
  name: string
  browser_download_url: string
  size: number
}

interface GitHubRelease {
  tag_name: string
  body: string
  published_at: string
  html_url: string
  assets: GitHubAsset[]
}

type Platform = 'windows' | 'macos' | 'linux' | 'unknown'
type Architecture = 'x64' | 'arm64' | 'universal'

interface DownloadAsset {
  name: string
  url: string
  size: number
  platform: Exclude<Platform, 'unknown'>
  kind: string
  architecture: Architecture
}

interface DownloadVariant {
  id: string
  kinds: string[]
  title: string
  description: string
  assets: DownloadAsset[]
}

interface DownloadPlatform {
  id: Exclude<Platform, 'unknown'>
  title: string
  variants: DownloadVariant[]
}

const { lang } = useData()
const loading = ref(true)
const error = ref('')
const release = ref<GitHubRelease | null>(null)
const assets = ref<DownloadAsset[]>([])
const platform = ref<Platform>('unknown')
const architecture = ref<Architecture>('x64')
const releaseNotesRenderer = new MarkdownIt({ html: false, linkify: true })
releaseNotesRenderer.renderer.rules.link_open = (tokens, index, options, _environment, self) => {
  tokens[index].attrSet('target', '_blank')
  tokens[index].attrSet('rel', 'noopener noreferrer')
  return self.renderToken(tokens, index, options)
}

const text = computed(() => resolveLauncherDownloadMessages(lang.value))

const platformName = computed(() => text.value[platform.value] ?? text.value.unknown)
const architectureName = computed(() => text.value[architecture.value])
const renderedReleaseNotes = computed(() => release.value?.body ? releaseNotesRenderer.render(release.value.body) : '')

function getArchitecture(name: string): Architecture {
  const normalized = name.toLowerCase()
  if (normalized.includes('arm64') || normalized.includes('aarch64')) return 'arm64'
  if (normalized.includes('x64') || normalized.includes('amd64') || normalized.includes('x86_64')) return 'x64'
  return 'universal'
}

function classifyAsset(asset: GitHubAsset): DownloadAsset | null {
  const normalized = asset.name.toLowerCase()

  if (normalized.endsWith('.blockmap') || normalized.endsWith('.yml') || normalized.endsWith('.yaml')) return null

  const base = {
    name: asset.name,
    url: asset.browser_download_url,
    size: asset.size,
    architecture: getArchitecture(asset.name),
  }

  if (normalized.endsWith('.exe')) {
    const isInstaller = normalized.includes('setup') || normalized.includes('installer') || normalized.includes('install') || normalized.includes('nsis')
    return { ...base, platform: 'windows', kind: isInstaller ? 'installer' : 'portable' }
  }
  if (normalized.endsWith('.dmg')) return { ...base, platform: 'macos', kind: 'diskImage' }
  if (normalized.endsWith('.appimage')) return { ...base, platform: 'linux', kind: 'appImage' }
  if (normalized.endsWith('.deb')) return { ...base, platform: 'linux', kind: 'deb' }
  if (normalized.endsWith('.rpm')) return { ...base, platform: 'linux', kind: 'rpm' }
  if (normalized.endsWith('.zip')) {
    return normalized.includes('portable') ? { ...base, platform: 'macos', kind: 'portable' } : null
  }
  if (normalized.endsWith('.tar.gz') || normalized.endsWith('.tgz')) return { ...base, platform: 'linux', kind: 'linuxArchive' }

  return null
}

function detectEnvironment() {
  const userAgent = navigator.userAgent.toLowerCase()
  if (userAgent.includes('windows')) platform.value = 'windows'
  else if (userAgent.includes('macintosh') || userAgent.includes('mac os')) platform.value = 'macos'
  else if (userAgent.includes('linux')) platform.value = 'linux'

  if (userAgent.includes('arm64') || userAgent.includes('aarch64')) architecture.value = 'arm64'
}

function isCompatible(asset: DownloadAsset) {
  return asset.architecture === 'universal' || asset.architecture === architecture.value
}

const recommendedAssets = computed(() => {
  if (platform.value === 'unknown') return []

  const matchingAssets = assets.value.filter(asset => asset.platform === platform.value && isCompatible(asset))
  const preferredKinds: Record<Exclude<Platform, 'unknown'>, string[]> = {
    windows: ['installer', 'portable'],
    macos: ['diskImage', 'portable'],
    linux: ['deb', 'rpm', 'appImage', 'linuxArchive'],
  }

  const recommended = [] as DownloadAsset[]
  for (const kind of preferredKinds[platform.value]) {
    const match = matchingAssets.find(asset => asset.kind === kind)
    if (match) recommended.push(match)
  }

  return recommended
})

const downloadPlatforms = computed<DownloadPlatform[]>(() => {
  const platformDefinitions: Array<
    Omit<DownloadPlatform, 'variants'> & { variants: Array<Omit<DownloadVariant, 'assets'>> }
  > = [
    {
      id: 'windows',
      title: text.value.windows,
      variants: [
        { id: 'windows-installer', kinds: ['installer'], title: text.value.installer, description: text.value.installerDescription },
        { id: 'windows-portable', kinds: ['portable'], title: text.value.portable, description: text.value.portableDescription },
      ],
    },
    {
      id: 'macos',
      title: text.value.macos,
      variants: [
        { id: 'macos-installer', kinds: ['diskImage'], title: text.value.installer, description: text.value.diskImageDescription },
        { id: 'macos-portable', kinds: ['portable'], title: text.value.portable, description: text.value.portableDescription },
      ],
    },
    {
      id: 'linux',
      title: text.value.linux,
      variants: [
        { id: 'linux-installer', kinds: ['deb', 'rpm'], title: text.value.installer, description: text.value.linuxInstallerDescription },
        { id: 'linux-portable', kinds: ['appImage', 'linuxArchive'], title: text.value.portable, description: text.value.linuxPortableDescription },
      ],
    },
  ]

  return platformDefinitions.map(platformDefinition => ({
    ...platformDefinition,
    variants: platformDefinition.variants.map(variant => ({
      ...variant,
      assets: assets.value
        .filter(asset => asset.platform === platformDefinition.id && variant.kinds.includes(asset.kind))
        .sort((a, b) => archRank(b.architecture) - archRank(a.architecture) || a.name.localeCompare(b.name)),
    })),
  })).filter(platformDefinition => platformDefinition.variants.some(variant => variant.assets.length > 0))
})

function archRank(value: Architecture) {
  return value === 'x64' ? 3 : value === 'arm64' ? 2 : 1
}

function formatFileSize(size: number) {
  return size ? `${(size / 1024 / 1024).toFixed(1)} MB` : '—'
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat(text.value.dateLocale, {
    year: 'numeric', month: 'long', day: 'numeric'
  }).format(new Date(date))
}

function kindName(kind: string) {
  return text.value[kind as keyof typeof text.value] ?? kind
}

function architectureLabel(value: Architecture) {
  return text.value[value]
}

function scrollToDownloads() {
  document.getElementById('launcher-downloads')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

async function fetchLatestRelease() {
  try {
    const response = await fetch(latestReleaseUrl, { headers: { Accept: 'application/vnd.github+json' } })
    if (!response.ok) throw new Error(`HTTP ${response.status}`)

    release.value = await response.json() as GitHubRelease
    assets.value = release.value.assets.map(classifyAsset).filter((asset): asset is DownloadAsset => asset !== null)
  } catch (fetchError) {
    error.value = fetchError instanceof Error ? fetchError.message : 'Unknown error'
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  detectEnvironment()
  fetchLatestRelease()
})
</script>

<template>
  <section class="launcher-download" :aria-label="text.download">
    <div v-if="loading" class="launcher-download__state">
      <span class="launcher-download__spinner" aria-hidden="true" />
      <p>{{ text.loading }}</p>
    </div>

    <div v-else-if="error" class="launcher-download__state launcher-download__state--error">
      <p>{{ text.unavailable }}</p>
      <a :href="releasesUrl" target="_blank" rel="noreferrer">{{ text.releases }} ↗</a>
    </div>

    <template v-else-if="release">
      <header class="launcher-download__release">
        <a :href="release.html_url" target="_blank" rel="noreferrer" class="launcher-download__version">{{ release.tag_name }}</a>
        <time :datetime="release.published_at">{{ formatDate(release.published_at) }}</time>
      </header>

      <section v-if="recommendedAssets.length" class="launcher-download__recommendation">
        <div class="launcher-download__recommendation-header">
          <div>
            <p>{{ text.detected }}</p>
            <strong>{{ platformName }} <span>{{ architectureName }}</span></strong>
          </div>
          <button type="button" @click="scrollToDownloads">{{ text.otherSystem }}</button>
        </div>

        <div class="launcher-download__primary-actions">
          <a
            v-for="asset in recommendedAssets"
            :key="asset.name"
            :href="asset.url"
            class="launcher-download__primary-action"
          >
            <span>
              <strong>{{ text.download }}</strong>
              <small>{{ kindName(asset.kind) }} · {{ architectureLabel(asset.architecture) }}</small>
            </span>
            <em>{{ formatFileSize(asset.size) }}</em>
          </a>
        </div>

        <details v-if="release.body" class="launcher-download__notes">
          <summary>{{ text.releaseNotes }}</summary>
          <div class="launcher-download__notes-content" v-html="renderedReleaseNotes" />
        </details>
      </section>

      <section id="launcher-downloads" class="launcher-download__all-downloads">
        <h2>{{ text.allDownloads }}</h2>
        <p v-if="!downloadPlatforms.length" class="launcher-download__empty">{{ text.noFiles }}</p>
        <div v-else class="launcher-download__platforms">
          <section v-for="platformDownload in downloadPlatforms" :key="platformDownload.id" class="launcher-download__platform">
            <header>
              <h3>{{ platformDownload.title }}</h3>
            </header>
            <div class="launcher-download__variants">
              <section v-for="variant in platformDownload.variants" :key="variant.id" class="launcher-download__variant">
                <header>
                  <h4>{{ variant.title }}</h4>
                  <p>{{ variant.description }}</p>
                </header>
                <p v-if="!variant.assets.length" class="launcher-download__unavailable">{{ text.notAvailable }}</p>
                <div v-else class="launcher-download__assets">
                  <a v-for="asset in variant.assets" :key="asset.name" :href="asset.url" :title="asset.name">
                    <span>
                      <strong>{{ architectureLabel(asset.architecture) }}</strong>
                      <small>{{ asset.name }}</small>
                    </span>
                    <em>{{ formatFileSize(asset.size) }}</em>
                  </a>
                </div>
              </section>
            </div>
          </section>
        </div>
      </section>

      <p class="launcher-download__history"><a :href="releasesUrl" target="_blank" rel="noreferrer">{{ text.history }} ↗</a></p>
    </template>
  </section>
</template>

<style scoped>
.launcher-download { margin: 28px 0 8px; color: var(--vp-c-text-1); }
.launcher-download__state { display: grid; place-items: center; gap: 12px; min-height: 180px; text-align: center; color: var(--vp-c-text-2); }
.launcher-download__state p { margin: 0; }
.launcher-download__state--error { color: var(--vp-c-danger-1); }
.launcher-download__state--error a { color: var(--vp-c-brand-1); font-weight: 600; }
.launcher-download__spinner { width: 28px; height: 28px; border: 3px solid var(--vp-c-divider); border-top-color: var(--vp-c-brand-1); border-radius: 50%; animation: launcher-spin .8s linear infinite; }
.launcher-download__release { display: flex; align-items: center; gap: 14px; margin-bottom: 22px; color: var(--vp-c-text-2); }
.launcher-download__version { padding: 4px 14px; border-radius: 999px; background: var(--vp-c-brand-soft); color: var(--vp-c-brand-1); font-size: 1.35rem; font-weight: 800; text-decoration: none; }
.launcher-download__recommendation { padding: 24px; border: 1px solid var(--vp-c-divider); border-radius: 14px; background: var(--vp-c-bg-soft); }
.launcher-download__recommendation-header { display: flex; justify-content: space-between; align-items: center; gap: 16px; margin-bottom: 18px; }
.launcher-download__recommendation-header p { margin: 0 0 3px; color: var(--vp-c-text-2); font-size: .9rem; }
.launcher-download__recommendation-header strong { font-size: 1.1rem; }
.launcher-download__recommendation-header strong span { display: inline-block; margin-left: 6px; padding: 2px 7px; border-radius: 5px; background: var(--vp-c-brand-soft); color: var(--vp-c-brand-1); font-size: .76rem; vertical-align: middle; }
.launcher-download__recommendation-header button { padding: 0; border: 0; border-bottom: 1px dashed var(--vp-c-text-3); background: transparent; color: var(--vp-c-text-2); cursor: pointer; font: inherit; font-size: .85rem; }
.launcher-download__recommendation-header button:hover { color: var(--vp-c-brand-1); border-color: var(--vp-c-brand-1); }
.launcher-download__primary-actions { display: grid; gap: 12px; }
.launcher-download__primary-action, .launcher-download__assets a { display: flex; align-items: center; justify-content: space-between; gap: 14px; text-decoration: none; }
.launcher-download__primary-action { padding: 18px 20px; border: 1.5px solid var(--vp-c-brand-1); border-radius: 10px; background: var(--vp-c-bg); transition: transform .2s, background .2s, box-shadow .2s; }
.launcher-download__primary-action:hover { background: var(--vp-c-brand-soft); transform: translateY(-2px); box-shadow: 0 6px 18px color-mix(in srgb, var(--vp-c-brand-1) 15%, transparent); }
.launcher-download__primary-action strong { display: block; color: var(--vp-c-brand-1); font-size: 1.08rem; }
.launcher-download__primary-action small, .launcher-download__assets small { display: block; margin-top: 5px; color: var(--vp-c-text-2); font-size: .82rem; }
.launcher-download__primary-action em, .launcher-download__assets em { padding: 4px 8px; border-radius: 5px; background: var(--vp-c-default-soft); color: var(--vp-c-text-2); font-size: .8rem; font-style: normal; white-space: nowrap; }
.launcher-download__all-downloads { margin-top: 44px; scroll-margin-top: 90px; }
.launcher-download__all-downloads h2 { margin: 0 0 22px; border: 0; padding: 0; font-size: 1.5rem; }
.launcher-download__platforms { display: grid; gap: 36px; }
.launcher-download__platform > header { margin-bottom: 18px; padding-bottom: 10px; border-bottom: 1px solid var(--vp-c-divider); }
.launcher-download__platform h3 { margin: 0; border: 0; padding: 0; font-size: 1.25rem; }
.launcher-download__variants { display: grid; gap: 24px; }
.launcher-download__variant > header { margin-bottom: 11px; }
.launcher-download__variant h4 { margin: 0; border: 0; padding: 0; font-size: 1.02rem; }
.launcher-download__variant p { margin: 4px 0 0; color: var(--vp-c-text-2); font-size: .85rem; }
.launcher-download__unavailable { padding: 12px 14px; border: 1px dashed var(--vp-c-divider); border-radius: 8px; background: var(--vp-c-bg-soft); color: var(--vp-c-text-3) !important; }
.launcher-download__assets { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 10px; }
.launcher-download__assets a { padding: 12px 14px; border: 1px solid var(--vp-c-divider); border-radius: 8px; background: var(--vp-c-bg-soft); transition: border-color .2s ease, background-color .2s ease; }
.launcher-download__assets a:hover { border-color: var(--vp-c-brand-1); background: var(--vp-c-bg-alt); }
.launcher-download__assets strong { color: var(--vp-c-text-1); font-size: .92rem; }
.launcher-download__assets small { max-width: 190px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.launcher-download__notes { margin-top: 20px; color: var(--vp-c-text-2); }
.launcher-download__notes summary { cursor: pointer; font-weight: 600; }
.launcher-download__notes-content { overflow: auto; max-height: 360px; margin-top: 12px; padding: 14px; border: 1px solid var(--vp-c-divider); border-radius: 8px; background: var(--vp-c-bg); font-size: .9rem; line-height: 1.65; }
.launcher-download__notes-content :deep(h1), .launcher-download__notes-content :deep(h2), .launcher-download__notes-content :deep(h3), .launcher-download__notes-content :deep(h4) { margin: 0 0 12px; border: 0; padding: 0; font-size: 1.05rem; color: var(--vp-c-text-1); }
.launcher-download__notes-content :deep(p), .launcher-download__notes-content :deep(ul), .launcher-download__notes-content :deep(ol) { margin: 0 0 12px; }
.launcher-download__notes-content :deep(ul), .launcher-download__notes-content :deep(ol) { padding-left: 22px; }
.launcher-download__notes-content :deep(a) { color: var(--vp-c-brand-1); font-weight: 500; }
.launcher-download__notes-content :deep(p:last-child), .launcher-download__notes-content :deep(ul:last-child), .launcher-download__notes-content :deep(ol:last-child) { margin-bottom: 0; }
.launcher-download__history { margin-top: 28px; text-align: center; }
.launcher-download__history a { color: var(--vp-c-brand-1); font-weight: 600; }
@keyframes launcher-spin { to { transform: rotate(360deg); } }
@media (max-width: 640px) { .launcher-download__release, .launcher-download__recommendation-header { align-items: flex-start; flex-direction: column; } .launcher-download__recommendation { padding: 18px; } .launcher-download__primary-action { align-items: flex-start; flex-direction: column; } .launcher-download__primary-action em { align-self: flex-end; } .launcher-download__assets { grid-template-columns: 1fr; } }
</style>
