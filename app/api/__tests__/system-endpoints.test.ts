import packageJson from '../../../package.json'
import { GET as versionGET } from '../version/route'
import { GET as statusGET } from '../status/route'
import { GET as healthGET } from '../health/route'
import { POST as migratePOST } from '../migrate/places-to-cache/route'
import { GET as selfCheckGET } from '../self-check/route'
import { validateServerEnvironment } from '@/lib/core/env-validation'

jest.mock('next/server', () => ({
  NextResponse: {
    json: (data: unknown, init?: ResponseInit) => new Response(JSON.stringify(data), init),
  },
}))

jest.mock('@/lib/firebase/admin', () => ({
  adminAuth: {},
  adminDb: {},
}))

jest.mock('@/lib/core/env-validation', () => ({
  validateServerEnvironment: jest.fn(),
}))

describe('API system endpoints', () => {
  const envKeys = ['NEXT_PUBLIC_GOOGLE_PLACES_API_KEY', 'NEXT_PUBLIC_GOOGLE_MAPS_API_KEY'] as const
  const originalEnv: Record<string, string | undefined> = {}
  const validateEnvMock = validateServerEnvironment as jest.Mock

  beforeAll(() => {
    envKeys.forEach((key) => {
      originalEnv[key] = process.env[key]
    })
  })

  afterEach(() => {
    validateEnvMock.mockReset()
    envKeys.forEach((key) => {
      const original = originalEnv[key]
      if (original === undefined) {
        delete process.env[key]
      } else {
        process.env[key] = original
      }
    })
  })

  it('returns package metadata from /api/version', async () => {
    const response = await versionGET()
    expect(response.status).toBe(200)

    const payload = await response.json()
    expect(payload.version).toBe(packageJson.version)
    expect(typeof payload.generatedAt).toBe('string')
  })

  it('returns ok=true from /api/status', async () => {
    const response = await statusGET()
    expect(response.status).toBe(200)

    const payload = await response.json()
    expect(payload.ok).toBe(true)
    expect(typeof payload.generatedAt).toBe('string')
  })

  it('returns plain text health check', async () => {
    const response = await healthGET()
    expect(response.status).toBe(200)

    const text = await response.text()
    expect(text).toBe('OK')
  })

  it('requires authorization for /api/migrate/places-to-cache', async () => {
    const mockRequest = { headers: { get: () => null } } as any
    const response = await migratePOST(mockRequest)
    expect(response.status).toBe(401)

    const payload = await response.json()
    expect(payload.error).toBe('Authorization required')
  })

  it('reports healthy state from /api/self-check when dependencies are ready', async () => {
    validateEnvMock.mockImplementation(() => {})
    process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY = 'test'
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY = 'test'

    const response = await selfCheckGET()
    expect(response.status).toBe(200)

    const payload = await response.json()
    expect(payload.ok).toBe(true)
    expect(payload.services.environment.ok).toBe(true)
    expect(payload.services.firebase.initialized).toBe(true)
    expect(payload.services.googleApis.placesKeyPresent).toBe(true)
    expect(payload.services.googleApis.mapsKeyPresent).toBe(true)
  })

  it('bubbles up environment validation errors in /api/self-check', async () => {
    validateEnvMock.mockImplementation(() => {
      throw new Error('missing env')
    })
    process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY = 'test'
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY = 'test'

    const response = await selfCheckGET()
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(payload.ok).toBe(false)
    expect(payload.services.environment.ok).toBe(false)
    expect(payload.services.environment.error).toContain('missing env')
  })
})
