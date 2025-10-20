'use client'

import { useAuth } from '@/lib/contexts/auth'
import { useRouter, useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import type { Trip, User, PlaceData, Gender } from '@/lib/core/types'
import { getCountryFlag, getCountryNameJa } from '@/lib/utils/country-flags'
import { makeAuthenticatedRequest } from '@/lib/api/helpers'
import AvatarUpload from '@/components/ui/AvatarUpload'
import { CloseIcon } from '@/components/common/icons/CloseIcon'
import { PinIcon } from '@/components/common/icons/PinIcon'
import { MailIcon } from '@/components/common/icons/MailIcon'
import { UserIcon } from '@/components/common/icons/UserIcon'
import { getZIndexClass } from '@/lib/core/z-index'
import PlaceSearchInput from '@/components/common/PlaceSearchInput'
import { extractCountryFromAddress } from '@/lib/travel/country/utils'
import { SUPPORTED_LANGUAGES, LANGUAGE_NAMES } from '@/lib/utils/language'

export default function UserProfileBySlugPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const { userSlug } = useParams<{ userSlug: string }>()

  const [profileUser, setProfileUser] = useState<User | null>(null)
  const [publicTrips, setPublicTrips] = useState<Trip[]>([])
  const [profileLoading, setProfileLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [isFirstTimeSetup, setIsFirstTimeSetup] = useState(false)
  const [editForm, setEditForm] = useState({
    name: '',
    bio: '',
    home_address: '',
    home_place_id: '',
    home_country_code: '',
    gender: 'prefer_not_to_say' as 'male' | 'female' | 'other' | 'prefer_not_to_say',
    language: ''
  })

  useEffect(() => {
    if (!loading && !user) router.push('/')
  }, [user, loading, router])

  useEffect(() => {
    if (user && userSlug) fetchUserProfile()
  }, [user, userSlug])

  const fetchUserProfile = async () => {
    try {
      setProfileLoading(true)
      // 自分自身のプロフィール情報を取得
      const res = await makeAuthenticatedRequest('/api/users')
      if (res.ok) {
        const data = await res.json()
        setProfileUser(data.user)
        setEditForm({
          name: data.user.name || '',
          bio: data.user.bio || '',
          home_address: data.user.preferences?.home_address || '',
          home_place_id: data.user.preferences?.home_place_id || '',
          home_country_code: data.user.preferences?.home_country_code || '',
          gender: data.user.gender || 'prefer_not_to_say',
          language: data.user.preferences?.language || ''
        })
        
        // 初回セットアップの判定（bio、home_country_code、genderがすべて空の場合）
        const needsSetup = !data.user.bio && !data.user.preferences?.home_country_code && (!data.user.gender || data.user.gender === 'prefer_not_to_say')
        setIsFirstTimeSetup(needsSetup)
      }

      // 旅行一覧（公開）
      const tripsRes = await makeAuthenticatedRequest('/api/trips')
      if (tripsRes.ok) {
        const data = await tripsRes.json()
        const trips: Trip[] = data.trips || []
        setPublicTrips(trips.filter(t => t.access_level === 'public'))
      }
    } finally {
      setProfileLoading(false)
    }
  }

  const handleSave = async () => {
    if (!user) return
    
    try {
      setSaving(true)
      const response = await makeAuthenticatedRequest('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editForm.name,
          bio: editForm.bio,
          gender: editForm.gender,
          preferences: {
            home_address: editForm.home_address,
            home_place_id: editForm.home_place_id || undefined,
            home_country_code: editForm.home_country_code,
            language: editForm.language || undefined
          }
        })
      })
      
      if (response.ok) {
        const data = await response.json()
        setProfileUser(data.user)
        setIsEditing(false)
        setIsFirstTimeSetup(false) // セットアップ完了
      }
    } catch (error) {
      console.error('Failed to save profile:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleHomePlaceSelect = async (place: PlaceData | null) => {
    if (!place) {
      setEditForm(prev => ({ ...prev, home_address: '', home_place_id: '', home_country_code: '' }))
      return
    }
    const addressForCountry = place.formatted_address || place.name || ''
    let derivedCode = ''
    try {
      const result = await extractCountryFromAddress(addressForCountry)
      derivedCode = result.countryCode
    } catch {
      derivedCode = ''
    }
    setEditForm(prev => ({
      ...prev,
      home_address: place.formatted_address || place.name || '',
      home_place_id: (place as any).place_id || '',
      home_country_code: derivedCode
    }))
  }

  const handleImageChange = async (imageUrl: string | null) => {
    if (!user || !imageUrl) return
    
    try {
      const response = await makeAuthenticatedRequest('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile_image_url: imageUrl })
      })
      
      if (response.ok) {
        const data = await response.json()
        setProfileUser(data.user)
      }
    } catch (error) {
      console.error('Failed to update profile image:', error)
    }
  }

  if (loading || profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">読み込み中...</p>
        </div>
      </div>
    )
  }

  if (!user || !profileUser) return null

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <button onClick={() => router.back()} className="text-gray-600 hover:text-gray-900">← 戻る</button>
              <h1 className="text-2xl font-bold text-gray-900">
                {isFirstTimeSetup ? 'プロフィール設定' : 'プロフィール'}
              </h1>
            </div>
            {!isFirstTimeSetup && (
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors"
              >
                {isEditing ? 'キャンセル' : '編集'}
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* First Time Setup Banner */}
        {isFirstTimeSetup && (
          <div className="bg-gradient-to-r from-emerald-50 to-blue-50 border border-emerald-200 rounded-lg p-6 mb-8">
            <div className="flex items-center space-x-3">
              <div className="text-3xl">👋</div>
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-1">プロフィールを完成させましょう！</h2>
                <p className="text-gray-600">あなたについて教えてください。他のユーザーとつながりやすくなります。</p>
              </div>
            </div>
          </div>
        )}

        {/* User Profile */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="flex items-start space-x-6">
            {/* プロフィール画像 */}
            <div className="relative">
              {(isEditing || isFirstTimeSetup) ? (
                <AvatarUpload
                  userId={user.uid}
                  currentImageUrl={profileUser.profile_image_url}
                  onImageChange={handleImageChange}
                />
              ) : (
                <div className="w-24 h-24 rounded-full overflow-hidden">
                  {profileUser.profile_image_url ? (
                    <img 
                      src={profileUser.profile_image_url} 
                      alt={profileUser.name} 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-300 flex items-center justify-center">
                      <span className="text-3xl text-gray-600">{profileUser.name.charAt(0).toUpperCase()}</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* ユーザー情報 */}
            <div className="flex-1">
              {(isEditing || isFirstTimeSetup) ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">名前</label>
                    <input
                      type="text"
                      value={editForm.name}
                      onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">自己紹介</label>
                    <textarea
                      value={editForm.bio}
                      onChange={(e) => setEditForm({...editForm, bio: e.target.value})}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      placeholder="あなたについて教えてください..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">居住地域</label>
                    <PlaceSearchInput
                      currentPlace={editForm.home_place_id && editForm.home_address ? ({
                        place_id: editForm.home_place_id,
                        name: editForm.home_address,
                        formatted_address: editForm.home_address,
                        geometry: { location: { lat: 0, lng: 0 } }
                      } as unknown as PlaceData) : undefined}
                      onPlaceSelect={handleHomePlaceSelect}
                      placeholder="居住地域を検索（例: 東京都渋谷区、San Jose, CA）"
                      disabled={saving}
                    />
                    {!editForm.home_place_id && editForm.home_address && (
                      <p className="mt-2 text-sm text-yellow-600">
                        ⚠️ 正確な国情報のため、Google Placesから居住地域を選択してください
                      </p>
                    )}
                  </div>

                  {editForm.home_country_code && (
                    <div className="text-sm text-gray-700 flex items-center gap-2">
                      <span className="text-sm">推定居住国:</span>
                      <span className="text-lg">
                        {getCountryFlag(editForm.home_country_code)}
                      </span>
                      <span>{getCountryNameJa(editForm.home_country_code)}</span>
                      <span className="text-xs text-gray-500">({editForm.home_country_code})</span>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">性別</label>
                    <select
                      value={editForm.gender}
                      onChange={(e) => setEditForm({...editForm, gender: e.target.value as Gender})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="prefer_not_to_say">回答しない</option>
                      <option value="male">男性</option>
                      <option value="female">女性</option>
                      <option value="other">その他</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">言語設定</label>
                    <select
                      value={editForm.language}
                      onChange={(e) => setEditForm({...editForm, language: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="">自動（ブラウザ設定）</option>
                      {SUPPORTED_LANGUAGES.map((lang) => (
                        <option key={lang} value={lang}>
                          {LANGUAGE_NAMES[lang].native} / {LANGUAGE_NAMES[lang].en} ({lang})
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-gray-500 mt-1">
                      場所検索の結果言語に影響します。未選択時はブラウザの言語設定を使用します。
                    </p>
                  </div>

                  <div className="flex space-x-3">
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="px-6 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 disabled:opacity-50 font-medium"
                    >
                      {saving ? '保存中...' : isFirstTimeSetup ? 'プロフィールを完成' : '保存'}
                    </button>
                    {isFirstTimeSetup && (
                      <button
                        onClick={() => setIsFirstTimeSetup(false)}
                        className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                      >
                        スキップ
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div>
                  <h2 className="text-3xl font-bold text-gray-900 mb-2">{profileUser.name}</h2>
                  
                  <div className="mb-4">
                    {profileUser.bio ? (
                      <p className="text-gray-700 text-lg">{profileUser.bio}</p>
                    ) : (
                      <p className="text-gray-400 text-lg italic">自己紹介を追加してください</p>
                    )}
                  </div>
                  
                  <div className="space-y-2 text-gray-600">
                    <p className="flex items-center gap-2">
                      <MailIcon className="w-4 h-4" color="#6b7280" />
                      {profileUser.email}
                    </p>
                    
                    {profileUser.preferences?.home_address && (
                      <p className="flex items-center gap-2">
                        <PinIcon className="w-4 h-4" color="#6b7280" />
                        {profileUser.preferences.home_address}
                      </p>
                    )}
                    
                    {profileUser.preferences?.home_country_code && (
                      <p className="flex items-center gap-2">
                        <span className="text-sm">
                          {getCountryFlag(profileUser.preferences.home_country_code)}
                        </span>
                        {getCountryNameJa(profileUser.preferences.home_country_code)}
                      </p>
                    )}
                    
                    {profileUser.gender && profileUser.gender !== 'prefer_not_to_say' && (
                      <p className="flex items-center gap-2">
                        <UserIcon className="w-4 h-4" color="#6b7280" />
                        {profileUser.gender === 'male' ? '男性' : profileUser.gender === 'female' ? '女性' : 'その他'}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Public Trips */}
        {!isFirstTimeSetup && (
          <div>
            <h3 className="text-xl font-bold text-gray-900 mb-6">公開された旅行</h3>
          {publicTrips.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">✈️</div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">まだ公開された旅行がありません</h4>
              <p className="text-gray-600">旅行を作成して、他のユーザーと共有しましょう！</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {publicTrips.map((trip) => {
                const getTripUrl = () => {
                  if (trip.creator?.slug && trip.slug) return `/${trip.creator.slug}/${trip.slug}`
                  return `/trip/${trip.id}`
                }

                return (
                  <Link key={trip.id} href={getTripUrl()} className="bg-white rounded-lg shadow-sm hover:shadow-md transition duration-200 p-6">
                    <h4 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">{trip.title}</h4>
                    {trip.description && (
                      <p className="text-gray-600 text-sm mb-3 line-clamp-2">{trip.description}</p>
                    )}
                    {trip.destination && (
                      <p className="text-gray-500 text-sm mb-3 flex items-center gap-1">
                        <PinIcon className="w-4 h-4" color="#6b7280" />
                        {trip.destination}
                        {trip.destination_place?.address_components && (
                          <span>
                            {getCountryFlag(
                              trip.destination_place.address_components.find((c: any) => c.types.includes('country'))?.short_name || 'unknown'
                            )}
                          </span>
                        )}
                      </p>
                    )}
                  </Link>
                )
              })}
            </div>
          )}
          </div>
        )}
      </main>
    </div>
  )
}


