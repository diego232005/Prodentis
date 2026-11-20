import * as React from 'react'
import { Eraser } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface SignaturePadProps {
  width?: number
  height?: number
  /** Devuelve data URL PNG, o null si se limpió. */
  onChange: (dataUrl: string | null) => void
}

export function SignaturePad({ width = 420, height = 160, onChange }: SignaturePadProps) {
  const ref = React.useRef<HTMLCanvasElement>(null)
  const drawing = React.useRef(false)
  const [empty, setEmpty] = React.useState(true)

  const pos = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const c = ref.current!
    const r = c.getBoundingClientRect()
    return { x: ((e.clientX - r.left) * c.width) / r.width, y: ((e.clientY - r.top) * c.height) / r.height }
  }

  const start = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const ctx = ref.current?.getContext('2d')
    if (!ctx) return
    e.currentTarget.setPointerCapture(e.pointerId)
    drawing.current = true
    const { x, y } = pos(e)
    ctx.lineWidth = 2
    ctx.lineCap = 'round'
    ctx.strokeStyle = '#0f172a'
    ctx.beginPath()
    ctx.moveTo(x, y)
  }

  const move = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current) return
    const ctx = ref.current?.getContext('2d')
    if (!ctx) return
    const { x, y } = pos(e)
    ctx.lineTo(x, y)
    ctx.stroke()
  }

  const end = () => {
    if (!drawing.current) return
    drawing.current = false
    setEmpty(false)
    onChange(ref.current?.toDataURL('image/png') ?? null)
  }

  const clear = () => {
    const c = ref.current
    c?.getContext('2d')?.clearRect(0, 0, c.width, c.height)
    setEmpty(true)
    onChange(null)
  }

  return (
    <div className="space-y-2">
      <canvas
        ref={ref}
        width={width}
        height={height}
        className="w-full max-w-md touch-none rounded-md border-2 border-dashed border-teal-300 bg-white"
        onPointerDown={start}
        onPointerMove={move}
        onPointerUp={end}
        onPointerLeave={end}
      />
      <div className="flex items-center gap-2">
        <Button type="button" size="sm" variant="outline" onClick={clear} disabled={empty}>
          <Eraser className="mr-2 h-4 w-4" />
          Borrar firma
        </Button>
        <span className="text-xs text-muted-foreground">Firme dentro del recuadro con mouse o dedo.</span>
      </div>
    </div>
  )
}
