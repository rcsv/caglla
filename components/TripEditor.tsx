'use client'

import { useState, useEffect } from 'react'

interface Trip {
  id: string
  user_id: string
  title: string
  description?: string
  destination?: string
  start_date?: string
  end_date?: string
  access_level: 'private' | 'public'
  created_at: string
  updated_at: string
}

interface TripEditorProps {
  trip: Trip
  onUpdate: (updatedTrip: Trip) => void
}

export default function TripEditor({ trip, onUpdate }: TripEditorProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    title: trip.title,
    description: trip.description || '',
    destination: trip.destination || '',
    startDate: trip.start_date || '',
    endDate: trip.end_date || '',
    accessLevel: trip.access_level
  })
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    try {
      const response = await fetch(`/api/trip/${trip.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          destination: formData.destination,
          startDate: formData.startDate || null,
          endDate: formData.endDate || null,
          accessLevel: formData.accessLevel,
        }),
      })

      if (response.ok) {
        const updatedTrip = {
          ...trip,
          title: formData.title,
          description: formData.description,
          destination: formData.destination,
          start_date: formData.startDate,
          end_date: formData.endDate,
          access_level: formData.accessLevel,
          updated_at: new Date().toISOString()
        }
        onUpdate(updatedTrip)
        setIsEditing(false)
      } else {
        console.error('Failed to update trip')
      }
    } catch (error) {
      console.error('Error updating trip:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    setFormData({
      title: trip.title,
      description: trip.description || '',
      destination: trip.destination || '',
      startDate: trip.start_date || '',
      endDate: trip.end_date || '',
      accessLevel: trip.access_level
    })
    setIsEditing(false)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  if (isEditing) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">旅行情報を編集</h2>
        
        <div className="space-y-4">
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
            />
          </div>

          <div>
            <label htmlFor="destination" className="block text-sm font-medium text-gray-700 mb-2">
              目的地
            </label>
            <input
              type="text"
              id="destination"
              name="destination"
              value={formData.destination}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
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
        </div>

        <div className="mt-6 flex justify-end space-x-4">
          <button
            type="button"
            onClick={handleCancel}
            className="px-4 py-2 text-gray-600 hover:text-gray-900 font-medium"
          >
            キャンセル
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || !formData.title}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-2 px-6 rounded-lg transition duration-200"
          >
            {saving ? '保存中...' : '保存'}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">{trip.title}</h2>
          {trip.description && (
            <p className="text-gray-600 mb-2">{trip.description}</p>
          )}
          {trip.destination && (
            <p className="text-gray-500 mb-2">📍 {trip.destination}</p>
          )}
          {trip.start_date && trip.end_date && (
            <p className="text-gray-500">
              📅 {new Date(trip.start_date).toLocaleDateString('ja-JP')} - {new Date(trip.end_date).toLocaleDateString('ja-JP')}
            </p>
          )}
        </div>
        <button
          onClick={() => setIsEditing(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition duration-200"
        >
          編集
        </button>
      </div>
    </div>
  )
}
