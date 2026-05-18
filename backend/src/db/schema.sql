CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(32) PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(32) NOT NULL CHECK (role IN ('admin', 'receptionist', 'dentist', 'assistant')),
  avatar_url TEXT
);

CREATE TABLE IF NOT EXISTS dentists (
  id VARCHAR(32) PRIMARY KEY,
  user_id VARCHAR(32) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  specialty VARCHAR(255) NOT NULL,
  license_number VARCHAR(64) NOT NULL
);

CREATE TABLE IF NOT EXISTS patients (
  id VARCHAR(32) PRIMARY KEY,
  first_name VARCHAR(120) NOT NULL,
  last_name VARCHAR(120) NOT NULL,
  document_id VARCHAR(32) NOT NULL UNIQUE,
  birth_date DATE NOT NULL,
  phone VARCHAR(64) NOT NULL,
  email VARCHAR(255) NOT NULL,
  address TEXT NOT NULL DEFAULT '',
  status VARCHAR(16) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'archived')),
  allergies TEXT NOT NULL DEFAULT '',
  medical_notes TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS procedures (
  id VARCHAR(32) PRIMARY KEY,
  code VARCHAR(16) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  base_price NUMERIC(12, 2) NOT NULL CHECK (base_price >= 0),
  duration_minutes INTEGER NOT NULL CHECK (duration_minutes > 0)
);

CREATE TABLE IF NOT EXISTS appointments (
  id VARCHAR(32) PRIMARY KEY,
  patient_id VARCHAR(32) NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  dentist_id VARCHAR(32) NOT NULL REFERENCES dentists(id),
  start_at TIMESTAMPTZ NOT NULL,
  end_at TIMESTAMPTZ NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'in_progress', 'completed', 'cancelled')),
  reason TEXT NOT NULL DEFAULT '',
  notes TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (end_at > start_at)
);

CREATE TABLE IF NOT EXISTS treatments (
  id VARCHAR(32) PRIMARY KEY,
  patient_id VARCHAR(32) NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  dentist_id VARCHAR(32) NOT NULL REFERENCES dentists(id),
  procedure_id VARCHAR(32) NOT NULL REFERENCES procedures(id),
  status VARCHAR(20) NOT NULL DEFAULT 'planned' CHECK (status IN ('planned', 'in_progress', 'completed', 'cancelled')),
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ,
  sessions_planned INTEGER NOT NULL CHECK (sessions_planned >= 1),
  sessions_done INTEGER NOT NULL DEFAULT 0 CHECK (sessions_done >= 0),
  cost NUMERIC(12, 2) NOT NULL CHECK (cost >= 0),
  notes TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS clinical_entries (
  id VARCHAR(32) PRIMARY KEY,
  patient_id VARCHAR(32) NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  dentist_id VARCHAR(32) NOT NULL REFERENCES dentists(id),
  type VARCHAR(20) NOT NULL CHECK (type IN ('evolution', 'diagnosis', 'procedure', 'note', 'attachment')),
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  diagnosis_code VARCHAR(32),
  procedure_id VARCHAR(32) REFERENCES procedures(id),
  attachment_name VARCHAR(255),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS odontograms (
  patient_id VARCHAR(32) PRIMARY KEY REFERENCES patients(id) ON DELETE CASCADE,
  teeth JSONB NOT NULL DEFAULT '[]',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS invoices (
  id VARCHAR(32) PRIMARY KEY,
  patient_id VARCHAR(32) NOT NULL REFERENCES patients(id),
  status VARCHAR(16) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'void', 'partial')),
  issued_at TIMESTAMPTZ NOT NULL,
  due_at TIMESTAMPTZ NOT NULL,
  subtotal NUMERIC(12, 2) NOT NULL CHECK (subtotal >= 0),
  tax NUMERIC(12, 2) NOT NULL CHECK (tax >= 0),
  total NUMERIC(12, 2) NOT NULL CHECK (total >= 0),
  amount_paid NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (amount_paid >= 0),
  notes TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS invoice_lines (
  id VARCHAR(32) PRIMARY KEY,
  invoice_id VARCHAR(32) NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  quantity NUMERIC(10, 2) NOT NULL CHECK (quantity > 0),
  unit_price NUMERIC(12, 2) NOT NULL CHECK (unit_price >= 0),
  treatment_id VARCHAR(32) REFERENCES treatments(id)
);

CREATE TABLE IF NOT EXISTS payments (
  id VARCHAR(32) PRIMARY KEY,
  invoice_id VARCHAR(32) NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
  method VARCHAR(16) NOT NULL CHECK (method IN ('cash', 'card', 'transfer')),
  paid_at TIMESTAMPTZ NOT NULL,
  reference VARCHAR(255) NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS inventory_items (
  id VARCHAR(32) PRIMARY KEY,
  sku VARCHAR(64) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(120) NOT NULL,
  unit VARCHAR(32) NOT NULL,
  stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
  min_stock INTEGER NOT NULL DEFAULT 0 CHECK (min_stock >= 0),
  unit_cost NUMERIC(12, 2) NOT NULL CHECK (unit_cost >= 0),
  supplier VARCHAR(255) NOT NULL DEFAULT '',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS stock_movements (
  id VARCHAR(32) PRIMARY KEY,
  item_id VARCHAR(32) NOT NULL REFERENCES inventory_items(id) ON DELETE CASCADE,
  type VARCHAR(8) NOT NULL CHECK (type IN ('in', 'out')),
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  reason TEXT NOT NULL,
  related_treatment_id VARCHAR(32) REFERENCES treatments(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS clinic_settings (
  id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  name VARCHAR(255) NOT NULL,
  tax_id VARCHAR(64) NOT NULL,
  phone VARCHAR(64) NOT NULL,
  email VARCHAR(255) NOT NULL,
  address TEXT NOT NULL,
  opening_hours TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_appointments_patient ON appointments(patient_id);
CREATE INDEX IF NOT EXISTS idx_appointments_start ON appointments(start_at);
CREATE INDEX IF NOT EXISTS idx_treatments_patient ON treatments(patient_id);
CREATE INDEX IF NOT EXISTS idx_clinical_patient ON clinical_entries(patient_id);
CREATE INDEX IF NOT EXISTS idx_invoices_patient ON invoices(patient_id);
