import {
  requireGooglePlacesApiKey,
  requireGoogleGeocodingApiKey,
  requireUnsplashApiKey,
  withExternalApiErrorHandler,
  parseApiResponse,
} from '../external-api-helpers'

// Next.js serverモジュールをモック
jest.mock('next/server', () => {
  class MockNextResponse extends Response {
    static json(data: unknown, init?: ResponseInit) {
      return new MockNextResponse(JSON.stringify(data), {
        ...init,
        headers: {
          'Content-Type': 'application/json',
          ...init?.headers,
        },
      })
    }
  }
  return {
    NextResponse: MockNextResponse,
  }
})

// loggerをモック
jest.mock('@/lib/core/logger', () => ({
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn(),
  debug: jest.fn(),
}))

// error-handlerをモック（NextResponseを使用しているため）
jest.mock('@/lib/core/error-handler', () => {
  const { NextResponse } = require('next/server')
  return {
    internalError: (message: string) => NextResponse.json({ error: message }, { status: 500 }),
    handleApiError: (error: Error, endpoint: string) => {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    },
  }
})

import { NextResponse } from 'next/server'
import logger from '@/lib/core/logger'

describe('external-api-helpers', () => {
  const originalEnv = process.env

  beforeEach(() => {
    // 環境変数をリセット
    jest.resetModules()
    process.env = { ...originalEnv }
    jest.clearAllMocks()
  })

  afterAll(() => {
    process.env = originalEnv
  })

  describe('requireGooglePlacesApiKey', () => {
    it('should return API key when configured', () => {
      process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY = 'test-api-key'
      const result = requireGooglePlacesApiKey()
      expect(result).toBe('test-api-key')
    })

    it('should return NextResponse error when API key is not configured', () => {
      delete process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY
      const result = requireGooglePlacesApiKey()
      expect(result).toBeInstanceOf(NextResponse)
      
      if (result instanceof NextResponse) {
        expect(result.status).toBe(500)
      }
    })

    it('should return NextResponse error when API key is empty string', () => {
      process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY = ''
      const result = requireGooglePlacesApiKey()
      expect(result).toBeInstanceOf(NextResponse)
      
      if (result instanceof NextResponse) {
        expect(result.status).toBe(500)
      }
    })
  })

  describe('requireGoogleGeocodingApiKey', () => {
    it('should return API key when configured', () => {
      process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY = 'test-geocoding-key'
      const result = requireGoogleGeocodingApiKey()
      expect(result).toBe('test-geocoding-key')
    })

    it('should return NextResponse error when API key is not configured', () => {
      delete process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY
      const result = requireGoogleGeocodingApiKey()
      expect(result).toBeInstanceOf(NextResponse)
      
      if (result instanceof NextResponse) {
        expect(result.status).toBe(500)
      }
    })
  })

  describe('requireUnsplashApiKey', () => {
    it('should return NEXT_PUBLIC_UNSPLASH_ACCESS_KEY when configured', () => {
      process.env.NEXT_PUBLIC_UNSPLASH_ACCESS_KEY = 'test-public-key'
      delete process.env.UNSPLASH_ACCESS_KEY
      const result = requireUnsplashApiKey()
      expect(result).toBe('test-public-key')
    })

    it('should return UNSPLASH_ACCESS_KEY when NEXT_PUBLIC_UNSPLASH_ACCESS_KEY is not configured', () => {
      delete process.env.NEXT_PUBLIC_UNSPLASH_ACCESS_KEY
      process.env.UNSPLASH_ACCESS_KEY = 'test-private-key'
      const result = requireUnsplashApiKey()
      expect(result).toBe('test-private-key')
    })

    it('should prefer NEXT_PUBLIC_UNSPLASH_ACCESS_KEY over UNSPLASH_ACCESS_KEY', () => {
      process.env.NEXT_PUBLIC_UNSPLASH_ACCESS_KEY = 'test-public-key'
      process.env.UNSPLASH_ACCESS_KEY = 'test-private-key'
      const result = requireUnsplashApiKey()
      expect(result).toBe('test-public-key')
    })

    it('should return NextResponse error when neither API key is configured', () => {
      delete process.env.NEXT_PUBLIC_UNSPLASH_ACCESS_KEY
      delete process.env.UNSPLASH_ACCESS_KEY
      const result = requireUnsplashApiKey()
      expect(result).toBeInstanceOf(NextResponse)
      
      if (result instanceof NextResponse) {
        expect(result.status).toBe(500)
      }
    })
  })

  describe('withExternalApiErrorHandler', () => {
    it('should return API call result when successful', async () => {
      const mockData = { result: 'success' }
      const apiCall = jest.fn().mockResolvedValue(mockData)

      const result = await withExternalApiErrorHandler(
        apiCall,
        'Test API',
        '/api/test'
      )

      expect(result).toBe(mockData)
      expect(apiCall).toHaveBeenCalledTimes(1)
      expect(logger.error).not.toHaveBeenCalled()
    })

    it('should return NextResponse when API call throws Error', async () => {
      const error = new Error('API call failed')
      const apiCall = jest.fn().mockRejectedValue(error)

      const result = await withExternalApiErrorHandler(
        apiCall,
        'Test API',
        '/api/test'
      )

      expect(result).toBeInstanceOf(NextResponse)
      expect(logger.error).toHaveBeenCalledWith('Test API error:', error)
      expect(logger.error).toHaveBeenCalledWith(
        'Error details: API call failed',
        { endpoint: '/api/test', apiName: 'Test API' }
      )
    })

    it('should return NextResponse when API call throws non-Error', async () => {
      const error = 'String error'
      const apiCall = jest.fn().mockRejectedValue(error)

      const result = await withExternalApiErrorHandler(
        apiCall,
        'Test API',
        '/api/test'
      )

      expect(result).toBeInstanceOf(NextResponse)
      expect(logger.error).toHaveBeenCalledWith('Test API error:', error)
    })

    it('should handle async errors correctly', async () => {
      const error = new Error('Network error')
      const apiCall = jest.fn().mockImplementation(async () => {
        throw error
      })

      const result = await withExternalApiErrorHandler(
        apiCall,
        'Test API',
        '/api/test'
      )

      expect(result).toBeInstanceOf(NextResponse)
      expect(apiCall).toHaveBeenCalledTimes(1)
    })
  })

  describe('parseApiResponse', () => {
    it('should return parsed JSON data when response is ok', async () => {
      const mockData = { result: 'success', data: { id: 1 } }
      const mockResponse = {
        ok: true,
        status: 200,
        statusText: 'OK',
        json: jest.fn().mockResolvedValue(mockData),
      } as unknown as Response

      const result = await parseApiResponse<typeof mockData>(
        mockResponse,
        'Test API',
        '/api/test'
      )

      expect(result).toEqual(mockData)
      expect(mockResponse.json).toHaveBeenCalledTimes(1)
      expect(logger.error).not.toHaveBeenCalled()
    })

    it('should return NextResponse when response is not ok', async () => {
      const errorData = { error: 'Not Found' }
      const mockResponse = {
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: jest.fn().mockResolvedValue(errorData),
      } as unknown as Response

      const result = await parseApiResponse(
        mockResponse,
        'Test API',
        '/api/test'
      )

      expect(result).toBeInstanceOf(NextResponse)
      expect(logger.error).toHaveBeenCalledWith('Test API error:', {
        status: 404,
        statusText: 'Not Found',
        errorData,
        endpoint: '/api/test',
      })
    })

    it('should handle JSON parse failure in error response', async () => {
      const mockResponse = {
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: jest.fn().mockRejectedValue(new Error('Invalid JSON')),
      } as unknown as Response

      const result = await parseApiResponse(
        mockResponse,
        'Test API',
        '/api/test'
      )

      expect(result).toBeInstanceOf(NextResponse)
      expect(logger.error).toHaveBeenCalledWith('Test API error:', {
        status: 500,
        statusText: 'Internal Server Error',
        errorData: {},
        endpoint: '/api/test',
      })
    })

    it('should return NextResponse when JSON parsing fails on successful response', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        statusText: 'OK',
        json: jest.fn().mockRejectedValue(new Error('Invalid JSON')),
      } as unknown as Response

      const result = await parseApiResponse(
        mockResponse,
        'Test API',
        '/api/test'
      )

      expect(result).toBeInstanceOf(NextResponse)
      expect(logger.error).toHaveBeenCalledWith(
        'Failed to parse Test API response:',
        expect.any(Error)
      )
    })

    it('should handle empty response body', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        statusText: 'OK',
        json: jest.fn().mockResolvedValue(null),
      } as unknown as Response

      const result = await parseApiResponse(
        mockResponse,
        'Test API',
        '/api/test'
      )

      expect(result).toBeNull()
      expect(logger.error).not.toHaveBeenCalled()
    })

    it('should preserve response data type', async () => {
      interface CustomData {
        id: number
        name: string
      }
      const mockData: CustomData = { id: 1, name: 'Test' }
      const mockResponse = {
        ok: true,
        status: 200,
        statusText: 'OK',
        json: jest.fn().mockResolvedValue(mockData),
      } as unknown as Response

      const result = await parseApiResponse<CustomData>(
        mockResponse,
        'Test API',
        '/api/test'
      )

      expect(result).toEqual(mockData)
      if (!(result instanceof NextResponse)) {
        expect(result.id).toBe(1)
        expect(result.name).toBe('Test')
      }
    })
  })

  describe('Integration: API Key + Error Handler', () => {
    it('should handle API key validation before API call', async () => {
      delete process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY
      
      const apiKeyResult = requireGooglePlacesApiKey()
      if (apiKeyResult instanceof NextResponse) {
        // API Keyがない場合はエラーレスポンスを返す
        expect(apiKeyResult.status).toBe(500)
        return
      }

      // API Keyがある場合のテスト（到達しない）
      const apiCall = jest.fn().mockResolvedValue({ result: 'success' })
      const result = await withExternalApiErrorHandler(
        apiCall,
        'Test API',
        '/api/test'
      )
      expect(result).toEqual({ result: 'success' })
    })

    it('should handle successful API call with valid API key', async () => {
      process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY = 'test-key'
      
      const apiKeyResult = requireGooglePlacesApiKey()
      expect(apiKeyResult).toBe('test-key')

      const mockData = { places: [{ id: '1', name: 'Test' }] }
      const apiCall = jest.fn().mockResolvedValue(mockData)

      const result = await withExternalApiErrorHandler(
        apiCall,
        'Google Places API',
        '/api/places/search'
      )

      expect(result).toEqual(mockData)
      expect(apiCall).toHaveBeenCalledTimes(1)
    })
  })
})

