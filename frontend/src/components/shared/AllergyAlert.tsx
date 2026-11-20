import { AlertTriangle } from 'lucide-react'

export function AllergyAlert({ allergies }: { allergies?: string }) {
  if (!allergies?.trim()) return null
  return (
    <div role="alert" className="flex items-start gap-3 rounded-lg border-2 border-red-500 bg-red-50 px-4 py-3 text-red-800">
      <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
      <div>
        <p className="text-sm font-bold uppercase tracking-wide">Alergias del paciente</p>
        <p className="text-sm">{allergies}</p>
      </div>
    </div>
  )
}
