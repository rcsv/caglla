import React from 'react'

type SectionProps = {
  title: string
  titleClassName?: string
  className?: string
  id?: string
  children: React.ReactNode
}

export function Section({ title, titleClassName = '', className = '', id, children }: SectionProps) {
  return (
    <section id={id} className={className}>
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
        <div className="md:col-span-4 headline-marker">
          <h2 className={`text-3xl md:text-4xl font-bold text-gray-900 ${titleClassName}`}>{title}</h2>
        </div>
        <div className="md:col-span-8">
          {children}
        </div>
      </div>
    </section>
  )
}


