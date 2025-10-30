'use client'

import React from 'react'
import { SUPPORTED_LANGUAGES, getUserLanguage } from '@/lib/utils/language'
import type { SupportedLanguage } from '@/lib/core/types'
import { setLanguageOverrideClient } from '@/lib/i18n/storage'

export function LanguageSwitcher({ className = '' }: { className?: string }) {
  const [value, setValue] = React.useState<SupportedLanguage>(getUserLanguage())

  const onChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const next = e.target.value as SupportedLanguage
    setValue(next)
    setLanguageOverrideClient(next)
    // 反映のため再読み込み
    window.location.reload()
  }

  return (
    <select
      value={value}
      onChange={onChange}
      className={`border border-gray-300 rounded px-2 py-1 text-sm bg-white ${className}`}
      aria-label="Language"
    >
      {SUPPORTED_LANGUAGES.map((lang) => (
        <option key={lang} value={lang}>{lang.toUpperCase()}</option>
      ))}
    </select>
  )
}

export default LanguageSwitcher


