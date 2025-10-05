'use client'

import React from 'react'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  hint?: string
  error?: string
}

export const Input: React.FC<InputProps> = ({ label, hint, error, className, ...rest }) => {
  return (
    <label className="block w-full">
      {label && <span className="mb-1 block text-sm font-medium text-gray-700">{label}</span>}
      <input className={["tj-input", error ? 'border-rose-400 focus:ring-rose-400' : '', className].filter(Boolean).join(' ')} {...rest} />
      {error ? (
        <span className="mt-1 block text-xs text-rose-600">{error}</span>
      ) : (
        hint ? <span className="mt-1 block text-xs text-gray-500">{hint}</span> : null
      )}
    </label>
  )
}

export default Input


