import * as React from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { cn } from '@/lib/utils/cn'
import { formatDate } from '@/lib/formatters/date'
import type { PeriodontogramEntry } from '@/types/domain'

type Triple = [number, number, number]
export type PeriodontogramInput = Omit<PeriodontogramEntry, 'id' | 'recordedAt'>

const TEETH = [
  '18', '17', '16', '15', '14', '13', '12', '11', '21', '22', '23', '24', '25', '26', '27', '28',
  '48', '47', '46', '45', '44', '43', '42', '41', '31', '32', '33', '34', '35', '36', '37', '38',
]

const depthClass = (n: number) => (n >= 6 ? 'bg-red-100 text-red-700' : n >= 4 ? 'bg-amber-100 text-amber-700' : 'bg-teal-50 text-teal-800')

function Triple3({ label, value, onChange }: { label: string; value: Triple; onChange: (v: Triple) => void }) {
  return (
    <div>
      <p className="mb-1 text-xs font-medium">{label} (D · C · M, mm)</p>
      <div className="flex gap-1">
        {value.map((n, i) => (
          <Input
            key={i}
            type="number"
            min={0}
            max={15}
            className="h-8 w-16 px-2"
            value={n}
            onChange={(e) => {
              const next = [...value] as Triple
              next[i] = Math.max(0, Math.min(15, Number(e.target.value) || 0))
              onChange(next)
            }}
          />
        ))}
      </div>
    </div>
  )
}

interface PeriodontogramPanelProps {
  patientId: string
  entries: PeriodontogramEntry[]
  onSave: (input: PeriodontogramInput) => void
  saving?: boolean
  readOnly?: boolean
}

export function PeriodontogramPanel({ patientId, entries, onSave, saving, readOnly }: PeriodontogramPanelProps) {
  const [toothId, setToothId] = React.useState('16')
  const [pv, setPv] = React.useState<Triple>([2, 2, 2])
  const [pl, setPl] = React.useState<Triple>([2, 2, 2])
  const [mobility, setMobility] = React.useState<0 | 1 | 2 | 3>(0)
  const [bleeding, setBleeding] = React.useState(false)
  const [plaque, setPlaque] = React.useState(false)
  const [recession, setRecession] = React.useState(0)

  const latest = React.useMemo(() => {
    const map = new Map<string, PeriodontogramEntry>()
    for (const e of [...entries].sort((a, b) => a.recordedAt.localeCompare(b.recordedAt))) map.set(e.toothId, e)
    return [...map.values()].sort((a, b) => TEETH.indexOf(a.toothId) - TEETH.indexOf(b.toothId))
  }, [entries])

  return (
    <div className="space-y-5">
      {!readOnly ? (
        <div className="space-y-3 rounded-lg border border-teal-100 bg-teal-50/30 p-4">
          <div className="flex flex-wrap items-end gap-4">
            <div>
              <p className="mb-1 text-xs font-medium">Pieza</p>
              <Select value={toothId} onValueChange={setToothId}>
                <SelectTrigger className="h-8 w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TEETH.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Triple3 label="Vestibular" value={pv} onChange={setPv} />
            <Triple3 label="Lingual" value={pl} onChange={setPl} />
            <div>
              <p className="mb-1 text-xs font-medium">Movilidad</p>
              <Select value={String(mobility)} onValueChange={(v) => setMobility(Number(v) as 0 | 1 | 2 | 3)}>
                <SelectTrigger className="h-8 w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[0, 1, 2, 3].map((m) => (
                    <SelectItem key={m} value={String(m)}>
                      {m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <p className="mb-1 text-xs font-medium">Recesión (mm)</p>
              <Input type="number" min={0} max={15} className="h-8 w-20" value={recession} onChange={(e) => setRecession(Number(e.target.value) || 0)} />
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-sm">
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={bleeding} onChange={(e) => setBleeding(e.target.checked)} />
              Sangrado al sondaje
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={plaque} onChange={(e) => setPlaque(e.target.checked)} />
              Placa
            </label>
            <Button
              type="button"
              size="sm"
              disabled={saving}
              onClick={() =>
                onSave({
                  patientId,
                  toothId,
                  probingVestibular: pv,
                  probingLingual: pl,
                  mobility,
                  bleeding,
                  plaque,
                  recession: recession || undefined,
                })
              }
            >
              {saving ? 'Guardando…' : 'Registrar pieza'}
            </Button>
          </div>
        </div>
      ) : null}

      {latest.length === 0 ? (
        <p className="text-sm text-muted-foreground">Sin mediciones periodontales registradas.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Pieza</TableHead>
              <TableHead>Vestibular</TableHead>
              <TableHead>Lingual</TableHead>
              <TableHead>Mov.</TableHead>
              <TableHead>Sangrado</TableHead>
              <TableHead>Placa</TableHead>
              <TableHead>Fecha</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {latest.map((e) => (
              <TableRow key={e.id}>
                <TableCell className="font-semibold">{e.toothId}</TableCell>
                {[e.probingVestibular, e.probingLingual].map((tr, k) => (
                  <TableCell key={k}>
                    <div className="flex gap-1">
                      {tr.map((n, i) => (
                        <span key={i} className={cn('rounded px-1.5 py-0.5 text-xs font-medium', depthClass(n))}>
                          {n}
                        </span>
                      ))}
                    </div>
                  </TableCell>
                ))}
                <TableCell>{e.mobility}</TableCell>
                <TableCell>{e.bleeding ? 'Sí' : '—'}</TableCell>
                <TableCell>{e.plaque ? 'Sí' : '—'}</TableCell>
                <TableCell className="text-xs text-muted-foreground">{formatDate(e.recordedAt)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  )
}
