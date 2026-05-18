import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import {
  Calendar,
  DollarSign,
  Package,
  Stethoscope,
  UserCheck,
  Users,
} from "lucide-react";
import { PageContainer } from "@/components/shared/PageContainer";
import { PageTitle } from "@/components/shared/PageTitle";
import { StatCard } from "@/components/shared/StatCard";
import { SectionCard } from "@/components/shared/SectionCard";
import { LoadingState } from "@/components/feedback/LoadingState";
import { ErrorState } from "@/components/feedback/ErrorState";
import { Button } from "@/components/ui/button";
import { getDashboardSummary } from "@/modules/dashboard/services/dashboardService";
import { formatDateTime } from "@/lib/formatters/date";
import { ROUTES } from "@/lib/constants/routes";

export function DashboardPage() {
  const q = useQuery({ queryKey: ["dashboard"], queryFn: getDashboardSummary });

  if (q.isLoading) return <LoadingState />;
  if (q.isError || !q.data)
    return (
      <ErrorState
        message="No se pudo cargar el panel."
        onRetry={() => q.refetch()}
      />
    );

  const d = q.data;

  return (
    <PageContainer>
      <PageTitle
        title="Panel principal"
        description="Resumen operativo del consultorio — datos simulados en tiempo real."
        actions={
          <Button asChild>
            <Link to={ROUTES.appointmentNew}>Nueva cita</Link>
          </Button>
        }
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard
          title="Citas hoy"
          value={d.appointmentsToday}
          icon={Calendar}
          hint="Excluye canceladas"
        />
        <StatCard
          title="Pacientes atendidos hoy"
          value={d.patientsSeenToday}
          icon={UserCheck}
          hint="Completadas o en atención"
        />
        <StatCard
          title="Facturas pendientes / parciales"
          value={d.pendingInvoices}
          icon={DollarSign}
        />
        <StatCard
          title="Tratamientos en curso"
          value={d.treatmentsInProgress}
          icon={Stethoscope}
        />
        <StatCard
          title="Insumos bajo stock"
          value={d.lowStockItems}
          icon={Package}
          hint="Stock ≤ mínimo"
        />
        <StatCard
          title="Próximos turnos (lista)"
          value={d.upcomingAppointments.length}
          icon={Users}
          hint="Siguientes en agenda"
        />
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <SectionCard
          title="Próximos turnos"
          description="Ordenados por fecha y hora"
        >
          <ul className="space-y-3">
            {d.upcomingAppointments.map((a) => (
              <li
                key={a.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-md border bg-background/50 px-3 py-2 text-sm"
              >
                <div>
                  <p className="font-medium">{a.patientName}</p>
                  <p className="text-xs text-muted-foreground">
                    {a.dentistName}
                  </p>
                </div>
                <time className="text-xs text-muted-foreground">
                  {formatDateTime(a.startAt)}
                </time>
              </li>
            ))}
          </ul>
          <Button variant="outline" className="mt-4 w-full sm:w-auto" asChild>
            <Link to={ROUTES.appointments}>Ver agenda</Link>
          </Button>
        </SectionCard>
        <SectionCard title="Accesos rápidos" description="Flujos frecuentes">
          <div className="flex flex-col gap-2">
            <Button variant="secondary" asChild>
              <Link to={ROUTES.patientNew}>Registrar paciente</Link>
            </Button>
            <Button variant="secondary" asChild>
              <Link to={ROUTES.billingNew}>Nueva factura</Link>
            </Button>
            <Button variant="secondary" asChild>
              <Link to={ROUTES.reports}>Ver reportes</Link>
            </Button>
            <Button variant="secondary" asChild>
              <Link to={ROUTES.inventory}>Revisar inventario</Link>
            </Button>
          </div>
        </SectionCard>
      </div>
    </PageContainer>
  );
}
