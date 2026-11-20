import * as React from 'react'
import { FileImage, RotateCw, Upload, ZoomIn, ZoomOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils/cn'
import { formatDate } from '@/lib/formatters/date'
import type { DiagnosticFile } from '@/types/domain'

interface RadiologyViewerProps {
  files: DiagnosticFile[]
  onUpload?: (file: File) => void
  uploading?: boolean
}

export function RadiologyViewer({ files, onUpload, uploading }: RadiologyViewerProps) {
  const [selectedId, setSelectedId] = React.useState<string | null>(null)
  const [zoom, setZoom] = React.useState(1)
  const [rotation, setRotation] = React.useState(0)
  const [brightness, setBrightness] = React.useState(100)
  const [contrast, setContrast] = React.useState(100)
  const [invert, setInvert] = React.useState(false)
  const inputRef = React.useRef<HTMLInputElement>(null)

  const selected = files.find((f) => f.id === selectedId) ?? files[0]
  const isImage = selected?.mimeType.startsWith('image/')

  const reset = () => {
    setZoom(1)
    setRotation(0)
    setBrightness(100)
    setContrast(100)
    setInvert(false)
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_220px]">
      <div className="space-y-3">
        <div className="flex h-[420px] items-center justify-center overflow-auto rounded-lg border bg-slate-900">
          {selected && isImage ? (
            <img
              src={selected.url}
              alt={selected.name}
              draggable={false}
              className="max-h-full max-w-full select-none transition-transform"
              style={{
                transform: `scale(${zoom}) rotate(${rotation}deg)`,
                filter: `brightness(${brightness}%) contrast(${contrast}%) invert(${invert ? 1 : 0})`,
              }}
            />
          ) : selected ? (
            <a className="text-sm text-teal-200 underline" href={selected.url} target="_blank" rel="noreferrer">
              Abrir {selected.name}
            </a>
          ) : (
            <p className="text-sm text-slate-400">Sin imágenes diagnósticas.</p>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <Button type="button" size="sm" variant="outline" onClick={() => setZoom((z) => Math.min(4, z + 0.25))}>
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button type="button" size="sm" variant="outline" onClick={() => setZoom((z) => Math.max(0.25, z - 0.25))}>
            <ZoomOut className="h-4 w-4" />
          </Button>
          <Button type="button" size="sm" variant="outline" onClick={() => setRotation((r) => (r + 90) % 360)}>
            <RotateCw className="h-4 w-4" />
          </Button>
          <Button type="button" size="sm" variant={invert ? 'default' : 'outline'} onClick={() => setInvert((v) => !v)}>
            Negativo
          </Button>
          <Button type="button" size="sm" variant="ghost" onClick={reset}>
            Restablecer
          </Button>
          <label className="flex items-center gap-1">
            Brillo
            <input type="range" min={40} max={200} value={brightness} onChange={(e) => setBrightness(+e.target.value)} />
          </label>
          <label className="flex items-center gap-1">
            Contraste
            <input type="range" min={40} max={250} value={contrast} onChange={(e) => setContrast(+e.target.value)} />
          </label>
        </div>
        {selected ? (
          <p className="text-xs text-muted-foreground">
            {selected.title || selected.name || 'Archivo'} · {formatDate(selected.uploadedAt || selected.createdAt || selected.takenAt || new Date().toISOString())}
            {selected.toothId ? ` · pieza ${selected.toothId}` : ''}
            {selected.notes ? ` · ${selected.notes}` : ''}
          </p>
        ) : null}
      </div>

      <div className="space-y-2">
        {onUpload ? (
          <>
            <input
              ref={inputRef}
              type="file"
              accept="image/*,application/pdf"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0]
                if (f) onUpload(f)
                e.target.value = ''
              }}
            />
            <Button type="button" className="w-full" disabled={uploading} onClick={() => inputRef.current?.click()}>
              <Upload className="mr-2 h-4 w-4" />
              {uploading ? 'Subiendo…' : 'Subir imagen'}
            </Button>
          </>
        ) : null}
        <ul className="max-h-[380px] space-y-1 overflow-y-auto">
          {files.map((f) => (
            <li key={f.id}>
              <button
                type="button"
                onClick={() => {
                  setSelectedId(f.id)
                  reset()
                }}
                className={cn(
                  'flex w-full items-center gap-2 rounded-md border px-2 py-1.5 text-left text-xs hover:bg-muted',
                  selected?.id === f.id && 'border-primary bg-teal-50',
                )}
              >
                {f.mimeType.startsWith('image/') ? (
                  <img src={f.url} alt="" className="h-8 w-8 rounded object-cover" />
                ) : (
                  <FileImage className="h-8 w-8 text-muted-foreground" />
                )}
                <span className="line-clamp-2">{f.name}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
