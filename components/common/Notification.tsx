'use client'

import React, { useEffect } from 'react'
import { Icon } from '@iconify/react'

export type NotificationType = 'success' | 'warning' | 'error'

export interface Notification {
  id: string
  type: NotificationType
  message: string
  duration?: number // ミリ秒、デフォルトは3000ms
}

interface NotificationProps {
  notification: Notification
  onClose: () => void
}

const NotificationItem: React.FC<NotificationProps> = ({ notification, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose()
    }, notification.duration || 3000)

    return () => clearTimeout(timer)
  }, [notification.duration, onClose])

  const typeStyles = {
    success: {
      bg: 'bg-emerald-50',
      border: 'border-emerald-200',
      text: 'text-emerald-800',
      icon: 'mdi:check-circle',
      iconColor: 'text-emerald-600',
    },
    warning: {
      bg: 'bg-yellow-50',
      border: 'border-yellow-200',
      text: 'text-yellow-800',
      icon: 'mdi:alert',
      iconColor: 'text-yellow-600',
    },
    error: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      text: 'text-red-800',
      icon: 'mdi:alert-circle',
      iconColor: 'text-red-600',
    },
  }

  const styles = typeStyles[notification.type]

  return (
    <div
      className={`${styles.bg} ${styles.border} ${styles.text} border rounded-lg shadow-lg p-4 min-w-[300px] max-w-[500px] flex items-start gap-3 transform transition-all duration-300 ease-out`}
      role="alert"
      style={{
        animation: 'slideInFromTop 0.3s ease-out',
      }}
    >
      <Icon icon={styles.icon} className={`${styles.iconColor} w-5 h-5 flex-shrink-0 mt-0.5`} />
      <div className="flex-1">
        <p className="text-sm font-medium">{notification.message}</p>
      </div>
      <button
        onClick={onClose}
        className={`${styles.text} hover:opacity-70 flex-shrink-0`}
        aria-label="Close notification"
      >
        <Icon icon="mdi:close" className="w-4 h-4" />
      </button>
    </div>
  )
}

interface NotificationContainerProps {
  notifications: Notification[]
  onClose: (id: string) => void
}

export const NotificationContainer: React.FC<NotificationContainerProps> = ({
  notifications,
  onClose,
}) => {
  if (notifications.length === 0) return null

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
      {notifications.map((notification) => (
        <NotificationItem
          key={notification.id}
          notification={notification}
          onClose={() => onClose(notification.id)}
        />
      ))}
    </div>
  )
}
