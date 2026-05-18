/**
 * Convierte fondo blanco/negro casi sólido del PNG en transparencia real.
 * Uso: node scripts/fix-logo-transparency.mjs
 */
import sharp from 'sharp'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const logoPath = path.join(__dirname, '../public/brand/prodentis-logo.png')

const LUMINANCE_CUT = 248

const { data, info } = await sharp(logoPath).ensureAlpha().raw().toBuffer({ resolveWithObject: true })

for (let i = 0; i < data.length; i += 4) {
  const r = data[i]
  const g = data[i + 1]
  const b = data[i + 2]
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const isNearWhite = min >= LUMINANCE_CUT
  const isNearBlack = max <= 12
  if (isNearWhite || isNearBlack) {
    data[i + 3] = 0
  } else if (min >= 220) {
    const t = (min - 220) / (255 - 220)
    data[i + 3] = Math.round(data[i + 3] * (1 - t))
  }
}

await sharp(data, { raw: { width: info.width, height: info.height, channels: 4 } })
  .png({ compressionLevel: 9 })
  .toFile(logoPath)

console.log('Logo actualizado con transparencia:', logoPath)
