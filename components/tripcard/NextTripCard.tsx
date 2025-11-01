'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import TripCard from '@/components/tripcard/TripCard'
import CreateTripDialog from '@/components/common/CreateTripDialog'
import { Button } from '@/components/common/Button'
import NextTripMap from './NextTripMap'
import { useUserData } from '@/lib/contexts/user-data'
import { RestrictionProvider, RestrictionType } from '@/lib/subscription/restriction'
import { IconRenderer } from '@/components/common/icons/IconRenderer'
import type { Trip } from '@/lib/core/types'
import { t } from '@/lib/i18n'

interface NextTripCardProps {
  nextTrip?: Trip
  onTripCreated: () => void
}

export default function NextTripCard({ nextTrip, onTripCreated }: NextTripCardProps) {
  const router = useRouter()
  const { userPlanId, tripCount } = useUserData()
  const [isCreateTripDialogOpen, setIsCreateTripDialogOpen] = useState(false)

  // RestrictionProviderを使用してプラン制限をチェック
  const canCreateTrip = RestrictionProvider.can(userPlanId, RestrictionType.MAX_TRIPS, tripCount + 1)
  const limitExceededMessage = RestrictionProvider.getLimitExceededMessage(userPlanId, RestrictionType.MAX_TRIPS, tripCount + 1)

  const handleTripCreated = () => {
    onTripCreated()
    setIsCreateTripDialogOpen(false)
  }

  const handleCreateTripClick = () => {
    if (!canCreateTrip) {
      alert(limitExceededMessage)
      return
    }
    setIsCreateTripDialogOpen(true)
  }

  return (
    <>
      {/* メインコンテンツエリア */}
      <div className="bg-white rounded-sm border border-gray-200 p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {nextTrip ? t('home.dashboard.nextTrip.title') : t('home.dashboard.nextTrip.createNew')}
            </h2>
            <p className="text-gray-600">
              {nextTrip 
                ? t('home.dashboard.nextTrip.description')
                : t('home.dashboard.nextTrip.createDescription')
              }
            </p>
          </div>
          <Button
            variant="primary"
            onClick={handleCreateTripClick}
            disabled={!canCreateTrip}
          >
            {nextTrip ? t('home.dashboard.nextTrip.createNew') : t('home.dashboard.nextTrip.create')}
          </Button>
        </div>

        {/* コンテンツエリア - 6:4の比率に変更 */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          {/* 旅行カードまたは作成案内 - 6/10の幅 */}
          <div className="md:col-span-3 min-h-[300px]">
            {nextTrip ? (
              <TripCard trip={nextTrip} variant="imageFull" />
            ) : (
              <div className="h-full bg-gray-50 flex flex-col items-center justify-center p-8">
                <div className="mb-4">
                  <IconRenderer iconName="airplane" className="w-14 h-14 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{t('home.dashboard.nextTrip.empty.title')}</h3>
                <p className="text-gray-600 text-center mb-6">
                  {t('home.dashboard.nextTrip.empty.description')}
                </p>
                <Button
                  variant="primary"
                  onClick={handleCreateTripClick}
                  disabled={!canCreateTrip}
                >
                  {t('home.dashboard.nextTrip.create')}
                </Button>
              </div>
            )}
          </div>

          {/* マップエリア - 4/10の幅 */}
          <div className="md:col-span-2 min-h-[300px]">
            {nextTrip ? (
              <NextTripMap trip={nextTrip} />
            ) : (
              <div className="bg-gray-100 flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="flex items-center justify-center mb-4">
                    <svg className="w-10 h-10 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path d="M3.5 6.5l5.4-2.1 5.2 2.1 5.4-2.1v12.9l-5.4 2.1-5.2-2.1-5.4 2.1V6.5z" />
                      <path d="M8.9 4.4v12.9" />
                      <path d="M14.1 6.5v12.9" />
                    </svg>
                  </div>
                  <p className="text-gray-500 font-medium">{t('home.dashboard.nextTrip.empty.mapPlaceholder')}</p>
                  <p className="text-sm text-gray-400 mt-2">{t('home.dashboard.nextTrip.empty.mapDescription')}</p>
                </div>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* 旅行作成ダイアログ */}
      <CreateTripDialog
        isOpen={isCreateTripDialogOpen}
        onClose={() => setIsCreateTripDialogOpen(false)}
        onSuccess={handleTripCreated}
      />
    </>
  )
}
