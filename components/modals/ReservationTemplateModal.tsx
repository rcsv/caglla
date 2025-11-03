'use client'

import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import type { ReservationTemplate, ReservationTemplateInput, ReservationType, ReservationSite } from '@/lib/core/types'
import { makeAuthenticatedRequest } from '@/lib/api/helpers'
import Button from '@/components/common/Button'
import Input from '@/components/common/Input'
import Textarea from '@/components/common/Textarea'
import Select from '@/components/common/Select'
import { Icon } from '@iconify/react'
import { getReservationTypeLabel, getReservationSiteLabel, getReservationTypeIcon } from '@/lib/utils/reservation-utils'
import { t } from '@/lib/i18n'
import Loading from '@/components/common/Loading'

interface ReservationTemplateModalProps {
  isOpen: boolean
  onClose: () => void
  onSelectTemplate: (template: ReservationTemplate) => void
  reservationType?: ReservationType // フィルタ用
}

// 予約タイプの配列を取得（i18n対応）
const getReservationTypes = (): { value: ReservationType; label: string; icon: string }[] => [
  { value: 'flight', label: t('reservation.type.flight'), icon: '✈️' },
  { value: 'rental_car', label: t('reservation.type.rentalCar'), icon: '🚗' },
  { value: 'hotel', label: t('reservation.type.hotel'), icon: '🏨' },
  { value: 'dining', label: t('reservation.type.dining'), icon: '🍽️' },
  { value: 'other', label: t('reservation.type.other'), icon: '📋' }
]

// 予約サイトの配列を取得（i18n対応）
const getReservationSites = (): { value: ReservationSite; label: string }[] => [
  { value: 'expedia', label: t('reservation.site.expedia') },
  { value: 'booking_com', label: t('reservation.site.bookingCom') },
  { value: 'agoda', label: t('reservation.site.agoda') },
  { value: 'airbnb', label: t('reservation.site.airbnb') },
  { value: 'skyscanner', label: t('reservation.site.skyscanner') },
  { value: 'ana', label: t('reservation.site.ana') },
  { value: 'jal', label: t('reservation.site.jal') },
  { value: 'rakuten_travel', label: t('reservation.site.rakutenTravel') },
  { value: 'jalan', label: t('reservation.site.jalan') },
  { value: 'other', label: t('reservation.site.other') }
]

