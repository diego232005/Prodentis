import { About } from '@/modules/landing/components/About'
import { Formulario } from '@/modules/landing/components/Formulario'
import { Footer } from '@/modules/landing/components/Footer'
import { Hero } from '@/modules/landing/components/Hero'
import { Nav } from '@/modules/landing/components/Nav'
import { Services } from '@/modules/landing/components/Services'

/** Página pública: composición de componentes (nav, secciones, footer). */
export function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Nav />
      <main>
        <Hero />
        <Services />
        <About />
        <Formulario />
      </main>
      <Footer />
    </div>
  )
}
