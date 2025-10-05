'use client'

import React from 'react'

export interface PlannerIconProps extends React.SVGProps<SVGSVGElement> {}

export const PlannerIcon: React.FC<PlannerIconProps> = ({ className, ...rest }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.8}
    strokeLinecap="round"
    strokeLinejoin="round"
    role="img"
    aria-label="Planner (map with knockout pin)"
    className={className}
    {...rest}
  >
    <defs>
      <mask id="cut-pin">
        <rect x="0" y="0" width="24" height="24" fill="white" />
        <path
          d="M17 4.5a4.7 4.7 0 0 1 4.7 4.7c0 3.3-4.7 6.6-4.7 6.6S12.3 12.5 12.3 9.2A4.7 4.7 0 0 1 17 4.5z"
          fill="black"
          stroke="black"
          strokeWidth={3.2}
        />
      </mask>
    </defs>

    {/* map (masked so it does not draw under the pin) */}
    <g mask="url(#cut-pin)" fill="none" stroke="currentColor" strokeWidth={1.8}>
      <path d="M3.5 6.5l5.4-2.1 5.2 2.1 5.4-2.1v12.9l-5.4 2.1-5.2-2.1-5.4 2.1V6.5z" />
      <path d="M8.9 4.4v12.9" />
      <path d="M14.1 6.5v12.9" />
    </g>

    {/* pin (always on top) */}
    <path d="M17 4.5a4.7 4.7 0 0 1 4.7 4.7c0 3.3-4.7 6.6-4.7 6.6S12.3 12.5 12.3 9.2A4.7 4.7 0 0 1 17 4.5z" />
    <circle cx="17" cy="9.2" r="1.7" fill="currentColor" stroke="none" />
  </svg>
)

export default PlannerIcon


