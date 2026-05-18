import * as React from 'react'
import { cn } from '@/lib/utils/cn'

export interface InfoItem {
  label: string
  value: React.ReactNode
}

interface InfoGridProps {
  items: InfoItem[]
  className?: string
}

export function InfoGrid({ items, className }: InfoGridProps) {
  return (
    <dl className={cn('grid gap-4 sm:grid-cols-2', className)}>
      {items.map((item) => (
        <div key={item.label}>
          <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{item.label}</dt>
          <dd className="mt-1 text-sm text-foreground">{item.value}</dd>
        </div>
      ))}
    </dl>
  )
}
