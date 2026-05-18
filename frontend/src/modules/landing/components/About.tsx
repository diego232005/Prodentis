import { Mail, MapPin, Phone } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useAppDataStore } from '@/app/store/useAppDataStore'

export function About() {
  const clinic = useAppDataStore((s) => s.clinic)

  return (
    <section id="nosotros" className="scroll-mt-20 border-b bg-muted/30 py-16 lg:py-20">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 lg:grid-cols-2 lg:gap-16 lg:px-8">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">Confianza clínica</h2>
          <p className="mt-4 text-muted-foreground">
            PRODENTIS nace como respuesta a consultorios que necesitan orden operativo sin sacrificar la calidad de
            atención. Priorizamos una interfaz sobria, legible y alineada con estándares de software de salud.
          </p>
          <p className="mt-4 text-muted-foreground">
            Si su equipo está listo para digitalizar procesos, podemos acompañar la implementación y adaptar el producto a
            su flujo de trabajo.
          </p>
        </div>
        <Card className="border-primary/10">
          <CardHeader>
            <CardTitle className="text-base">Datos de contacto</CardTitle>
            <CardDescription>Información actual del consultorio.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="flex gap-3">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <span>{clinic.address}</span>
            </div>
            <div className="flex gap-3">
              <Phone className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <a href={`tel:${clinic.phone.replace(/\s/g, '')}`} className="hover:underline">
                {clinic.phone}
              </a>
            </div>
            <div className="flex gap-3">
              <Mail className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <a href={`mailto:${clinic.email}`} className="hover:underline">
                {clinic.email}
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  )
}
