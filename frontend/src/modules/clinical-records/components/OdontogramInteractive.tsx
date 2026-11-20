import * as React from 'react'
import { Camera } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils/cn'
import type { ToothStatus, ToothSurface } from '@/types/common'
import type { OdontogramState, ToothState } from '@/types/domain'

const TOOTH_STATUS_LABELS: Record<ToothStatus, string> = {
  healthy: 'Sano',
  caries: 'Caries',
  filled: 'Obturado',
  missing: 'Ausente',
  crown: 'Corona',
  endodontics: 'Endodoncia',
  extraction: 'Extracción indicada',
  implant: 'Implante',
  fracture: 'Fractura',
  sealant: 'Sellante',
  bridge: 'Puente',
  prosthesis: 'Prótesis',
}

const STATUS_COLOR: Record<ToothStatus, string> = {
  healthy: '#ffffff',
  caries: '#ef4444',
  filled: '#3b82f6',
  missing: '#cbd5e1',
  crown: '#f59e0b',
  endodontics: '#a855f7',
  extraction: '#991b1b',
  implant: '#6366f1',
  fracture: '#f97316',
  sealant: '#10b981',
  bridge: '#06b6d4',
  prosthesis: '#ec4899',
}

const STATUSES = Object.keys(TOOTH_STATUS_LABELS) as ToothStatus[]

const ADULT_UPPER = ['18', '17', '16', '15', '14', '13', '12', '11', '21', '22', '23', '24', '25', '26', '27', '28']
const ADULT_LOWER = ['48', '47', '46', '45', '44', '43', '42', '41', '31', '32', '33', '34', '35', '36', '37', '38']
const PEDO_UPPER = ['55', '54', '53', '52', '51', '61', '62', '63', '64', '65']
const PEDO_LOWER = ['85', '84', '83', '82', '81', '71', '72', '73', '74', '75']

const isLeftSide = (id: string) => ['2', '3', '6', '7'].includes(id[0])

function ToothSvg({
  tooth,
  readOnly,
  onSurface,
}: {
  tooth: ToothState
  readOnly?: boolean
  onSurface: (s: ToothSurface) => void
}) {
  const left = isLeftSide(tooth.toothId)
  const fill = (s: ToothSurface) => STATUS_COLOR[tooth.surfaces?.[s] ?? 'healthy']
  const whole = tooth.status !== 'healthy' && tooth.status !== 'caries' && tooth.status !== 'filled'
  const cls = cn('stroke-teal-700/70 transition-opacity', !readOnly && 'cursor-pointer hover:opacity-70')
  const poly = (s: ToothSurface, points: string) => (
    <polygon points={points} fill={fill(s)} className={cls} strokeWidth={1} onClick={() => !readOnly && onSurface(s)}>
      <title>{`${tooth.toothId} · ${s}`}</title>
    </polygon>
  )
  // Mesial mira a la línea media: izquierda del dibujo en cuadrantes 2,3,6,7
  const mesialLeft = left
  return (
    <svg width={32} height={32} viewBox="0 0 32 32" className="shrink-0">
      {poly('V', '0,0 32,0 24,8 8,8')}
      {poly('L', '0,32 32,32 24,24 8,24')}
      {poly(mesialLeft ? 'M' : 'D', '0,0 8,8 8,24 0,32')}
      {poly(mesialLeft ? 'D' : 'M', '32,0 24,8 24,24 32,32')}
      {poly('O', '8,8 24,8 24,24 8,24')}
      {whole ? (
        <>
          <rect x={0} y={0} width={32} height={32} fill={STATUS_COLOR[tooth.status]} opacity={0.35} pointerEvents="none" />
          {tooth.status === 'missing' || tooth.status === 'extraction' ? (
            <path d="M3 3 L29 29 M29 3 L3 29" stroke={STATUS_COLOR[tooth.status]} strokeWidth={2.5} pointerEvents="none" />
          ) : null}
        </>
      ) : null}
    </svg>
  )
}

interface OdontogramInteractiveProps {
  state: OdontogramState
  readOnly?: boolean
  onChange: (next: OdontogramState) => void
  onSnapshot?: (state: OdontogramState) => void
  snapshotPending?: boolean
}

