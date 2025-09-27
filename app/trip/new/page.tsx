'use client'

import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { makeAuthenticatedRequest } from '@/lib/api-helpers'
import ImageUpload from '@/components/ImageUpload'
import { imageUploadHelpers } from '@/lib/image-upload'
import PlaceSearchInput from '@/components/PlaceSearchInput'
import { PlaceData } from '@/lib/firestore'

export default function NewTripPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    destination: '',
    destinationPlace: undefined as PlaceData | undefined,
    startDate: '',
    endDate: '',
    accessLevel: 'private' as 'private' | 'public',
    imageUrl: ''
  })
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!loading && !user) {
      router.push('/')
    }
  }, [user, loading, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setSubmitting(true)
    try {
      const response = await makeAuthenticatedRequest('/api/trips', {
        method: 'POST',
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          destination: formData.destination,
          destinationPlace: formData.destinationPlace,
          startDate: formData.startDate || null,
          endDate: formData.endDate || null,
          accessLevel: formData.accessLevel,
          imageUrl: formData.imageUrl || null,
        }),
      })

      if (response.ok) {
        const trip = await response.json()
        router.push(`/trip/${trip.id}`)
      } else {
        // 作成に失敗した場合、アップロードした画像を削除
        if (formData.imageUrl) {
          try {
            await imageUploadHelpers.deleteImage(formData.imageUrl)
            console.log('Failed creation image deleted:', formData.imageUrl)
          } catch (error) {
            console.error('Failed to delete image after creation failure:', error)
          }
        }
        console.error('Failed to create trip')
      }
    } catch (error) {
      // エラーが発生した場合、アップロードした画像を削除
      if (formData.imageUrl) {
        try {
          await imageUploadHelpers.deleteImage(formData.imageUrl)
          console.log('Error image deleted:', formData.imageUrl)
        } catch (deleteError) {
          console.error('Failed to delete image after error:', deleteError)
        }
      }
      console.error('Error creating trip:', error)
    } finally {
      setSubmitting(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleCancel = async () => {
    // キャンセル時にアップロードした画像を削除
    if (formData.imageUrl) {
      try {
        await imageUploadHelpers.deleteImage(formData.imageUrl)
        console.log('Cancelled image deleted:', formData.imageUrl)
      } catch (error) {
        console.error('Failed to delete cancelled image:', error)
      }
    }
    router.push('/home')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">読み込み中...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/home')}
                className="text-gray-600 hover:text-gray-900"
              >
                ← 戻る
              </button>
              <h1 className="text-2xl font-bold text-gray-900">新しい旅行を作成</h1>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm p-6">
            <div className="space-y-6">
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                  旅行のタイトル *
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="例: 沖縄旅行"
                />
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                  説明
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="旅行の詳細や目的を記入してください"
                />
              </div>

              <div>
                <label htmlFor="destination" className="block text-sm font-medium text-gray-700 mb-2">
                  目的地
                </label>
                <PlaceSearchInput
                  currentPlace={formData.destinationPlace}
                  onPlaceSelect={(place) => setFormData(prev => ({ 
                    ...prev, 
                    destinationPlace: place,
                    destination: place.name // 後方互換性のため
                  }))}
                  placeholder="目的地を検索..."
                  disabled={submitting}
                />
                {/* 従来のテキスト入力も残す（フォールバック用） */}
                <div className="mt-2">
                  <label htmlFor="destinationText" className="block text-xs text-gray-500 mb-1">
                    または手動で入力
                  </label>
                  <input
                    type="text"
                    id="destinationText"
                    name="destination"
                    value={formData.destination}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    placeholder="例: 沖縄県那覇市"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-2">
                    出発日
                  </label>
                  <input
                    type="date"
                    id="startDate"
                    name="startDate"
                    value={formData.startDate}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-2">
                    帰宅日
                  </label>
                  <input
                    type="date"
                    id="endDate"
                    name="endDate"
                    value={formData.endDate}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="accessLevel" className="block text-sm font-medium text-gray-700 mb-2">
                  公開設定
                </label>
                <select
                  id="accessLevel"
                  name="accessLevel"
                  value={formData.accessLevel}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="private">非公開（自分と共有ユーザーのみ）</option>
                  <option value="public">公開（誰でも閲覧可能）</option>
                </select>
              </div>

              <ImageUpload
                currentImageUrl={formData.imageUrl}
                onImageChange={(imageUrl) => setFormData(prev => ({ ...prev, imageUrl: imageUrl || '' }))}
                disabled={submitting}
              />
            </div>

            <div className="mt-8 flex justify-end space-x-4">
              <button
                type="button"
                onClick={handleCancel}
                className="px-4 py-2 text-gray-600 hover:text-gray-900 font-medium"
              >
                キャンセル
              </button>
              <button
                type="submit"
                disabled={submitting || !formData.title}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-2 px-6 rounded-lg transition duration-200"
              >
                {submitting ? '作成中...' : '旅行を作成'}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  )
}
