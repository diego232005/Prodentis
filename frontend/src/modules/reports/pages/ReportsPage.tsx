import { useQuery } from '@tanstack/react-query'
import { PageContainer } from '@/components/shared/PageContainer'
import { PageTitle } from '@/components/shared/PageTitle'
import { MetricChart } from '@/components/charts/MetricChart'
import { LoadingState } from '@/components/feedback/LoadingState'
import { SectionCard } from '@/components/shared/SectionCard'
import { getReportCharts } from '@/modules/reports/services/reportsService'
import { formatCurrency } from '@/lib/formatters/currency'

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border bg-card p-4 shadow-sm">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-semibold tabular-nums">{value}</p>
    </div>
  )
}

export function ReportsPage() {
  const q = useQuery({ queryKey: ['reports'], queryFn: getReportCharts })

  if (q.isLoading) return <LoadingState />

  const d = q.data
  if (!d) return null

  const apptData = d.appointmentsByMonth.map((x) => ({
    mes: x.label,
    citas: x.appointments,
    ingresos: x.revenue,
    pacientes: x.newPatients,
    historias: x.clinicalEntries,
  }))

  return (
    <PageContainer>
      <PageTitle
        title="Reportes"
        description="Indicadores consolidados del consultorio (últimos 12 meses)"
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Pacientes" value={d.summary.totalPatients} />
        <StatCard label="Citas totales" value={d.summary.totalAppointments} />
        <StatCard label="Tratamientos" value={d.summary.totalTreatments} />
        <StatCard label="Ingresos (pagados)" value={formatCurrency(d.summary.totalRevenue)} />
        <StatCard label="Pacientes activos" value={d.summary.activePatients} />
        <StatCard label="Citas completadas" value={d.summary.completedAppointments} />
        <StatCard label="Facturas" value={d.summary.totalInvoices} />
        <StatCard label="Insumos bajo mínimo" value={d.summary.lowStockItems} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <MetricChart
          title="Citas por mes"
          description="Turnos no cancelados"
          data={apptData}
          xKey="mes"
          type="bar"
          series={[{ key: 'citas', name: 'Citas', color: 'hsl(207 58% 40%)' }]}
        />
        <MetricChart
          title="Ingresos por mes"
          description="Facturas pagadas"
          data={apptData}
          xKey="mes"
          type="line"
          series={[{ key: 'ingresos', name: 'Ingresos', color: 'hsl(186 42% 42%)' }]}
        />
        <MetricChart
          title="Pacientes nuevos por mes"
          data={apptData}
          xKey="mes"
          type="bar"
          series={[{ key: 'pacientes', name: 'Nuevos', color: 'hsl(220 45% 50%)' }]}
        />
        <MetricChart
          title="Registros clínicos por mes"
          data={apptData}
          xKey="mes"
          type="line"
          series={[{ key: 'historias', name: 'Entradas', color: 'hsl(160 35% 42%)' }]}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <SectionCard title="Citas por estado">
          <ul className="space-y-2 text-sm">
            {d.appointmentsByStatus.map((p) => (
              <li key={p.status} className="flex justify-between rounded-md border px-3 py-2">
                <span>{p.status}</span>
                <span className="font-medium tabular-nums">{p.count}</span>
              </li>
            ))}
          </ul>
        </SectionCard>
        <SectionCard title="Facturación por estado">
          <ul className="space-y-2 text-sm">
            {d.invoiceByStatus.map((p) => (
              <li key={p.status} className="flex flex-wrap justify-between gap-2 rounded-md border px-3 py-2">
                <span>{p.status}</span>
                <span className="text-muted-foreground">
                  {p.count} · {formatCurrency(p.total)}
                </span>
              </li>
            ))}
          </ul>
        </SectionCard>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <SectionCard title="Tratamientos más frecuentes">
          <ul className="space-y-2 text-sm">
            {d.topProcedures.map((p) => (
              <li key={p.name} className="flex justify-between rounded-md border px-3 py-2">
                <span className="line-clamp-1">{p.name}</span>
                <span className="font-medium tabular-nums">{p.count}</span>
              </li>
            ))}
          </ul>
        </SectionCard>
        <SectionCard title="Carga por odontólogo">
          <ul className="space-y-2 text-sm">
            {d.dentistWorkload.map((p) => (
              <li key={p.name} className="flex justify-between rounded-md border px-3 py-2">
                <span>{p.name}</span>
                <span className="font-medium tabular-nums">{p.appointments} citas</span>
              </li>
            ))}
          </ul>
        </SectionCard>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <SectionCard title="Inventario por categoría">
          <ul className="space-y-2 text-sm">
            {d.inventoryByCategory.map((c) => (
              <li key={c.category} className="flex justify-between rounded-md border px-3 py-2">
                <span>{c.category}</span>
                <span className="text-muted-foreground">
                  {c.items} ítems · {c.stockUnits} u.
                </span>
              </li>
            ))}
          </ul>
        </SectionCard>
        <SectionCard title="Insumos con menor stock relativo">
          <ul className="space-y-2 text-sm">
            {d.lowestStock.map((i) => (
              <li key={i.name} className="flex flex-wrap justify-between gap-2 rounded-md border px-3 py-2">
                <span className="line-clamp-1">{i.name}</span>
                <span className="text-muted-foreground">
                  {i.stock} / mín. {i.minStock}
                </span>
              </li>
            ))}
          </ul>
        </SectionCard>
      </div>
    </PageContainer>
  )
}
