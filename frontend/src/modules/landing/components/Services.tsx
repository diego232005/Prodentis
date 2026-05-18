import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const ITEMS = [
  {
    title: 'Citas y agenda',
    body: 'Vista diaria, semanal y calendario; estados de turno y reprogramación ordenada.',
  },
  {
    title: 'Pacientes e historia clínica',
    body: 'Ficha completa, evolución, odontograma y documentación asociada al paciente.',
  },
  {
    title: 'Tratamientos',
    body: 'Catálogo de procedimientos, planes, seguimiento de sesiones y costos.',
  },
  {
    title: 'Facturación',
    body: 'Facturas, pagos parciales y estados; listo para integrarse con su contabilidad.',
  },
  {
    title: 'Inventario',
    body: 'Insumos, stock mínimo, alertas y movimientos de entrada y salida.',
  },
  {
    title: 'Reportes',
    body: 'Indicadores de citas, ingresos y uso de tratamientos para planificar crecimiento.',
  },
] as const

export function Services() {
  return (
    <section id="servicios" className="scroll-mt-20 border-b py-16 lg:py-20">
      <div className="mx-auto max-w-6xl px-4 lg:px-8">
        <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">Lo que puede hacer su consultorio</h2>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Un solo lugar para operar el día a día con trazabilidad y reportes listos para decisiones.
        </p>
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {ITEMS.map((item) => (
            <Card key={item.title} className="border-border/80 shadow-sm transition-shadow hover:shadow-md">
              <CardHeader>
                <CardTitle className="text-base">{item.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{item.body}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
