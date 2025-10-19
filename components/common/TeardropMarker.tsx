interface TeardropMarkerProps {
  number: number
  isSelected?: boolean
  position?: 'left' | 'map'
  className?: string
}

export function TeardropMarker({ 
  number, 
  isSelected = false, 
  position = 'left',
  className = '' 
}: TeardropMarkerProps) {
  const markerClass = position === 'left' ? 'teardrop-marker-left' : 'teardrop-marker-map'
  const labelClass = position === 'left' ? 'teardrop-label-left' : 'teardrop-label-map'
  
  return (
    <div className={`relative mt-3 ${className}`}>
      <div className={`${markerClass} ${isSelected ? 'selected' : ''}`}>
        <div className={labelClass}>
          {number}
        </div>
      </div>
    </div>
  )
}

