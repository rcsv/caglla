import { generateSlug, generateUniqueSlug, validateSlug, slugToDisplayName } from '../slug'

describe('generateSlug', () => {
  it('should convert English text to lowercase slug', () => {
    expect(generateSlug('Tokyo')).toBe('tokyo')
    expect(generateSlug('New York')).toBe('new-york')
    expect(generateSlug('San Francisco')).toBe('san-francisco')
  })

  it('should handle special characters', () => {
    expect(generateSlug('Tokyo!@#$%')).toBe('tokyo')
    expect(generateSlug('New York & Paris')).toBe('new-york-paris')
  })

  it('should generate hash slug for Japanese only text', () => {
    const result = generateSlug('東京')
    expect(result).toMatch(/^[a-f0-9]{8}$/)
  })

  it('should generate hash slug for empty result', () => {
    const result = generateSlug('!!!')
    expect(result).toMatch(/^[a-f0-9]{8}$/)
  })

  it('should limit length to 50 characters', () => {
    const longText = 'a'.repeat(100) + ' ' + 'b'.repeat(100)
    const result = generateSlug(longText)
    expect(result.length).toBeLessThanOrEqual(50)
  })

  it('should trim leading and trailing hyphens', () => {
    expect(generateSlug('-hello-')).toBe('hello')
    expect(generateSlug('---hello---')).toBe('hello')
  })

  it('should collapse multiple hyphens', () => {
    expect(generateSlug('hello---world')).toBe('hello-world')
    expect(generateSlug('a   b   c')).toBe('a-b-c')
  })
})

describe('generateUniqueSlug', () => {
  it('should return original slug if not in existing slugs', () => {
    expect(generateUniqueSlug('tokyo', ['new-york'])).toBe('tokyo')
  })

  it('should append number if slug exists', () => {
    expect(generateUniqueSlug('tokyo', ['tokyo'])).toBe('tokyo-1')
    expect(generateUniqueSlug('tokyo', ['tokyo', 'tokyo-1'])).toBe('tokyo-2')
  })

  it('should handle multiple duplicates', () => {
    const existing = ['tokyo', 'tokyo-1', 'tokyo-2']
    expect(generateUniqueSlug('tokyo', existing)).toBe('tokyo-3')
  })

  it('should generate hash for empty slug', () => {
    const result = generateUniqueSlug('東京', [])
    expect(result).toMatch(/^[a-f0-9]{8}$/)
  })

  it('should append number to hash slug if duplicate', () => {
    const hashSlug = generateUniqueSlug('東京', [])
    const result = generateUniqueSlug('東京', [hashSlug])
    expect(result).toMatch(/^[a-f0-9]{8}-[0-9]+$/)
  })
})

describe('validateSlug', () => {
  it('should validate correct slugs', () => {
    expect(validateSlug('tokyo')).toEqual({ isValid: true })
    expect(validateSlug('new-york')).toEqual({ isValid: true })
    expect(validateSlug('san-francisco-123')).toEqual({ isValid: true })
  })

  it('should reject empty slug', () => {
    expect(validateSlug('')).toEqual({ 
      isValid: false, 
      error: 'スラッグは必須です' 
    })
  })

  it('should reject slugs with uppercase letters', () => {
    expect(validateSlug('Tokyo')).toEqual({ 
      isValid: false, 
      error: 'スラッグは小文字の英数字とハイフンのみ使用できます' 
    })
  })

  it('should reject slugs with special characters', () => {
    expect(validateSlug('tokyo!')).toEqual({ 
      isValid: false, 
      error: 'スラッグは小文字の英数字とハイフンのみ使用できます' 
    })
  })

  it('should reject slugs starting with hyphen', () => {
    expect(validateSlug('-tokyo')).toEqual({ 
      isValid: false, 
      error: 'スラッグはハイフンで始まったり終わったりできません' 
    })
  })

  it('should reject slugs ending with hyphen', () => {
    expect(validateSlug('tokyo-')).toEqual({ 
      isValid: false, 
      error: 'スラッグはハイフンで始まったり終わったりできません' 
    })
  })

  it('should reject slugs with consecutive hyphens', () => {
    expect(validateSlug('tokyo--new-york')).toEqual({ 
      isValid: false, 
      error: 'スラッグに連続するハイフンは使用できません' 
    })
  })

  it('should reject slugs longer than 50 characters', () => {
    const longSlug = 'a'.repeat(51)
    expect(validateSlug(longSlug)).toEqual({ 
      isValid: false, 
      error: 'スラッグは50文字以下である必要があります' 
    })
  })
})

describe('slugToDisplayName', () => {
  it('should convert slug to title case', () => {
    expect(slugToDisplayName('tokyo')).toBe('Tokyo')
    expect(slugToDisplayName('new-york')).toBe('New York')
    expect(slugToDisplayName('san-francisco')).toBe('San Francisco')
  })

  it('should handle single word', () => {
    expect(slugToDisplayName('tokyo')).toBe('Tokyo')
  })

  it('should handle multiple words', () => {
    expect(slugToDisplayName('tokyo-new-york-paris')).toBe('Tokyo New York Paris')
  })
})

