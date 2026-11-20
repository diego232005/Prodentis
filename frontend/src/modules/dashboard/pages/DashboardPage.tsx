import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import {
  Calendar,
  Clock,
  DollarSign,
  Package,
  Stethoscope,
  UserCheck,
  UserX,
  Users,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { PageContainer } from "@/components/shared/PageContainer";
import { PageTitle } from "@/components/shared/PageTitle";
import { StatCard } from "@/components/shared/StatCard";
import { SectionCard } from "@/components/shared/SectionCard";
import { LoadingState } from "@/components/feedback/LoadingState";
import { ErrorState } from "@/components/feedback/ErrorState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ReceptionBoard } from "@/modules/appointments/components/ReceptionBoard";
import { getDashboardSummary } from "@/modules/dashboard/services/dashboardService";
import { closeCash, getCashSummary } from "@/modules/billing/services/billingService";
import { useAppDataStore } from "@/app/store/useAppDataStore";
import { useSessionStore } from "@/app/store/useSessionStore";
import { formatDateTime } from "@/lib/formatters/date";
import { formatCurrency } from "@/lib/formatters/currency";
import { ROUTES } from "@/lib/constants/routes";

function CashClosePanel() {
  const qc = useQueryClient();
  const date = format(new Date(), "yyyy-MM-dd");
  const [notes, setNotes] = React.useState("");
  const q = useQuery({ queryKey: ["cash-summary", date], queryFn: () => getCashSummary(date) });
  const mut = useMutation({
    mutationFn: closeCash,
    onSuccess: () => {
      toast.success("Caja cerrada");
      setNotes("");
      qc.invalidateQueries({ queryKey: ["cash-summary"] });
    },
  });

  return (
    <SectionCard title="Cierre de caja" description={`Cobros del día ${date}`}>
      {q.isLoading ? (
        <p className="text-sm text-muted-foreground">Calculando…</p>
      ) : q.isError || !q.data ? (
        <p className="text-sm text-muted-foreground">Resumen de caja no disponible.</p>
      ) : (
        <div className="space-y-3 text-sm">
          <dl className="grid grid-cols-2 gap-2">
            <dt className="text-muted-foreground">Efectivo</dt>
            <dd className="text-right font-medium">{formatCurrency(q.data.totalCash ?? q.data.cash ?? 0)}</dd>
            <dt className="text-muted-foreground">Tarjeta</dt>
            <dd className="text-right font-medium">{formatCurrency(q.data.totalCard ?? q.data.card ?? 0)}</dd>
            <dt className="text-muted-foreground">Transferencia</dt>
            <dd className="text-right font-medium">{formatCurrency(q.data.totalTransfer ?? q.data.transfer ?? 0)}</dd>
            <dt className="border-t pt-2 font-semibold">Total ({q.data.paymentsCount} cobros)</dt>
            <dd className="border-t pt-2 text-right font-semibold text-primary">
              {formatCurrency(q.data.total)}
            </dd>
          </dl>
          {q.data.closure ? (
            <p className="rounded-md bg-teal-50 px-3 py-2 text-teal-800">
              Caja cerrada por {q.data.closure.closedBy} · {formatDateTime(q.data.closure.createdAt)}
            </p>
          ) : (
            <div className="space-y-2">
              <Input placeholder="Observaciones (opcional)" value={notes} onChange={(e) => setNotes(e.target.value)} />
              <Button className="w-full" disabled={mut.isPending} onClick={() => mut.mutate({ date, notes })}>
                {mut.isPending ? "Cerrando…" : "Cerrar caja del día"}
              </Button>
            </div>
          )}
        </div>
      )}
    </SectionCard>
  );
}

export function DashboardPage() {
  const navigate = useNavigate();
  const user = useSessionStore((s) => s.user);
  const role = user?.role;
  const dentists = useAppDataStore((s) => s.dentists);
  const patients = useAppDataStore((s) => s.patients);
  const chairs = useAppDataStore((s) => s.chairs);
  const appointments = useAppDataStore((s) => s.appointments);

  const myDentistId = role === "dentist" ? dentists.find((d) => d.userId === user?.id)?.id : undefined;

  const q = useQuery({
    queryKey: ["dashboard", myDentistId, appointments.length],
    queryFn: () => getDashboardSummary(myDentistId),
  });

  const boardAppointments = React.useMemo(
    () => (myDentistId ? appointments.filter((a) => a.dentistId === myDentistId) : appointments),
    [appointments, myDentistId],
  );

  if (q.isLoading) return <LoadingState />;
  if (q.isError || !q.data)
    return <ErrorState message="No se pudo cargar el panel." onRetry={() => q.refetch()} />;

  const d = q.data;
  const showCash = role === "admin" || role === "receptionist";
  const patientName = (id: string) => {
    const p = patients.find((x) => x.id === id);
    return p ? `${p.firstName} ${p.lastName}` : id;
  };

  const stats =
    role === "dentist"
      ? [
          <StatCard key="mine" title="Mis citas hoy" value={d.myAppointmentsToday ?? d.appointmentsToday} icon={Calendar} hint="Excluye canceladas" />,
          <StatCard key="wait" title="En sala de espera" value={d.waitingNow ?? d.waitingRoom?.length ?? 0} icon={Clock} />,
          <StatCard key="seen" title="Pacientes atendidos hoy" value={d.patientsSeenToday} icon={UserCheck} />,
          <StatCard key="tr" title="Tratamientos en curso" value={d.treatmentsInProgress} icon={Stethoscope} />,
        ]
      : role === "assistant"
        ? [
            <StatCard key="apt" title="Citas hoy" value={d.appointmentsToday} icon={Calendar} />,
            <StatCard key="wait" title="En sala de espera" value={d.waitingNow ?? 0} icon={Clock} />,
            <StatCard key="tr" title="Tratamientos en curso" value={d.treatmentsInProgress} icon={Stethoscope} />,
            <StatCard key="stock" title="Insumos bajo stock" value={d.lowStockItems} icon={Package} hint="Stock ≤ mínimo" />,
          ]
        : role === "receptionist"
          ? [
              <StatCard key="apt" title="Citas hoy" value={d.appointmentsToday} icon={Calendar} />,
              <StatCard key="wait" title="En sala de espera" value={d.waitingNow ?? 0} icon={Clock} />,
              <StatCard key="ns" title="No asistieron" value={d.noShowToday ?? 0} icon={UserX} />,
              <StatCard key="inv" title="Facturas pendientes / parciales" value={d.pendingInvoices} icon={DollarSign} />,
            ]
          : [
              <StatCard key="apt" title="Citas hoy" value={d.appointmentsToday} icon={Calendar} hint="Excluye canceladas" />,
              <StatCard key="seen" title="Pacientes atendidos hoy" value={d.patientsSeenToday} icon={UserCheck} />,
              <StatCard key="wait" title="En sala de espera" value={d.waitingNow ?? d.waitingRoom?.length ?? 0} icon={Clock} />,
              <StatCard key="ns" title="No asistieron" value={d.noShowToday ?? 0} icon={UserX} />,
              <StatCard key="inv" title="Facturas pendientes / parciales" value={d.pendingInvoices} icon={DollarSign} />,
              <StatCard key="tr" title="Tratamientos en curso" value={d.treatmentsInProgress} icon={Stethoscope} />,
              <StatCard key="stock" title="Insumos bajo stock" value={d.lowStockItems} icon={Package} hint="Stock ≤ mínimo" />,
              <StatCard key="up" title="Próximos turnos" value={d.upcomingAppointments.length} icon={Users} />,
            ];

  return (
    <PageContainer>
      <PageTitle
        title="Panel principal"
        description={`Resumen operativo del consultorio${user ? ` — ${user.name}` : ""}.`}
        actions={
          role === "admin" || role === "receptionist" ? (
            <Button asChild>
              <Link to={ROUTES.appointmentNew}>Nueva cita</Link>
            </Button>
          ) : undefined
        }
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{stats}</div>

      <SectionCard title="Sala de recepción" description="Flujo de pacientes de hoy">
        <ReceptionBoard
          appointments={boardAppointments}
          getPatientName={patientName}
          getDentistName={(id) => dentists.find((x) => x.id === id)?.name ?? id}
          getChairName={(id) => chairs.find((c) => c.id === id)?.name ?? ""}
          onSelectAppointment={(id) => navigate(ROUTES.appointment(id))}
        />
      </SectionCard>

      <div className="grid gap-6 lg:grid-cols-2">
        <SectionCard title="Próximos turnos" description="Ordenados por fecha y hora">
          <ul className="space-y-3">
            {d.upcomingAppointments.map((a) => (
              <li
                key={a.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-md border bg-background/50 px-3 py-2 text-sm"
              >
                <div>
                  <p className="font-medium">{a.patientName}</p>
                  <p className="text-xs text-muted-foreground">{a.dentistName}</p>
                </div>
                <time className="text-xs text-muted-foreground">{formatDateTime(a.startAt)}</time>
              </li>
            ))}
            {d.upcomingAppointments.length === 0 ? (
              <li className="text-sm text-muted-foreground">Sin turnos próximos.</li>
            ) : null}
          </ul>
          <Button variant="outline" className="mt-4 w-full sm:w-auto" asChild>
            <Link to={ROUTES.appointmentsCalendar}>Ver agenda</Link>
          </Button>
        </SectionCard>

        {showCash ? (
          <CashClosePanel />
        ) : (
          <SectionCard title="Accesos rápidos" description="Flujos frecuentes">
            <div className="flex flex-col gap-2">
              {role === "dentist" ? (
                <Button variant="secondary" asChild>
                  <Link to={ROUTES.clinicalRecords}>Historias clínicas</Link>
                </Button>
              ) : null}
              <Button variant="secondary" asChild>
                <Link to={ROUTES.patients}>Pacientes</Link>
              </Button>
              <Button variant="secondary" asChild>
                <Link to={ROUTES.treatments}>Tratamientos</Link>
              </Button>
              {role === "assistant" ? (
                <Button variant="secondary" asChild>
                  <Link to={ROUTES.inventory}>Revisar inventario</Link>
                </Button>
              ) : null}
            </div>
          </SectionCard>
        )}
      </div>

      {showCash ? (
        <SectionCard title="Accesos rápidos" description="Flujos frecuentes">
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" asChild>
              <Link to={ROUTES.patientNew}>Registrar paciente</Link>
            </Button>
            <Button variant="secondary" asChild>
              <Link to={ROUTES.billingNew}>Nueva factura</Link>
            </Button>
            <Button variant="secondary" asChild>
              <Link to={ROUTES.reports}>Ver reportes</Link>
            </Button>
            {role === "admin" ? (
              <Button variant="secondary" asChild>
                <Link to={ROUTES.inventory}>Revisar inventario</Link>
              </Button>
            ) : null}
          </div>
        </SectionCard>
      ) : null}
    </PageContainer>
  );
}
