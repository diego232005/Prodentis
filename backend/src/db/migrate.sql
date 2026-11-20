-- Migración idempotente: expansión HIS dental (se ejecuta después de schema.sql en cada arranque)

-- ── Tablas de versiones anteriores con otra forma: se conservan como legacy_* ──
DO $$
DECLARE
  r RECORD;
  i RECORD;
BEGIN
  FOR r IN SELECT * FROM (VALUES
    ('dental_chairs', 'sort_order'), ('dentist_availability', 'active'), ('dentist_blocks', 'created_at'),
    ('consent_templates', 'code'), ('consents', 'title'), ('odontogram_snapshots', 'created_by'),
    ('periodontograms', 'data'), ('medications', 'presentation'), ('prescriptions', 'diagnosis'),
    ('diagnostic_files', 'kind'), ('treatment_plans', 'total'), ('treatment_plan_items', 'status'),
    ('cash_closures', 'closure_date')
  ) AS t(tbl, marker) LOOP
    IF to_regclass('public.' || r.tbl) IS NOT NULL AND NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = r.tbl AND column_name = r.marker
    ) THEN
      FOR i IN SELECT indexname FROM pg_indexes WHERE schemaname = 'public' AND tablename = r.tbl LOOP
        EXECUTE format('ALTER INDEX %I RENAME TO %I', i.indexname, left('legacy_' || i.indexname, 63));
      END LOOP;
      EXECUTE format('ALTER TABLE %I RENAME TO %I', r.tbl, 'legacy_' || r.tbl);
    END IF;
  END LOOP;
END $$;

-- ── Sillones ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS dental_chairs (
  id VARCHAR(32) PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  room VARCHAR(120) NOT NULL DEFAULT '',
  active BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order INTEGER NOT NULL DEFAULT 0
);

-- ── Pacientes: anamnesis ──────────────────────────────────
ALTER TABLE patients
  ADD COLUMN IF NOT EXISTS blood_type VARCHAR(8) NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS systemic_conditions TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS current_medications TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS emergency_contact_name VARCHAR(255) NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS emergency_contact_phone VARCHAR(64) NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS is_smoker BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS is_pregnant BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS takes_anticoagulants BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS anamnesis_notes TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS anamnesis_updated_at TIMESTAMPTZ;

-- ── Citas: sillón, cancelación, sala de espera, procedimiento ──
ALTER TABLE appointments
  ADD COLUMN IF NOT EXISTS chair_id VARCHAR(32) REFERENCES dental_chairs(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS procedure_id VARCHAR(32) REFERENCES procedures(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS cancel_reason TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS waiting_since TIMESTAMPTZ;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_appointments_chair') THEN
    UPDATE appointments SET chair_id = NULL WHERE chair_id IS NOT NULL AND chair_id NOT IN (SELECT id FROM dental_chairs);
    ALTER TABLE appointments ADD CONSTRAINT fk_appointments_chair FOREIGN KEY (chair_id) REFERENCES dental_chairs(id) ON DELETE SET NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_appointments_procedure') THEN
    UPDATE appointments SET procedure_id = NULL WHERE procedure_id IS NOT NULL AND procedure_id NOT IN (SELECT id FROM procedures);
    ALTER TABLE appointments ADD CONSTRAINT fk_appointments_procedure FOREIGN KEY (procedure_id) REFERENCES procedures(id) ON DELETE SET NULL;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'appointments_status_check' AND conrelid = 'appointments'::regclass) THEN
    ALTER TABLE appointments DROP CONSTRAINT appointments_status_check;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'appointments_status_chk' AND conrelid = 'appointments'::regclass) THEN
    ALTER TABLE appointments ADD CONSTRAINT appointments_status_chk
      CHECK (status IN ('pending', 'confirmed', 'waiting', 'in_progress', 'completed', 'cancelled', 'no_show'));
  END IF;
END $$;

-- ── Inventario: vencimiento y lote ────────────────────────
ALTER TABLE inventory_items
  ADD COLUMN IF NOT EXISTS expires_at DATE,
  ADD COLUMN IF NOT EXISTS lot_number VARCHAR(64) NOT NULL DEFAULT '';

