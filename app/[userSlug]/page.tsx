'use client'

import { useAuth } from '@/lib/contexts/auth'
import { useUserData } from '@/lib/contexts/user-data'
import { useRouter, useParams } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
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
import type { SupportedLanguage, UnitSystem } from '@/lib/core/types'
import { t } from '@/lib/i18n'
import { getDefaultUnitSystem } from '@/lib/utils/unit-system'
import Loading from '@/components/common/Loading'
import { setLanguageOverrideClient } from '@/lib/i18n/storage'
import { Section } from '@/components/common/static/Section'
import { SolidCard } from '@/components/common/static/SolidCard'
import HomeFooter from '@/components/common/HomeFooter'

export default function UserProfileBySlugPage() {
  const { user, loading } = useAuth()
  const { refreshUserData } = useUserData()
  const router = useRouter()
  const { userSlug } = useParams<{ userSlug: string }>()

  const [profileUser, setProfileUser] = useState<User | null>(null)
  const [publicTrips, setPublicTrips] = useState<Trip[]>([])
  const [privateTrips, setPrivateTrips] = useState<Trip[]>([])
  const [profileLoading, setProfileLoading] = useState(true)
  const [tripStats, setTripStats] = useState<{
    totalTrips: number
    totalCountries: number
    countryGroups: Array<{ countryCode: string; countryName: string; countryNameJa: string; tripCount: number }>
  } | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [isFirstTimeSetup, setIsFirstTimeSetup] = useState(false)

  const fetchUserProfile = useCallback(async () => {
    try {
      setProfileLoading(true)
      // 自分自身のプロフィール情報を取得
      const res = await makeAuthenticatedRequest('/api/users')
      let fetchedUser: User | null = null
      if (res.ok) {
        const data = await res.json()
        fetchedUser = data.user
        setProfileUser(data.user)
        const userPreferences = data.user.preferences || {}
        setEditForm({
          name: data.user.name || '',
          bio: data.user.bio || '',
          home_address: userPreferences.home_address || '',
          home_place_id: userPreferences.home_place_id || '',
          home_country_code: userPreferences.home_country_code || '',
          gender: data.user.gender || 'prefer_not_to_say',
          language: userPreferences.language || '',
          unit_system: userPreferences.unit_system || getDefaultUnitSystem(userPreferences.home_country_code)
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
        const publicTripsList = trips.filter(t => t.access_level === 'public')
        setPublicTrips(publicTripsList)

        // 自分自身のプロフィールの場合、非公開の旅行も取得
        // fetchedUserを使用して同期的に判定
        // 注意: user.uidはFirebase Auth UID、fetchedUser.google_idと比較する必要がある
        const currentUserId = user?.uid // Firebase Auth UID
        const viewedUserGoogleId = fetchedUser?.google_id // Firestoreのgoogle_idフィールド
        const isOwnProfileCheck = currentUserId && viewedUserGoogleId && currentUserId === viewedUserGoogleId

        // デバッグログ（開発環境のみ）
        const isDev = typeof window !== 'undefined' && process.env.NODE_ENV === 'development'
        if (isDev) {
          console.log('🔍 Profile trips debug:', {
            currentUserId,
            viewedUserId: fetchedUser?.id,
            viewedUserGoogleId,
            isOwnProfile: isOwnProfileCheck,
            totalTrips: trips.length,
            publicTrips: publicTripsList.length,
            allTrips: trips.map(t => ({
              id: t.id,
              title: t.title,
              access_level: t.access_level,
              access_level_type: typeof t.access_level,
              access_level_lower: t.access_level?.toLowerCase()
            }))
          })
        }

        if (isOwnProfileCheck) {
          // access_levelが'private'、または未設定（デフォルトで非公開）の場合を含める
          const privateTripsList = trips.filter(t => {
            const level = t.access_level?.toLowerCase()
            // 'private'、未設定（null/undefined）、空文字列の場合は非公開とみなす
            const isPrivate = level === 'private' || !level || level === ''

            // デバッグログ（開発環境のみ）
            if (isDev && isPrivate) {
              console.log('🔒 Private trip found:', {
                id: t.id,
                title: t.title,
                access_level: t.access_level,
                access_level_lower: level,
                isPrivate
              })
            }

            return isPrivate
          })

          if (isDev) {
            console.log('🔒 Private trips filtered:', privateTripsList.length, privateTripsList.map(t => ({ id: t.id, title: t.title, access_level: t.access_level })))
          }

          setPrivateTrips(privateTripsList)
        } else {
          // 自分自身のプロフィールでない場合、空配列を設定
          setPrivateTrips([])
        }

        // 統計情報を取得（自分自身のプロフィールまたは公開旅行がある場合）
        const shouldShowStats = isOwnProfileCheck || publicTripsList.length > 0

        if (shouldShowStats) {
          const statsRes = await makeAuthenticatedRequest('/api/trips?groupByCountry=true')
          if (statsRes.ok) {
            const statsData = await statsRes.json()
            setTripStats({
              totalTrips: statsData.totalTrips || 0,
              totalCountries: statsData.totalCountries || 0,
              countryGroups: statsData.trips || []
            })
          }
        }
      }
    } finally {
      setProfileLoading(false)
    }
  }, [user, refreshUserData])

  // 言語→国旗のマッピング
  const languageFlags: Record<SupportedLanguage, string> = {
    ja: '🇯🇵',
    en: '🇺🇸',
    zh: '🇨🇳',
    ko: '🇰🇷',
    es: '🇪🇸',
    fr: '🇫🇷',
    de: '🇩🇪',
    it: '🇮🇹',
    pt: '🇵🇹'
  }
  const [editForm, setEditForm] = useState({
    name: '',
    bio: '',
    home_address: '',
    home_place_id: '',
    home_country_code: '',
    gender: 'prefer_not_to_say' as 'male' | 'female' | 'other' | 'prefer_not_to_say',
    language: '',
    unit_system: 'metric' as UnitSystem
  })

  useEffect(() => {
    if (!loading && !user) router.push('/')
  }, [user, loading, router])

  useEffect(() => {
    if (user && userSlug) {
      void fetchUserProfile()
    }
  }, [user, userSlug, fetchUserProfile])

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
            language: editForm.language || undefined,
            unit_system: editForm.unit_system
          }
        })
      })
      
      if (response.ok) {
        const data = await response.json()
        setProfileUser(data.user)
        setIsEditing(false)
        setIsFirstTimeSetup(false) // セットアップ完了
        
        // 言語設定をクッキー/ローカルストレージに同期
        const savedLanguage = data.user.preferences?.language
        if (savedLanguage) {
          setLanguageOverrideClient(savedLanguage as any)
        } else {
          // 空文字列の場合はクッキーをクリア
          setLanguageOverrideClient('')
        }
        
        // UserDataProviderのuserDataを更新（単位系などの変更を反映）
        await refreshUserData()
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
    const defaultUnitSystem = getDefaultUnitSystem(derivedCode || null)
    setEditForm(prev => ({
      ...prev,
      home_address: place.formatted_address || place.name || '',
      home_place_id: (place as any).place_id || '',
      home_country_code: derivedCode,
      // 国コードが変更された場合、unit_systemが未設定なら自動設定
      unit_system: prev.unit_system || defaultUnitSystem
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
  // 注意: user.uidはFirebase Auth UID、profileUser.google_idと比較する必要がある
  const isOwnProfile = user.uid === profileUser.google_id

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
                      <div className="relative w-24 h-24 rounded-full overflow-hidden">
                        {profileUser.profile_image_url ? (
                          <Image
                            src={profileUser.profile_image_url}
                            alt={profileUser.name}
                            fill
                            sizes="96px"
                            className="object-cover"
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

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('userSettings.label.unitSystem')}</label>
                    <select
                      value={editForm.unit_system}
                      onChange={(e) => setEditForm({...editForm, unit_system: e.target.value as UnitSystem})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="metric">{t('userSettings.unitSystem.metric')}</option>
                      <option value="imperial">{t('userSettings.unitSystem.imperial')}</option>
                    </select>
                    <p className="text-xs text-gray-500 mt-1">
                      {t('userSettings.description.unitSystem')}
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
                        
                        {/* 言語設定の表示 */}
                        <p className="flex items-center gap-2">
                          <span className="text-base">
                            {profileUser.preferences?.language 
                              ? languageFlags[profileUser.preferences.language as SupportedLanguage] || '🌐'
                              : '🌐'}
                          </span>
                          <span className="text-gray-600">
                            {profileUser.preferences?.language
                              ? LANGUAGE_NAMES[profileUser.preferences.language as SupportedLanguage]?.native || profileUser.preferences.language
                              : t('profile.language.auto')}
                          </span>
                        </p>
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
                {/* デバッグ情報 */}
                {typeof window !== 'undefined' && process.env.NODE_ENV === 'development' && (
                  <div className="mt-4 p-4 bg-gray-100 rounded text-left text-xs">
                    <p>Debug: isOwnProfile={String(isOwnProfile)}</p>
                    <p>Debug: privateTrips.length={privateTrips.length}</p>
                    <p>Debug: user.uid={user?.uid}</p>
                    <p>Debug: profileUser.id={profileUser?.id}</p>
                    <p>Debug: profileUser.google_id={profileUser?.google_id}</p>
                  </div>
                )}
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

        {/* Trip Statistics */}
        {!isFirstTimeSetup && tripStats && (
          <Section title={t('profile.stats.title')}>
            <SolidCard className="p-8 md:p-10">
              <div className="space-y-6">
                {/* Summary Stats */}
                <div className="grid grid-cols-2 gap-6">
                  <div className="bg-emerald-50 rounded-lg p-6 text-center">
                    <div className="text-4xl font-bold text-emerald-600 mb-2">{tripStats.totalTrips}</div>
                    <div className="text-gray-700 font-medium">{t('profile.stats.totalTrips')}</div>
                  </div>
                  <div className="bg-blue-50 rounded-lg p-6 text-center">
                    <div className="text-4xl font-bold text-blue-600 mb-2">{tripStats.totalCountries}</div>
                    <div className="text-gray-700 font-medium">{t('profile.stats.totalCountries')}</div>
                  </div>
                </div>

                {/* Country Stats */}
                {tripStats.countryGroups.length > 0 && (
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-4">{t('profile.stats.countries.title')}</h4>
                    <div className="space-y-3">
                      {tripStats.countryGroups.slice(0, 5).map((group, index) => (
                        <div key={group.countryCode} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <div className="flex items-center justify-center w-8 h-8 bg-emerald-600 text-white rounded-full text-sm font-semibold">
                              {index + 1}
                            </div>
                            <div className="text-2xl">
                              {getCountryFlag(group.countryCode)}
                            </div>
                            <div>
                              <div className="font-medium text-gray-800">{group.countryNameJa}</div>
                              <div className="text-sm text-gray-500">{group.countryName}</div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="text-lg font-bold text-emerald-600">{group.tripCount}</span>
                            <span className="text-sm text-gray-500">{t('profile.stats.times')}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                    {tripStats.countryGroups.length > 5 && (
                      <p className="text-sm text-gray-500 mt-4 text-center">
                        {t('profile.stats.countries.more').replace('{count}', String(tripStats.countryGroups.length - 5))}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </SolidCard>
          </Section>
        )}
        </div>
      </main>
      <HomeFooter />
    </div>
  )
}


