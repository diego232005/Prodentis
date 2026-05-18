import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

interface LoadingStateProps {
  message?: string
  className?: string
}

export function LoadingState({ message = 'Cargando…', className }: LoadingStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center gap-3 py-16 text-muted-foreground', className)}>
      <Loader2 className="h-8 w-8 animate-spin" aria-hidden />
      <p className="text-sm">{message}</p>
    </div>
  )
}
