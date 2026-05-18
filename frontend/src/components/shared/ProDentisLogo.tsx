import { cn } from '@/lib/utils/cn'
import { BRAND_LOGO_PATH } from '@/lib/constants/branding'

export type ProDentisLogoVariant = 'navbar' | 'sidebar' | 'sidebar-icon' | 'auth' | 'hero' | 'footer'

const variantClass: Record<ProDentisLogoVariant, string> = {
  /** Barra superior landing / compacta */
  navbar: 'h-9 w-auto max-h-9 max-w-[160px]',
  /** Sidebar expandido: marca completa */
  sidebar: 'h-10 w-auto max-h-10 max-w-[140px]',
  /** Sidebar colapsado: misma marca, contenida en tile */
  'sidebar-icon': 'h-9 w-9 object-contain',
  /** Login / recuperar contraseña */
  auth: 'h-20 w-auto max-w-[220px] md:h-24 md:max-w-[260px]',
  /** Hero landing */
  hero: 'h-28 w-auto max-w-[280px] md:h-32 md:max-w-[320px]',
  /** Pie de página */
  footer: 'h-11 w-auto max-h-11 max-w-[180px]',
}

interface ProDentisLogoProps {
  variant?: ProDentisLogoVariant
  className?: string
}

export function ProDentisLogo({ variant = 'navbar', className }: ProDentisLogoProps) {
  return (
    <img
      src={BRAND_LOGO_PATH}
      alt="ProDentis"
      className={cn(variantClass[variant], 'shrink-0 bg-transparent object-contain object-left', className)}
      decoding="async"
    />
  )
}
