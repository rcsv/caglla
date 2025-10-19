export interface TimezoneOption {
  value: string
  label: string
  offset: number
  region: 'Global' | 'Asia' | 'Americas' | 'Europe' | 'Oceania' | 'Pacific'
}

export const TIMEZONE_OPTIONS: readonly TimezoneOption[] = [
  { value: 'UTC', label: 'UTC', offset: 0, region: 'Global' },
  { value: 'Asia/Tokyo', label: '日本 (Tokyo)', offset: 540, region: 'Asia' },
  { value: 'America/New_York', label: 'アメリカ (New York)', offset: -300, region: 'Americas' },
  { value: 'America/Los_Angeles', label: 'アメリカ (Los Angeles)', offset: -480, region: 'Americas' },
  { value: 'Europe/London', label: 'イギリス (London)', offset: 0, region: 'Europe' },
  { value: 'Europe/Paris', label: 'フランス (Paris)', offset: 60, region: 'Europe' },
  { value: 'Asia/Seoul', label: '韓国 (Seoul)', offset: 540, region: 'Asia' },
  { value: 'Asia/Shanghai', label: '中国 (Shanghai)', offset: 480, region: 'Asia' },
  { value: 'Asia/Hong_Kong', label: '香港 (Hong Kong)', offset: 480, region: 'Asia' },
  { value: 'Asia/Singapore', label: 'シンガポール (Singapore)', offset: 480, region: 'Asia' },
  { value: 'Asia/Bangkok', label: 'タイ (Bangkok)', offset: 420, region: 'Asia' },
  { value: 'Asia/Kolkata', label: 'インド (Kolkata)', offset: 330, region: 'Asia' },
  { value: 'Australia/Sydney', label: 'オーストラリア (Sydney)', offset: 600, region: 'Oceania' },
  { value: 'Pacific/Honolulu', label: 'ハワイ (Honolulu)', offset: -600, region: 'Pacific' },
  { value: 'Pacific/Guam', label: 'グアム (Guam)', offset: 600, region: 'Pacific' },
  { value: 'Pacific/Saipan', label: 'サイパン (Saipan)', offset: 600, region: 'Pacific' },
] as const

export function getTimezoneOption(timezone: string): TimezoneOption | undefined {
  return TIMEZONE_OPTIONS.find(opt => opt.value === timezone)
}

export function getTimezonesByRegion(region: TimezoneOption['region']): TimezoneOption[] {
  return TIMEZONE_OPTIONS.filter(opt => opt.region === region)
}

export function getPopularTimezones(): TimezoneOption[] {
  return TIMEZONE_OPTIONS.filter(opt => 
    ['Asia/Tokyo', 'America/New_York', 'Europe/London', 'Asia/Seoul'].includes(opt.value)
  )
}
