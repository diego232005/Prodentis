import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";
import { Pencil, Stethoscope } from "lucide-react";
import { PageContainer } from "@/components/shared/PageContainer";
import { PageTitle } from "@/components/shared/PageTitle";
import { InfoGrid } from "@/components/shared/InfoGrid";
import { SectionCard } from "@/components/shared/SectionCard";
import { PatientStatusBadge } from "@/components/shared/StatusBadge";
import { LoadingState } from "@/components/feedback/LoadingState";
import { ErrorState } from "@/components/feedback/ErrorState";
import { Button } from "@/components/ui/button";
import { getPatient } from "@/modules/patients/services/patientsService";
import { listEntriesByPatient } from "@/modules/clinical-records/services/clinicalRecordsService";
import { ROUTES } from "@/lib/constants/routes";
import { formatDate } from "@/lib/formatters/date";
import { useAppDataStore } from "@/app/store/useAppDataStore";

export function PatientDetailPage() {
  const { id } = useParams();
  const patientQ = useQuery({
    queryKey: ["patient", id],
    queryFn: () => getPatient(id!),
    enabled: Boolean(id),
  });
  const clinicalQ = useQuery({
    queryKey: ["clinical", id],
    queryFn: () => listEntriesByPatient(id!),
    enabled: Boolean(id),
  });
  const allTreatments = useAppDataStore((s) => s.treatments);
  const treatments = React.useMemo(
    () => allTreatments.filter((t) => t.patientId === id),
    [allTreatments, id],
  );

  if (patientQ.isLoading) return <LoadingState />;
  if (patientQ.isError || !patientQ.data) {
    return <ErrorState message="No se encontró el paciente." />;
  }

  const p = patientQ.data;
  const recentClinical = clinicalQ.data?.slice(0, 3) ?? [];

  return (
    <PageContainer>
      <PageTitle
        title={`${p.firstName} ${p.lastName}`}
        description={`Documento ${p.documentId}`}
        actions={
          <>
            <Button variant="outline" asChild>
              <Link to={ROUTES.clinicalRecordPatient(p.id)}>
                <Stethoscope className="mr-2 h-4 w-4" />
                Historia clínica
              </Link>
            </Button>
            <Button asChild>
              <Link to={ROUTES.patientEdit(p.id)}>
                <Pencil className="mr-2 h-4 w-4" />
                Editar
              </Link>
            </Button>
          </>
        }
      />
      <div className="grid gap-6 lg:grid-cols-3">
        <SectionCard title="Datos de contacto" className="lg:col-span-2">
          <InfoGrid
            items={[
              { label: "Teléfono", value: p.phone },
              { label: "Correo", value: p.email },
              { label: "Dirección", value: p.address },
              { label: "Fecha de nacimiento", value: formatDate(p.birthDate) },
              {
                label: "Estado",
                value: <PatientStatusBadge status={p.status} />,
              },
            ]}
          />
        </SectionCard>
        <SectionCard title="Antecedentes">
          <InfoGrid
            items={[
              { label: "Alergias", value: p.allergies || "—" },
              { label: "Notas médicas", value: p.medicalNotes || "—" },
            ]}
          />
        </SectionCard>
      </div>
      <SectionCard
        title="Historial clínico reciente"
        description="Vista resumida — acceda al módulo completo desde el botón superior"
      >
        {recentClinical.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Sin registros clínicos todavía.
          </p>
        ) : (
          <ul className="space-y-2 text-sm">
            {recentClinical.map((e) => (
              <li key={e.id} className="rounded-md border px-3 py-2">
                <span className="font-medium">{e.title}</span>
                <p className="text-muted-foreground line-clamp-2">
                  {e.content}
                </p>
              </li>
            ))}
          </ul>
        )}
      </SectionCard>
      <SectionCard title="Tratamientos asociados">
        {treatments.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Sin tratamientos registrados.
          </p>
        ) : (
          <ul className="space-y-2 text-sm">
            {treatments.map((t) => (
              <li
                key={t.id}
                className="flex items-center justify-between rounded-md border px-3 py-2"
              >
                <span>Tratamiento {t.id}</span>
                <Button variant="outline" size="sm" asChild>
                  <Link to={ROUTES.treatment(t.id)}>Ver</Link>
                </Button>
              </li>
            ))}
          </ul>
        )}
      </SectionCard>
    </PageContainer>
  );
}