-- ── Historia clínica: auditoría y tipo consultation ───────
ALTER TABLE clinical_entries
  ADD COLUMN IF NOT EXISTS appointment_id VARCHAR(32) REFERENCES appointments(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS tooth_id VARCHAR(8),
  ADD COLUMN IF NOT EXISTS created_by VARCHAR(32) REFERENCES users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS updated_by VARCHAR(32) REFERENCES users(id) ON DELETE SET NULL;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_clinical_appointment') THEN
    UPDATE clinical_entries SET appointment_id = NULL WHERE appointment_id IS NOT NULL AND appointment_id NOT IN (SELECT id FROM appointments);
    ALTER TABLE clinical_entries ADD CONSTRAINT fk_clinical_appointment FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE SET NULL;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'clinical_entries_type_check' AND conrelid = 'clinical_entries'::regclass) THEN
    ALTER TABLE clinical_entries DROP CONSTRAINT clinical_entries_type_check;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'clinical_entries_type_chk' AND conrelid = 'clinical_entries'::regclass) THEN
    ALTER TABLE clinical_entries ADD CONSTRAINT clinical_entries_type_chk
      CHECK (type IN ('evolution', 'diagnosis', 'procedure', 'note', 'attachment', 'consultation'));
  END IF;
END $$;

-- ── Agenda: disponibilidad y bloqueos ─────────────────────
CREATE TABLE IF NOT EXISTS dentist_availability (
  id VARCHAR(32) PRIMARY KEY,
  dentist_id VARCHAR(32) NOT NULL REFERENCES dentists(id) ON DELETE CASCADE,
  weekday SMALLINT NOT NULL CHECK (weekday BETWEEN 0 AND 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  CHECK (end_time > start_time),
  UNIQUE (dentist_id, weekday, start_time)
);

CREATE TABLE IF NOT EXISTS dentist_blocks (
  id VARCHAR(32) PRIMARY KEY,
  dentist_id VARCHAR(32) NOT NULL REFERENCES dentists(id) ON DELETE CASCADE,
  start_at TIMESTAMPTZ NOT NULL,
  end_at TIMESTAMPTZ NOT NULL,
  reason TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (end_at > start_at)
);

-- ── Consentimientos ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS consent_templates (
  id VARCHAR(32) PRIMARY KEY,
  code VARCHAR(32) NOT NULL UNIQUE,
  title VARCHAR(255) NOT NULL,
  category VARCHAR(64) NOT NULL DEFAULT '',
  body TEXT NOT NULL,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS consents (
  id VARCHAR(32) PRIMARY KEY,
  patient_id VARCHAR(32) NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  dentist_id VARCHAR(32) REFERENCES dentists(id) ON DELETE SET NULL,
  template_id VARCHAR(32) REFERENCES consent_templates(id) ON DELETE SET NULL,
  appointment_id VARCHAR(32) REFERENCES appointments(id) ON DELETE SET NULL,
  title VARCHAR(255) NOT NULL,
  body TEXT NOT NULL,
  status VARCHAR(16) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'signed', 'revoked')),
  signed_by_name VARCHAR(255),
  signature_data TEXT,
  signed_at TIMESTAMPTZ,
  created_by VARCHAR(32) REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Odontograma / periodontograma ─────────────────────────
CREATE TABLE IF NOT EXISTS odontogram_snapshots (
  id VARCHAR(32) PRIMARY KEY,
  patient_id VARCHAR(32) NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  teeth JSONB NOT NULL DEFAULT '[]',
  note TEXT NOT NULL DEFAULT '',
  created_by VARCHAR(32) REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS periodontograms (
  id VARCHAR(32) PRIMARY KEY,
  patient_id VARCHAR(32) NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  dentist_id VARCHAR(32) REFERENCES dentists(id) ON DELETE SET NULL,
  data JSONB NOT NULL DEFAULT '{}',
  notes TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Medicamentos y recetas ────────────────────────────────
CREATE TABLE IF NOT EXISTS medications (
  id VARCHAR(32) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  presentation VARCHAR(255) NOT NULL DEFAULT '',
  default_dosage VARCHAR(255) NOT NULL DEFAULT '',
  category VARCHAR(64) NOT NULL DEFAULT '',
  active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS prescriptions (
  id VARCHAR(32) PRIMARY KEY,
  patient_id VARCHAR(32) NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  dentist_id VARCHAR(32) NOT NULL REFERENCES dentists(id),
  appointment_id VARCHAR(32) REFERENCES appointments(id) ON DELETE SET NULL,
  diagnosis TEXT NOT NULL DEFAULT '',
  items JSONB NOT NULL DEFAULT '[]',
  notes TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Archivos diagnósticos ─────────────────────────────────
CREATE TABLE IF NOT EXISTS diagnostic_files (
  id VARCHAR(32) PRIMARY KEY,
  patient_id VARCHAR(32) NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  dentist_id VARCHAR(32) REFERENCES dentists(id) ON DELETE SET NULL,
  kind VARCHAR(16) NOT NULL DEFAULT 'other' CHECK (kind IN ('xray', 'photo', 'scan', 'lab', 'other')),
  name VARCHAR(255) NOT NULL,
  mime_type VARCHAR(128) NOT NULL DEFAULT 'application/octet-stream',
  size_bytes INTEGER NOT NULL DEFAULT 0,
  tooth_id VARCHAR(8),
  notes TEXT NOT NULL DEFAULT '',
  data_url TEXT NOT NULL,
  created_by VARCHAR(32) REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Planes de tratamiento ─────────────────────────────────
CREATE TABLE IF NOT EXISTS treatment_plans (
  id VARCHAR(32) PRIMARY KEY,
  patient_id VARCHAR(32) NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  dentist_id VARCHAR(32) NOT NULL REFERENCES dentists(id),
  title VARCHAR(255) NOT NULL,
  status VARCHAR(16) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'proposed', 'approved', 'in_progress', 'completed', 'cancelled')),
  discount NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (discount >= 0),
  total NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (total >= 0),
  notes TEXT NOT NULL DEFAULT '',
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS treatment_plan_items (
  id VARCHAR(32) PRIMARY KEY,
  plan_id VARCHAR(32) NOT NULL REFERENCES treatment_plans(id) ON DELETE CASCADE,
  procedure_id VARCHAR(32) REFERENCES procedures(id) ON DELETE SET NULL,
  description TEXT NOT NULL,
  tooth_id VARCHAR(8),
  quantity NUMERIC(10, 2) NOT NULL DEFAULT 1 CHECK (quantity > 0),
  unit_price NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (unit_price >= 0),
  status VARCHAR(16) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'done', 'cancelled')),
  sort_order INTEGER NOT NULL DEFAULT 0
);

-- ── Cierres de caja ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS cash_closures (
  id VARCHAR(32) PRIMARY KEY,
  closure_date DATE NOT NULL UNIQUE,
  expected_cash NUMERIC(12, 2) NOT NULL DEFAULT 0,
  expected_card NUMERIC(12, 2) NOT NULL DEFAULT 0,
  expected_transfer NUMERIC(12, 2) NOT NULL DEFAULT 0,
  counted_cash NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (counted_cash >= 0),
  difference NUMERIC(12, 2) NOT NULL DEFAULT 0,
  payments_count INTEGER NOT NULL DEFAULT 0,
  notes TEXT NOT NULL DEFAULT '',
  closed_by VARCHAR(32) REFERENCES users(id) ON DELETE SET NULL,
  closed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Índices ───────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_appointments_dentist_start ON appointments(dentist_id, start_at);
CREATE INDEX IF NOT EXISTS idx_appointments_chair_start ON appointments(chair_id, start_at);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);
CREATE INDEX IF NOT EXISTS idx_payments_paid_at ON payments(paid_at);
CREATE INDEX IF NOT EXISTS idx_inventory_expires ON inventory_items(expires_at);
CREATE INDEX IF NOT EXISTS idx_blocks_dentist ON dentist_blocks(dentist_id, start_at);
CREATE INDEX IF NOT EXISTS idx_consents_patient ON consents(patient_id);
CREATE INDEX IF NOT EXISTS idx_snapshots_patient ON odontogram_snapshots(patient_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_perio_patient ON periodontograms(patient_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_prescriptions_patient ON prescriptions(patient_id);
CREATE INDEX IF NOT EXISTS idx_diagnostics_patient ON diagnostic_files(patient_id);
CREATE INDEX IF NOT EXISTS idx_plans_patient ON treatment_plans(patient_id);
CREATE INDEX IF NOT EXISTS idx_plan_items_plan ON treatment_plan_items(plan_id);
