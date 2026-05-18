import { toast } from 'sonner'
import { cn } from '@/lib/utils/cn'
import type { OdontogramState, ToothState } from '@/types/domain'

const STATUSES: ToothState['status'][] = ['healthy', 'caries', 'filled', 'missing', 'crown']

const labels: Record<ToothState['status'], string> = {
  healthy: 'Sano',
  caries: 'Caries',
  filled: 'Obturado',
  missing: 'Ausente',
  crown: 'Corona',
}

interface OdontogramSimpleProps {
  state: OdontogramState
  readOnly?: boolean
  onChange: (next: OdontogramState) => void
}

export function OdontogramSimple({ state, readOnly, onChange }: OdontogramSimpleProps) {
  const cycle = (t: ToothState) => {
    if (readOnly) return
    const i = STATUSES.indexOf(t.status)
    const nextStatus = STATUSES[(i + 1) % STATUSES.length]
    const teeth = state.teeth.map((x) => (x.toothId === t.toothId ? { ...x, status: nextStatus } : x))
    onChange({ ...state, teeth, updatedAt: new Date().toISOString() })
    toast.message(`Pieza ${t.toothId}: ${labels[nextStatus]}`)
  }

  const row = (ids: string[]) => (
    <div className="flex flex-wrap justify-center gap-1">
      {ids.map((id) => {
        const t = state.teeth.find((x) => x.toothId === id)
        if (!t) return null
        const color =
          t.status === 'healthy'
            ? 'bg-emerald-500/20 border-emerald-600/40'
            : t.status === 'caries'
              ? 'bg-amber-500/25 border-amber-600/50'
              : t.status === 'filled'
                ? 'bg-sky-500/20 border-sky-600/40'
                : t.status === 'missing'
                  ? 'bg-slate-300/40 border-slate-500/40 line-through'
                  : 'bg-violet-500/20 border-violet-600/40'
        return (
          <button
            key={id}
            type="button"
            disabled={readOnly}
            onClick={() => cycle(t)}
            title={`${id} — ${labels[t.status]}`}
            className={cn(
              'flex h-8 w-8 items-center justify-center rounded border text-[10px] font-semibold transition-colors',
              color,
              !readOnly && 'hover:ring-2 hover:ring-primary/40',
            )}
          >
            {id}
          </button>
        )
      })}
    </div>
  )

  return (
    <div className="space-y-3 rounded-lg border bg-muted/20 p-4">
      <p className="text-xs text-muted-foreground">
        Vista simplificada FDI. Clic para rotar estado (simulado). Leyenda: sano · caries · obturado · ausente · corona.
      </p>
      {row(['18', '17', '16', '15', '14', '13', '12', '11'])}
      {row(['21', '22', '23', '24', '25', '26', '27', '28'])}
      <div className="h-2" />
      {row(['48', '47', '46', '45', '44', '43', '42', '41'])}
      {row(['31', '32', '33', '34', '35', '36', '37', '38'])}
    </div>
  )
}
