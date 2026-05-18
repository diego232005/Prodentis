import { formatDateTime } from '@/lib/formatters/date'
import { cn } from '@/lib/utils/cn'

export interface TimelineItem {
  id: string
  title: string
  subtitle?: string
  body?: string
  createdAt: string
  dotClassName?: string
}

interface TimelineProps {
  items: TimelineItem[]
  className?: string
}

export function Timeline({ items, className }: TimelineProps) {
  if (items.length === 0) return null
  return (
    <ol className={cn('relative border-l border-border pl-6', className)}>
      {items.map((item) => (
        <li key={item.id} className="mb-8 last:mb-0">
          <span
            className={cn(
              'absolute -left-[5px] mt-1.5 h-2.5 w-2.5 rounded-full border border-background bg-primary',
              item.dotClassName,
            )}
          />
          <div className="flex flex-wrap items-baseline gap-2">
            <h4 className="text-sm font-semibold">{item.title}</h4>
            <time className="text-xs text-muted-foreground">{formatDateTime(item.createdAt)}</time>
          </div>
          {item.subtitle ? <p className="text-xs text-muted-foreground">{item.subtitle}</p> : null}
          {item.body ? <p className="mt-2 text-sm text-foreground/90">{item.body}</p> : null}
        </li>
      ))}
    </ol>
  )
}
