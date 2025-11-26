import { t } from '@/lib/i18n'

// 営業時間を解析する関数
export function parseOpeningHours(
  weekdayText: string[] | undefined,
  language: 'ja' | 'en' = 'ja',
  now: Date = new Date(),
  utcOffsetMinutes?: number // 場所のタイムゾーンオフセット（分単位、例: JST = 540）
) {
  if (!weekdayText || weekdayText.length === 0) {
    return null
  }

  // 場所のローカル時刻を計算
  // 1. 現在のUTC時刻を取得
  const utcTime = new Date(now.getTime() + now.getTimezoneOffset() * 60000)
  
  // 2. 場所のタイムゾーンオフセットを適用（指定されていない場合はユーザーのローカル時刻を使用）
  const localTime = utcOffsetMinutes !== undefined
    ? new Date(utcTime.getTime() + utcOffsetMinutes * 60000)
    : now

  const today = localTime.getDay() // 0=日曜日, 1=月曜日, ..., 6=土曜日
  const currentTime = `${localTime.getHours().toString().padStart(2, '0')}:${localTime.getMinutes().toString().padStart(2, '0')}`

  // 曜日のマッピング（Google APIは月曜始まり）
  const dayIndexMap = [6, 0, 1, 2, 3, 4, 5] // [日, 月, 火, 水, 木, 金, 土]
  const todayText = weekdayText[dayIndexMap[today]]

  // 営業日を判定（多言語対応）
  const closedKeywords = language === 'ja'
    ? ['定休日', '休業日']
    : ['closed', 'Closed']
  const openDays = weekdayText.map(text => {
    return !closedKeywords.some(keyword => text.includes(keyword))
  })

  // 今日の営業時間を解析
  let isOpen = false
  let currentHours = ''

  if (todayText) {
    // 24時間営業のチェック（多言語対応）
    const open24hKeywords = language === 'ja'
      ? ['24 時間営業', '24時間営業']
      : ['24 hours', 'Open 24 hours', 'Open 24h']
    if (open24hKeywords.some(keyword => todayText.includes(keyword))) {
      isOpen = true
      currentHours = t('poi.openingHours.open24h', language)
    } else if (closedKeywords.some(keyword => todayText.includes(keyword))) {
      isOpen = false
      currentHours = t('poi.openingHours.closedDay', language)
    } else {
      // 営業時間文字列を正規化する関数（多言語対応）
      const normalizeTimeText = (text: string): string => {
        // 曜日名を除去（例: "Monday: " → ""）
        let cleaned = text.replace(/^(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday):\s*/i, '')

        if (language === 'ja') {
          // 日本語表記（例: "9時30分" → "09:30"）
          return cleaned
            .replace(/(\d+)時(\d+)分/g, (match, hour, minute) => {
              return `${hour.padStart(2, '0')}:${minute.padStart(2, '0')}`
            })
            .replace(/(\d+)時/g, (match, hour) => {
              return `${hour.padStart(2, '0')}:00`
            })
        } else {
          // 英語表記: AM/PMを24時間形式に変換
          // 例: "7:00 AM" → "07:00", "8:00 PM" → "20:00"
          return cleaned
            .replace(/(\d{1,2}):(\d{2})\s*AM/gi, (match, hour, minute) => {
              const h = parseInt(hour, 10)
              const hour24 = h === 12 ? 0 : h // 12:00 AM = 00:00
              return `${hour24.toString().padStart(2, '0')}:${minute}`
            })
            .replace(/(\d{1,2}):(\d{2})\s*PM/gi, (match, hour, minute) => {
              const h = parseInt(hour, 10)
              const hour24 = h === 12 ? 12 : h + 12 // 12:00 PM = 12:00, 1:00 PM = 13:00
              return `${hour24.toString().padStart(2, '0')}:${minute}`
            })
        }
      }

      // 営業時間文字列を正規化
      const normalizedText = normalizeTimeText(todayText)

      // 複数の営業時間を分割（カンマ区切り）
      const timeRanges = normalizedText.split(',').map(range => range.trim())

      // 各時間範囲を解析
      const parsedRanges = timeRanges.map(range => {
        // コロン区切りの時間形式を解析（AM/PM変換後の24時間形式）
        // 例: "07:00 – 20:00" または "07:00-20:00"
        const timeMatch = range.match(/(\d{1,2}):(\d{2})\s*[–-]\s*(\d{1,2}):(\d{2})/)
        if (timeMatch) {
          return {
            open: `${timeMatch[1].padStart(2, '0')}:${timeMatch[2]}`,
            close: `${timeMatch[3].padStart(2, '0')}:${timeMatch[4]}`
          }
        }
        return null
      }).filter((range): range is { open: string; close: string } => range !== null)

      // 現在時刻がどの営業時間内にあるかチェック
      isOpen = parsedRanges.some(range =>
        currentTime >= range.open && currentTime <= range.close
      )

      // 営業時間表示用文字列を生成
      if (parsedRanges.length > 0) {
        currentHours = parsedRanges.map(range =>
          `${range.open} - ${range.close}`
        ).join(', ')
      }
    }
  }

  // 開店30分前かどうかをチェック（営業時間外の場合のみ）
  let openingSoon = false
  if (!isOpen && todayText && !closedKeywords.some(keyword => todayText.includes(keyword))) {
    // 営業時間の文字列を正規化する関数を再利用
    const normalizeTimeText = (text: string): string => {
      let cleaned = text.replace(/^(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday):\s*/i, '')
      if (language === 'ja') {
        return cleaned
          .replace(/(\d+)時(\d+)分/g, (match, hour, minute) => {
            return `${hour.padStart(2, '0')}:${minute.padStart(2, '0')}`
          })
          .replace(/(\d+)時/g, (match, hour) => {
            return `${hour.padStart(2, '0')}:00`
          })
      } else {
        return cleaned
          .replace(/(\d{1,2}):(\d{2})\s*AM/gi, (match, hour, minute) => {
            const h = parseInt(hour, 10)
            const hour24 = h === 12 ? 0 : h
            return `${hour24.toString().padStart(2, '0')}:${minute}`
          })
          .replace(/(\d{1,2}):(\d{2})\s*PM/gi, (match, hour, minute) => {
            const h = parseInt(hour, 10)
            const hour24 = h === 12 ? 12 : h + 12
            return `${hour24.toString().padStart(2, '0')}:${minute}`
          })
      }
    }

    const normalizedText = normalizeTimeText(todayText)
    const timeRanges = normalizedText.split(',').map(range => range.trim())
    const parsedRanges = timeRanges.map(range => {
      const timeMatch = range.match(/(\d{1,2}):(\d{2})\s*[–-]\s*(\d{1,2}):(\d{2})/)
      if (timeMatch) {
        return {
          open: `${timeMatch[1].padStart(2, '0')}:${timeMatch[2]}`,
          close: `${timeMatch[3].padStart(2, '0')}:${timeMatch[4]}`
        }
      }
      return null
    }).filter((range): range is { open: string; close: string } => range !== null)

    // 開店30分前をチェック
    for (const range of parsedRanges) {
      const [openHour, openMinute] = range.open.split(':').map(Number)
      const [currentHour, currentMinute] = currentTime.split(':').map(Number)
      
      // 分単位に変換
      const openTimeInMinutes = openHour * 60 + openMinute
      const currentTimeInMinutes = currentHour * 60 + currentMinute
      
      // 30分前から開店時刻の直前までを「もうすぐ開店」とする
      if (currentTimeInMinutes >= openTimeInMinutes - 30 && currentTimeInMinutes < openTimeInMinutes) {
        openingSoon = true
        break
      }
    }
  }

  return {
    isOpen,
    openingSoon,
    currentHours,
    openDays,
    weekdayText
  }
}


