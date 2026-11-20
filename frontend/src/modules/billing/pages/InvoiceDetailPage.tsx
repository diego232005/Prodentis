import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";
import { FileDown } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { PageContainer } from "@/components/shared/PageContainer";
import { PageTitle } from "@/components/shared/PageTitle";
import { InfoGrid } from "@/components/shared/InfoGrid";
import { InvoiceStatusBadge } from "@/components/shared/StatusBadge";
import { ConfirmDialog } from "@/components/feedback/ConfirmDialog";
import { LoadingState } from "@/components/feedback/LoadingState";
import { ErrorState } from "@/components/feedback/ErrorState";
import { FormField } from "@/components/forms/FormField";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  paymentSchema,
  type PaymentFormValues,
} from "@/modules/billing/schemas/invoiceSchema";
import {
  getInvoice,
  listPayments,
  registerPayment,
  setInvoiceStatus,
} from "@/modules/billing/services/billingService";
import { downloadCashReceiptPdf } from "@/lib/pdf/clinicalPdf";
import { useAppDataStore } from "@/app/store/useAppDataStore";
import { ROUTES } from "@/lib/constants/routes";
import { formatCurrency } from "@/lib/formatters/currency";
import { formatDate } from "@/lib/formatters/date";

export function InvoiceDetailPage() {
  const { id } = useParams();
  const qc = useQueryClient();
  const patients = useAppDataStore((s) => s.patients);
  const clinic = useAppDataStore((s) => s.clinic);
  const paymentsQ = useQuery({
    queryKey: ["payments", id],
    queryFn: () => listPayments(id!),
    enabled: Boolean(id),
  });
  const payments = paymentsQ.data ?? [];

  const q = useQuery({
    queryKey: ["invoice", id],
    queryFn: () => getInvoice(id!),
    enabled: Boolean(id),
  });

  const [voidOpen, setVoidOpen] = React.useState(false);

  const payForm = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentSchema),
    defaultValues: { amount: 0, method: "transfer", reference: "" },
  });

  const payMut = useMutation({
    mutationFn: registerPayment,
    onSuccess: ({ payment, invoice }) => {
      toast.success("Pago registrado");
      qc.invalidateQueries({ queryKey: ["invoice", id] });
      qc.invalidateQueries({ queryKey: ["payments", id] });
      qc.invalidateQueries({ queryKey: ["invoices"] });
      qc.invalidateQueries({ queryKey: ["cash-summary"] });
      downloadCashReceiptPdf({
        clinic,
        patient: patients.find((x) => x.id === invoice.patientId),
        invoice,
        payment,
      });
    },
  });

  const voidMut = useMutation({
    mutationFn: async () => {
      if (!id) throw new Error("missing invoice");
      return setInvoiceStatus(id, "void");
    },
    onSuccess: () => {
      toast.success("Factura anulada");
      qc.invalidateQueries({ queryKey: ["invoice", id] });
      qc.invalidateQueries({ queryKey: ["invoices"] });
      setVoidOpen(false);
    },
  });

  React.useEffect(() => {
    if (q.data) {
      const remaining = Math.max(0, q.data.total - q.data.amountPaid);
      payForm.setValue("amount", remaining || q.data.total);
    }
  }, [q.data, payForm]);

  if (q.isLoading) return <LoadingState />;
  if (q.isError || !q.data)
    return <ErrorState message="Factura no encontrada." />;

  const inv = q.data;
  const patient = patients.find((p) => p.id === inv.patientId);

  function onPay(values: PaymentFormValues) {
    if (!id) return;
    payMut.mutate({
      invoiceId: id,
      amount: values.amount,
      method: values.method,
      reference: values.reference,
      paidAt: new Date().toISOString(),
    });
  }

  return (
    <PageContainer>
      <PageTitle
        title={`Factura ${inv.id}`}
        description={
          patient ? `${patient.firstName} ${patient.lastName}` : inv.patientId
        }
        actions={
          <Button variant="outline" asChild>
            <Link to={ROUTES.billing}>Volver</Link>
          </Button>
        }
      />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-lg border bg-card p-6 shadow-sm lg:col-span-2">
          <InfoGrid
            items={[
              {
                label: "Estado",
                value: <InvoiceStatusBadge status={inv.status} />,
              },
              { label: "Emisión", value: formatDate(inv.issuedAt) },
              { label: "Vencimiento", value: formatDate(inv.dueAt) },
              { label: "Subtotal", value: formatCurrency(inv.subtotal) },
              { label: "IVA", value: formatCurrency(inv.tax) },
              { label: "Total", value: formatCurrency(inv.total) },
              { label: "Pagado", value: formatCurrency(inv.amountPaid) },
            ]}
          />
          <Table className="mt-6">
            <TableHeader>
              <TableRow>
                <TableHead>Descripción</TableHead>
                <TableHead className="text-right">Cant.</TableHead>
                <TableHead className="text-right">P. unit.</TableHead>
                <TableHead className="text-right">Subtotal</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {inv.lines.map((l) => (
                <TableRow key={l.id}>
                  <TableCell>{l.description}</TableCell>
                  <TableCell className="text-right">{l.quantity}</TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(l.unitPrice)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(l.quantity * l.unitPrice)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button
              variant="destructive"
              onClick={() => setVoidOpen(true)}
              disabled={inv.status === "void"}
            >
              Anular factura
            </Button>
          </div>
        </div>
        <div className="space-y-6">
          <div className="rounded-lg border bg-card p-6 shadow-sm">
            <h3 className="mb-4 text-sm font-semibold">
              Registrar pago
            </h3>
            <form
              className="space-y-3"
              onSubmit={payForm.handleSubmit(onPay)}
              noValidate
            >
              <FormField
                label="Monto"
                required
                error={payForm.formState.errors.amount?.message}
              >
                <Input
                  type="number"
                  min={1}
                  step="1"
                  {...payForm.register("amount", { valueAsNumber: true })}
                />
              </FormField>
              <FormField
                label="Medio"
                required
                error={payForm.formState.errors.method?.message}
              >
                <Select
                  value={payForm.watch("method")}
                  onValueChange={(v) =>
                    payForm.setValue("method", v as PaymentFormValues["method"])
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Efectivo</SelectItem>
                    <SelectItem value="card">Tarjeta</SelectItem>
                    <SelectItem value="transfer">Transferencia</SelectItem>
                  </SelectContent>
                </Select>
              </FormField>
              <FormField
                label="Referencia"
                error={payForm.formState.errors.reference?.message}
              >
                <Input {...payForm.register("reference")} />
              </FormField>
              <Button
                type="submit"
                className="w-full"
                disabled={payMut.isPending || inv.status === "void"}
              >
                {payMut.isPending ? "Registrando…" : "Registrar pago"}
              </Button>
            </form>
          </div>
          <div className="rounded-lg border bg-card p-6 shadow-sm">
            <h3 className="mb-2 text-sm font-semibold">Pagos registrados</h3>
            <ul className="space-y-2 text-sm">
              {payments.map((p) => (
                <li
                  key={p.id}
                  className="flex justify-between rounded-md border px-2 py-1"
                >
                  <span>{p.method}</span>
                  <span className="flex items-center gap-2">
                    {formatCurrency(p.amount)}
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      className="h-6 px-1"
                      title="Descargar recibo"
                      onClick={() =>
                        downloadCashReceiptPdf({ clinic, patient, invoice: inv, payment: p })
                      }
                    >
                      <FileDown className="h-4 w-4" />
                    </Button>
                  </span>
                </li>
              ))}
              {payments.length === 0 ? (
                <li className="text-muted-foreground">Sin pagos</li>
              ) : null}
            </ul>
          </div>
        </div>
      </div>
      <ConfirmDialog
        open={voidOpen}
        onOpenChange={setVoidOpen}
        title="¿Anular factura?"
        description="El estado pasará a anulada. Esta acción queda registrada en el servidor."
        confirmLabel="Anular"
        variant="destructive"
        onConfirm={() => voidMut.mutate()}
      />
    </PageContainer>
  );
}