export default function ReservationTemplateModal({
  isOpen,
  onClose,
  onSelectTemplate,
  reservationType,
}: ReservationTemplateModalProps) {
  const [templates, setTemplates] = useState<ReservationTemplate[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<ReservationTemplate | null>(null)
  const [formData, setFormData] = useState<ReservationTemplateInput>({
    name: '',
    type: reservationType || 'flight',
  })

  useEffect(() => {
    if (isOpen) {
      loadTemplates()
    }
  }, [isOpen])

  const loadTemplates = async () => {
    setIsLoading(true)
    try {
      const response = await makeAuthenticatedRequest<{ templates: ReservationTemplate[] }>(
        '/api/reservation-templates'
      )
      setTemplates(response.templates || [])
    } catch (error) {
      console.error('Load templates error:', error)
    }
    setIsLoading(false)
  }

  const handleCreateTemplate = async () => {
    try {
      const response = await makeAuthenticatedRequest<{ 
        success: boolean
        id: string
        template: ReservationTemplate 
      }>(
        '/api/reservation-templates',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        }
      )

      if (response.success) {
        await loadTemplates()
        setShowCreateForm(false)
        setFormData({ name: '', type: reservationType || 'flight' })
      }
    } catch (error) {
      console.error('Create template error:', error)
      alert('テンプレートの作成に失敗しました')
    }
  }

  const handleUpdateTemplate = async () => {
    if (!editingTemplate) return

    try {
      await makeAuthenticatedRequest(
        `/api/reservation-templates/${editingTemplate.id}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        }
      )

      await loadTemplates()
      setEditingTemplate(null)
      setFormData({ name: '', type: reservationType || 'flight' })
    } catch (error) {
      console.error('Update template error:', error)
      alert('テンプレートの更新に失敗しました')
    }
  }

  const handleDeleteTemplate = async (templateId: string) => {
    if (!confirm('このテンプレートを削除しますか？')) return

    try {
      await makeAuthenticatedRequest(
        `/api/reservation-templates/${templateId}`,
        { method: 'DELETE' }
      )

      await loadTemplates()
    } catch (error) {
      console.error('Delete template error:', error)
      alert('テンプレートの削除に失敗しました')
    }
  }

  const handleUseTemplate = async (template: ReservationTemplate) => {
    try {
      // 使用統計を更新
      await makeAuthenticatedRequest(
        `/api/reservation-templates/${template.id}/use`,
        { method: 'POST' }
      )

      onSelectTemplate(template)
      onClose()
    } catch (error) {
      console.error('Use template error:', error)
      // エラーでも選択は実行する
      onSelectTemplate(template)
      onClose()
    }
  }

  const startEdit = (template: ReservationTemplate) => {
    setEditingTemplate(template)
    setFormData({
      name: template.name,
      description: template.description,
      type: template.type,
      reservation_site: template.reservation_site,
      airline: template.airline,
      departure_airport: template.departure_airport,
      arrival_airport: template.arrival_airport,
      notes: template.notes,
    })
    setShowCreateForm(true)
  }

  const cancelEdit = () => {
    setEditingTemplate(null)
    setShowCreateForm(false)
    setFormData({ name: '', type: reservationType || 'flight' })
  }

  const filteredTemplates = reservationType
    ? templates.filter(t => t.type === reservationType)
    : templates

  if (!isOpen) return null

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  const modalContent = (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center zidx-float-modal p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* ヘッダー */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <Icon icon="mdi:bookmark-multiple" className="w-6 h-6 text-purple-600" />
            予約テンプレート
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="閉じる"
          >
            <Icon icon="mdi:close" className="w-6 h-6" />
          </button>
        </div>

        {/* コンテンツ */}
        <div className="px-6 py-4">
          {/* 新規作成ボタン */}
          {!showCreateForm && (
            <div className="mb-4">
              <Button
                onClick={() => setShowCreateForm(true)}
                variant="primary"
                className="flex items-center gap-2"
              >
                <Icon icon="mdi:plus" className="w-5 h-5" />
                新規テンプレート作成
              </Button>
            </div>
          )}

          {/* 作成/編集フォーム */}
          {showCreateForm && (
            <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-lg space-y-4">
              <h3 className="font-medium text-gray-900">
                {editingTemplate ? 'テンプレート編集' : '新規テンプレート作成'}
              </h3>

              <Input
                label="テンプレート名"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="例: いつものANA便"
                required
              />

              <Textarea
                label="説明"
                value={formData.description || ''}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="このテンプレートの用途や特徴"
                rows={2}
              />

              <Select
                label="予約タイプ"
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as ReservationType })}
                options={getReservationTypes().map(type => ({ value: type.value, label: `${type.icon} ${type.label}` }))}
                required
              />

              <Select
                label="予約サイト"
                value={formData.reservation_site || ''}
                onChange={(e) => setFormData({ ...formData, reservation_site: e.target.value as any })}
                options={[{ value: '', label: t('reservation.notSet') }, ...getReservationSites().map(site => ({ value: site.value, label: site.label }))]}
              />

              {formData.type === 'flight' && (
                <>
                  <Input
                    label="航空会社"
                    value={formData.airline || ''}
                    onChange={(e) => setFormData({ ...formData, airline: e.target.value })}
                    placeholder="例: ANA, JAL"
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      label="出発空港"
                      value={formData.departure_airport || ''}
                      onChange={(e) => setFormData({ ...formData, departure_airport: e.target.value.toUpperCase() })}
                      placeholder="例: HND"
                      maxLength={3}
                    />

                    <Input
                      label="到着空港"
                      value={formData.arrival_airport || ''}
                      onChange={(e) => setFormData({ ...formData, arrival_airport: e.target.value.toUpperCase() })}
                      placeholder="例: ITM"
                      maxLength={3}
                    />
                  </div>
                </>
              )}

              <Textarea
                label="デフォルトメモ"
                value={formData.notes || ''}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="テンプレート使用時に自動入力されるメモ"
                rows={3}
              />

              <div className="flex gap-2">
                <Button
                  onClick={editingTemplate ? handleUpdateTemplate : handleCreateTemplate}
                  variant="primary"
                  disabled={!formData.name || !formData.type}
                >
                  {editingTemplate ? '更新' : '作成'}
                </Button>
                <Button
                  onClick={cancelEdit}
                  variant="secondary"
                >
                  キャンセル
                </Button>
              </div>
            </div>
          )}

          {/* テンプレート一覧 */}
          {isLoading ? (
            <div className="text-center py-8">
              <Loading size="md" color="gray" />
            </div>
          ) : filteredTemplates.length === 0 ? (
            <div className="text-center py-8">
              <Icon icon="mdi:bookmark-off" className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">テンプレートがありません</p>
              <p className="text-sm text-gray-500 mt-2">
                よく使う予約情報をテンプレートとして保存できます
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredTemplates.map(template => (
                <div
                  key={template.id}
                  className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-medium text-gray-900">{template.name}</h3>
                        <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded">
                          {getReservationTypeLabel(template.type)}
                        </span>
                      </div>

                      {template.description && (
                        <p className="text-sm text-gray-600 mb-2">{template.description}</p>
                      )}

                      <div className="flex flex-wrap gap-2 text-xs text-gray-500">
                        {template.reservation_site && (
                          <span className="flex items-center gap-1">
                            <Icon icon="mdi:web" className="w-3.5 h-3.5" />
                            {getReservationSiteLabel(template.reservation_site)}
                          </span>
                        )}
                        {template.airline && (
                          <span className="flex items-center gap-1">
                            <Icon icon="mdi:airplane" className="w-3.5 h-3.5" />
                            {template.airline}
                          </span>
                        )}
                        {template.departure_airport && template.arrival_airport && (
                          <span className="flex items-center gap-1">
                            <Icon icon="mdi:airplane-takeoff" className="w-3.5 h-3.5" />
                            {template.departure_airport} → {template.arrival_airport}
                          </span>
                        )}
                        {template.use_count !== undefined && template.use_count > 0 && (
                          <span className="flex items-center gap-1">
                            <Icon icon="mdi:counter" className="w-3.5 h-3.5" />
                            {template.use_count}回使用
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 ml-4">
                      <button
                        onClick={() => handleUseTemplate(template)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="テンプレートを使用"
                      >
                        <Icon icon="mdi:check-circle" className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => startEdit(template)}
                        className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                        title="編集"
                      >
                        <Icon icon="mdi:pencil" className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDeleteTemplate(template.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="削除"
                      >
                        <Icon icon="mdi:delete" className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* フッター */}
        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-end">
          <Button
            onClick={onClose}
            variant="secondary"
          >
            閉じる
          </Button>
        </div>
      </div>
    </div>
  )

  return createPortal(modalContent, document.body)
}

