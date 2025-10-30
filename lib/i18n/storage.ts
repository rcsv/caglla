import type { SupportedLanguage } from '@/lib/core/types'
import { isSupportedLanguage } from '@/lib/utils/language'

const COOKIE_NAME = 'lang'

export function getLanguageOverrideClient(): SupportedLanguage | undefined {
  try {
    if (typeof document !== 'undefined') {
      const match = document.cookie.match(new RegExp(`(?:^|; )${COOKIE_NAME}=([^;]*)`))
      const cookieLang = match ? decodeURIComponent(match[1]) : undefined
      if (cookieLang && isSupportedLanguage(cookieLang)) return cookieLang
    }
    if (typeof localStorage !== 'undefined') {
      const stored = localStorage.getItem(COOKIE_NAME) || undefined
      if (stored && isSupportedLanguage(stored)) return stored
    }
  } catch (_) {}
  return undefined
}

export function setLanguageOverrideClient(lang: SupportedLanguage | ''): void {
  try {
    if (lang === '') {
      // Clear override
      if (typeof document !== 'undefined') {
        document.cookie = `${COOKIE_NAME}=; Max-Age=0; Path=/`
      }
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem(COOKIE_NAME)
      }
      return
    }
    if (!isSupportedLanguage(lang)) return
    // Cookie: 180 days
    if (typeof document !== 'undefined') {
      const maxAge = 60 * 60 * 24 * 180
      document.cookie = `${COOKIE_NAME}=${encodeURIComponent(lang)}; Max-Age=${maxAge}; Path=/`
    }
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(COOKIE_NAME, lang)
    }
  } catch (_) {}
}


