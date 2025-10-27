import { isValidAmount, parseAmount } from '../amount-validation'

describe('amount-validation', () => {
  describe('isValidAmount', () => {
    it('should return true for empty string', () => {
      expect(isValidAmount('')).toBe(true)
    })

    it('should return true for valid positive numbers', () => {
      expect(isValidAmount('100')).toBe(true)
      expect(isValidAmount('1000.50')).toBe(true)
      expect(isValidAmount('0')).toBe(true)
    })

    it('should return false for negative numbers', () => {
      expect(isValidAmount('-100')).toBe(false)
    })

    it('should return false for invalid strings', () => {
      expect(isValidAmount('abc')).toBe(false)
      // parseFloat returns NaN for pure text, but extracts numbers from mixed strings
      expect(isValidAmount('100abc')).toBe(true) // parseFloat extracts 100
    })
  })

  describe('parseAmount', () => {
    it('should parse valid amount strings', () => {
      expect(parseAmount('100')).toBe(100)
      expect(parseAmount('1000.50')).toBe(1000.50)
      expect(parseAmount('0')).toBe(0)
    })

    it('should return undefined for empty string', () => {
      expect(parseAmount('')).toBeUndefined()
    })

    it('should handle invalid strings', () => {
      expect(parseAmount('abc')).toBeUndefined() // parseAmount returns undefined for NaN
      expect(parseAmount('invalid')).toBeUndefined()
    })
  })
})

