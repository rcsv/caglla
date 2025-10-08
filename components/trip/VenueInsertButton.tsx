'use client'

import { useState } from 'react'

interface VenueInsertButtonProps {
  onInsert: () => void
  dayId: string
}

export default function VenueInsertButton({ onInsert, dayId }: VenueInsertButtonProps) {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <div className="flex justify-center py-2">
      <button
        onClick={onInsert}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`flex items-center justify-center w-8 h-8 rounded-full transition-all duration-200 ${
          isHovered 
            ? 'bg-blue-500 text-white shadow-lg scale-110' 
            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
        }`}
        title="間にVenueを追加"
      >
        <svg 
          className="w-5 h-5" 
          fill="currentColor" 
          viewBox="0 0 24 24"
        >
          {/* + アイコン */}
          <path d="M12 2C13.1 2 14 2.9 14 4V10H20C21.1 10 22 10.9 22 12S21.1 14 20 14H14V20C14 21.1 13.1 22 12 22S10 21.1 10 20V14H4C2.9 14 2 13.1 2 12S2.9 10 4 10H10V4C10 2.9 10.9 2 12 2Z" />
          {/* 📍 ピンアイコン（小さく重ねる） */}
          <path 
            d="M12 2C8.13 2 5 5.13 5 9C5 14.25 12 22 12 22S19 14.25 19 9C19 5.13 15.87 2 12 2ZM12 11.5C10.62 11.5 9.5 10.38 9.5 9S10.62 6.5 12 6.5S14.5 7.62 14.5 9S13.38 11.5 12 11.5Z" 
            fill={isHovered ? 'white' : '#6B7280'}
            opacity="0.8"
            transform="scale(0.3) translate(20, 20)"
          />
        </svg>
      </button>
    </div>
  )
}