export function OdontogramInteractive({ state, readOnly, onChange, onSnapshot, snapshotPending }: OdontogramInteractiveProps) {
  const [dentition, setDentition] = React.useState<'adult' | 'pediatric'>(state.dentition ?? 'adult')
  const [tool, setTool] = React.useState<ToothStatus>('caries')

  const getTooth = (id: string): ToothState => state.teeth.find((t) => t.toothId === id) ?? { toothId: id, status: 'healthy' }

  const commit = (next: ToothState) => {
    const exists = state.teeth.some((t) => t.toothId === next.toothId)
    const teeth = exists ? state.teeth.map((t) => (t.toothId === next.toothId ? next : t)) : [...state.teeth, next]
    onChange({ ...state, dentition, teeth, updatedAt: new Date().toISOString() })
  }

  const applyToSurface = (id: string, surface: ToothSurface) => {
    if (readOnly) return
    const t = getTooth(id)
    const current = t.surfaces?.[surface] ?? 'healthy'
    const status = current === tool ? 'healthy' : tool
    const surfaces = { ...(t.surfaces ?? {}), [surface]: status }
    const anyMarked = Object.values(surfaces).find((s) => s && s !== 'healthy')
    commit({ ...t, surfaces, status: t.status === 'missing' ? 'healthy' : anyMarked ?? 'healthy' })
  }

  const applyToTooth = (id: string) => {
    if (readOnly) return
    const t = getTooth(id)
    const status = t.status === tool ? 'healthy' : tool
    commit({ toothId: id, status, surfaces: status === 'healthy' ? {} : t.surfaces, notes: t.notes })
  }

  const row = (ids: string[], labelsBelow = false) => (
    <div className="flex flex-wrap justify-center gap-1">
      {ids.map((id) => {
        const t = getTooth(id)
        const label = (
          <button
            type="button"
            disabled={readOnly}
            onClick={() => applyToTooth(id)}
            title={`${id} — ${TOOTH_STATUS_LABELS[t.status]} (clic: aplicar a pieza completa)`}
            className={cn(
              'rounded px-1 text-[10px] font-semibold leading-4 text-teal-800',
              !readOnly && 'hover:bg-teal-100',
              t.status !== 'healthy' && 'bg-teal-50',
            )}
          >
            {id}
          </button>
        )
        return (
          <div key={id} className="flex flex-col items-center gap-0.5">
            {!labelsBelow && label}
            <ToothSvg tooth={t} readOnly={readOnly} onSurface={(s) => applyToSurface(id, s)} />
            {labelsBelow && label}
          </div>
        )
      })}
    </div>
  )

  const upper = dentition === 'adult' ? ADULT_UPPER : PEDO_UPPER
  const lower = dentition === 'adult' ? ADULT_LOWER : PEDO_LOWER

  return (
    <div className="space-y-4 rounded-lg border border-teal-100 bg-white p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="inline-flex rounded-md border border-teal-200 p-0.5 text-xs">
          {(['adult', 'pediatric'] as const).map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => setDentition(k)}
              className={cn(
                'rounded px-3 py-1 font-medium',
                dentition === k ? 'bg-primary text-primary-foreground' : 'text-teal-800 hover:bg-teal-50',
              )}
            >
              {k === 'adult' ? 'Adulto (FDI)' : 'Pediátrico (FDI)'}
            </button>
          ))}
        </div>
        {onSnapshot && !readOnly ? (
          <Button type="button" size="sm" variant="outline" disabled={snapshotPending} onClick={() => onSnapshot(state)}>
            <Camera className="mr-2 h-4 w-4" />
            Guardar snapshot
          </Button>
        ) : null}
      </div>

      {!readOnly ? (
        <div className="flex flex-wrap gap-1.5">
          {STATUSES.filter((s) => s !== 'healthy').map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setTool(s)}
              className={cn(
                'flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs transition-colors',
                tool === s ? 'border-primary bg-teal-50 font-semibold' : 'border-border hover:bg-muted',
              )}
            >
              <span className="h-2.5 w-2.5 rounded-full border border-black/10" style={{ background: STATUS_COLOR[s] }} />
              {TOOTH_STATUS_LABELS[s]}
            </button>
          ))}
        </div>
      ) : null}

      <div className="overflow-x-auto">
        <div className="min-w-fit space-y-2">
          {row(upper)}
          <div className="mx-auto h-px max-w-xl bg-teal-200" />
          {row(lower, true)}
        </div>
      </div>
      <p className="text-xs text-muted-foreground">
        Clic en una superficie (V, L, M, D, O) para marcarla con el hallazgo seleccionado; clic en el número para la pieza
        completa. Repetir el clic con el mismo hallazgo lo quita.
      </p>
    </div>
  )
}
