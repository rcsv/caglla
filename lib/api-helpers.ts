import { auth } from './firebase'

export async function getIdToken(): Promise<string | null> {
  const user = auth.currentUser
  if (!user) return null
  
  try {
    return await user.getIdToken()
  } catch (error) {
    console.error('Error getting ID token:', error)
    return null
  }
}

export async function makeAuthenticatedRequest(url: string, options: RequestInit = {}): Promise<Response> {
  const token = await getIdToken()
  
  if (!token) {
    throw new Error('User not authenticated')
  }

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
    ...options.headers,
  }

  return fetch(url, {
    ...options,
    headers,
  })
}
