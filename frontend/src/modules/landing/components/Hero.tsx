import { Link } from 'react-router-dom'
import { ArrowRight, CalendarCheck2, ClipboardList, HeartPulse, ShieldCheck, Sparkles, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ProDentisLogo } from '@/components/shared/ProDentisLogo'
import { ROUTES } from '@/lib/constants/routes'

export function Hero() {
  return (
    <section className="relative overflow-hidden border-b bg-gradient-to-b from-primary/[0.07] via-background to-background">
      <div className="pointer-events-none absolute -right-24 top-0 h-72 w-72 rounded-full bg-accent/15 blur-3xl" aria-hidden />
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 lg:grid-cols-2 lg:px-8 lg:py-24">
        <div className="flex flex-col justify-center">
          <ProDentisLogo variant="hero" className="mb-2 md:hidden" />
          <p className="inline-flex w-fit items-center gap-2 rounded-full border bg-card px-3 py-1 text-xs font-medium text-muted-foreground shadow-sm">
            <Sparkles className="h-3.5 w-3.5 text-accent" />
            Software para consultorios odontológicos
          </p>
          <h1 className="mt-6 text-3xl font-semibold tracking-tight sm:text-4xl lg:text-5xl">
            Gestión clínica clara, segura y pensada para su equipo
          </h1>
          <p className="mt-4 max-w-xl text-base text-muted-foreground sm:text-lg">
            PRODENTIS centraliza citas, historias clínicas, facturación e inventario en una sola plataforma profesional.
            Menos papeles, más tiempo con sus pacientes.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button size="lg" asChild>
              <a href="#contacto">
                Solicitar información
                <ArrowRight className="ml-2 h-4 w-4" />
              </a>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link to={ROUTES.login}>Acceso equipo</Link>
            </Button>
          </div>
          <div className="mt-10 flex flex-wrap gap-6 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-primary" />
              Enfoque en salud y cumplimiento
            </div>
            <div className="flex items-center gap-2">
              <HeartPulse className="h-4 w-4 text-accent" />
              Experiencia clínica moderna
            </div>
          </div>
        </div>
        <div className="flex flex-col items-center justify-center gap-8 lg:items-end">
          <ProDentisLogo variant="hero" className="hidden drop-shadow-sm md:block" />
          <Card className="w-full max-w-md border-primary/15 shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg">¿Por qué ProDentis?</CardTitle>
              <CardDescription>Diseñado para odontólogos, recepción y administración.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-muted-foreground">
              <ul className="space-y-3">
                <li className="flex gap-3">
                  <CalendarCheck2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  Agenda y recordatorios bajo control, con estados de cita claros.
                </li>
                <li className="flex gap-3">
                  <ClipboardList className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  Historia clínica estructurada, tratamientos y facturación alineados.
                </li>
                <li className="flex gap-3">
                  <Users className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  Roles para recepción, odontólogo, auxiliar y administración.
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  )
}
