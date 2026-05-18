import * as React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils/cn'

interface SectionCardProps {
  title: string
  description?: string
  children: React.ReactNode
  className?: string
  headerRight?: React.ReactNode
}

export function SectionCard({ title, description, children, className, headerRight }: SectionCardProps) {
  return (
    <Card className={cn(className)}>
      <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
        <div>
          <CardTitle className="text-base">{title}</CardTitle>
          {description ? <CardDescription className="mt-1">{description}</CardDescription> : null}
        </div>
        {headerRight}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  )
}
