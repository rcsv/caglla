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
import { t } from '@/lib/i18n'
import Loading from '@/components/common/Loading'
import { Section } from '@/components/common/static/Section'
import { SolidCard } from '@/components/common/static/SolidCard'

export default function UserProfileBySlugPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const { userSlug } = useParams<{ userSlug: string }>()

  const [profileUser, setProfileUser] = useState<User | null>(null)
  const [publicTrips, setPublicTrips] = useState<Trip[]>([])
  const [privateTrips, setPrivateTrips] = useState<Trip[]>([])
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

      // 旅行一覧を取得
      const tripsRes = await makeAuthenticatedRequest('/api/trips')
      if (tripsRes.ok) {
        const data = await tripsRes.json()
        const trips: Trip[] = data.trips || []
        setPublicTrips(trips.filter(t => t.access_level === 'public'))
        
        // 自分自身のプロフィールの場合、非公開の旅行も取得
        // profileUserは既に取得済みなので、ここで判定可能
        const currentUserId = user?.uid
        const viewedUserId = profileUser?.id
        if (currentUserId && viewedUserId && currentUserId === viewedUserId) {
          setPrivateTrips(trips.filter(t => t.access_level === 'private'))
        }
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
      <Loading fullScreen size="lg" message={t('profile.loading')} className="bg-gradient-to-b from-gray-50 to-white" />
    )
  }

  if (!user || !profileUser) return null

  // 自分自身のプロフィールかどうか
  const isOwnProfile = user.uid === profileUser.id

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <button onClick={() => router.back()} className="text-gray-600 hover:text-gray-900">{t('profile.back')}</button>
              <h1 className="text-2xl font-bold text-gray-900">
                {isFirstTimeSetup ? t('profile.setup') : t('profile.title')}
              </h1>
            </div>
            {!isFirstTimeSetup && (
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="px-6 py-2 bg-emerald-600 text-white font-semibold hover:bg-emerald-700 transition-colors"
              >
                {isEditing ? t('profile.cancel') : t('profile.edit')}
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-12">
        <div className="page-rail space-y-20">
          {/* First Time Setup Banner */}
          {isFirstTimeSetup && (
            <section>
              <SolidCard className="p-8 md:p-10">
                <div className="flex items-center space-x-4">
                  <div className="text-4xl">👋</div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">{t('profile.setupBanner.title')}</h2>
                    <p className="text-gray-700 leading-relaxed">{t('profile.setupBanner.description')}</p>
                  </div>
                </div>
              </SolidCard>
            </section>
          )}

          {/* User Profile */}
          <Section title={isFirstTimeSetup ? t('profile.setup') : t('profile.title')}>
            <SolidCard className="p-8 md:p-10">
              <div className="space-y-8">
                {/* プロフィール画像とユーザー情報 */}
                <div className="flex items-start space-x-6">
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('profile.name')}</label>
                    <input
                      type="text"
                      value={editForm.name}
                      onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('profile.bio')}</label>
                    <textarea
                      value={editForm.bio}
                      onChange={(e) => setEditForm({...editForm, bio: e.target.value})}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      placeholder={t('profile.bio.placeholder')}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('profile.residenceArea')}</label>
                    <PlaceSearchInput
                      currentPlace={editForm.home_place_id && editForm.home_address ? ({
                        place_id: editForm.home_place_id,
                        name: editForm.home_address,
                        formatted_address: editForm.home_address,
                        geometry: { location: { lat: 0, lng: 0 } }
                      } as unknown as PlaceData) : undefined}
                      onPlaceSelect={handleHomePlaceSelect}
                      placeholder={t('profile.residenceArea.placeholder')}
                      disabled={saving}
                    />
                    {!editForm.home_place_id && editForm.home_address && (
                      <p className="mt-2 text-sm text-yellow-600">
                        {t('profile.residenceArea.warning')}
                      </p>
                    )}
                  </div>

                  {editForm.home_country_code && (
                    <div className="text-sm text-gray-700 flex items-center gap-2">
                      <span className="text-sm">{t('profile.estimatedCountry')}</span>
                      <span className="text-lg">
                        {getCountryFlag(editForm.home_country_code)}
                      </span>
                      <span>{getCountryNameJa(editForm.home_country_code)}</span>
                      <span className="text-xs text-gray-500">({editForm.home_country_code})</span>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('profile.gender')}</label>
                    <select
                      value={editForm.gender}
                      onChange={(e) => setEditForm({...editForm, gender: e.target.value as Gender})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="prefer_not_to_say">{t('profile.gender.preferNotToSay')}</option>
                      <option value="male">{t('profile.gender.male')}</option>
                      <option value="female">{t('profile.gender.female')}</option>
                      <option value="other">{t('profile.gender.other')}</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('profile.language')}</label>
                    <select
                      value={editForm.language}
                      onChange={(e) => setEditForm({...editForm, language: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="">{t('profile.language.auto')}</option>
                      {SUPPORTED_LANGUAGES.map((lang) => (
                        <option key={lang} value={lang}>
                          {LANGUAGE_NAMES[lang].native} / {LANGUAGE_NAMES[lang].en} ({lang})
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-gray-500 mt-1">
                      {t('profile.language.description')}
                    </p>
                  </div>

                    <div className="flex space-x-3">
                      <button
                        onClick={handleSave}
                        disabled={saving}
                        className="px-8 py-3 bg-emerald-600 text-white font-semibold hover:bg-emerald-700 disabled:opacity-50 transition-colors"
                      >
                        {saving ? t('profile.saving') : isFirstTimeSetup ? t('profile.complete') : t('profile.save')}
                      </button>
                      {isFirstTimeSetup && (
                        <button
                          onClick={() => setIsFirstTimeSetup(false)}
                          className="px-6 py-3 bg-gray-200 text-gray-700 font-semibold hover:bg-gray-300 transition-colors"
                        >
                          {t('profile.skip')}
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
                          <p className="text-gray-400 text-lg italic">{t('profile.bio.empty')}</p>
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
                            {profileUser.gender === 'male' ? t('profile.gender.male') : profileUser.gender === 'female' ? t('profile.gender.female') : t('profile.gender.other')}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              </div>
            </SolidCard>
          </Section>

        {/* Public Trips */}
        {!isFirstTimeSetup && (
          <Section title={t('profile.publicTrips.title')}>
            {publicTrips.length === 0 ? (
              <SolidCard className="p-12 text-center">
                <div className="text-6xl mb-4">✈️</div>
                <h4 className="text-xl font-semibold text-gray-900 mb-2">{t('profile.publicTrips.empty')}</h4>
                <p className="text-gray-600">{t('profile.publicTrips.empty.description')}</p>
              </SolidCard>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {publicTrips.map((trip) => {
                  const getTripUrl = () => {
                    if (trip.creator?.slug && trip.slug) return `/${trip.creator.slug}/${trip.slug}`
                    return `/trip/${trip.id}`
                  }

                  return (
                    <Link key={trip.id} href={getTripUrl()}>
                      <SolidCard className="p-6 hover:shadow-md transition duration-200">
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
                      </SolidCard>
                    </Link>
                  )
                })}
              </div>
            )}
          </Section>
        )}

        {/* Private Trips (自分自身のみ表示) */}
        {!isFirstTimeSetup && isOwnProfile && (
          <Section title={t('profile.privateTrips.title')}>
            {privateTrips.length === 0 ? (
              <SolidCard className="p-12 text-center">
                <div className="text-6xl mb-4">🔒</div>
                <h4 className="text-xl font-semibold text-gray-900 mb-2">{t('profile.privateTrips.empty')}</h4>
                <p className="text-gray-600">{t('profile.privateTrips.empty.description')}</p>
              </SolidCard>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {privateTrips.map((trip) => {
                  const getTripUrl = () => {
                    if (trip.creator?.slug && trip.slug) return `/${trip.creator.slug}/${trip.slug}`
                    return `/trip/${trip.id}`
                  }

                  return (
                    <Link key={trip.id} href={getTripUrl()}>
                      <SolidCard className="p-6 hover:shadow-md transition duration-200">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-sm">🔒</span>
                          <h4 className="text-lg font-semibold text-gray-900 line-clamp-2">{trip.title}</h4>
                        </div>
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
                      </SolidCard>
                    </Link>
                  )
                })}
              </div>
            )}
          </Section>
        )}
        </div>
      </main>
    </div>
  )
}


