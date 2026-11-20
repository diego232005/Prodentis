# PRODENTIS — Sistema de gestión odontológica (HIS)

Proyecto full stack para consultorio odontológico:

- **Frontend:** React + Vite + TypeScript (`/frontend`)
- **Backend:** Node.js + Express + PostgreSQL (`/backend`)
- **HTTP:** Axios / API REST

## Qué incluye

- Pacientes con anamnesis y alerta de alergias críticas  
- Agenda inteligente (día/semana/mes/doctor, sillones, drag & drop)  
- Historia clínica, odontograma FDI, periodontograma  
- Consentimientos con firma digital + PDF  
- Recetas médicas + PDF  
- Radiografías con visor (zoom, brillo, negativo)  
- Facturación, abonos, recibos PDF y cierre de caja  
- Inventario con stock mínimo / vencimiento  
- Dashboards según rol (Admin, Recepción, Odontólogo)

## Requisitos

- Node.js 20+
- PostgreSQL 14+ (o Docker)

## Base de datos

**Opción A — Docker (recomendado):**

```bash
docker compose up -d
```

**Opción B — PostgreSQL local:**

```sql
CREATE DATABASE prodentis;
```

```bash
cp backend/.env.example backend/.env
```

Editá `DATABASE_URL` si tu usuario/clave es distinto.  
Opcional: `APP_TIMEZONE=America/Bogota` para que “hoy” del panel use zona local.

## Instalación

```bash
npm run install:all
```

O por carpeta:

```bash
cd backend && npm install
cd ../frontend && npm install
```

## Ejecutar

Terminal 1 — API (puerto 3001; crea tablas, migra y carga demo):

```bash
cd backend
npm run dev
```

Terminal 2 — UI (puerto 5173):

```bash
cd frontend
npm run dev
```

Desde la raíz (si tenés `concurrently`):

```bash
npm install
npm run dev
```

### Recargar datos de demo

```bash
cd backend
npm run db:reset
```

## Credenciales de prueba

| Rol        | Email                    | Contraseña |
|-----------|--------------------------|------------|
| Admin     | admin@prodentis.com      | admin123   |
| Recepción | recepcion@prodentis.com  | recep123   |
| Odontólogo| odontologo@prodentis.com | dent123    |

## API REST (resumen)

| Ruta | Descripción |
|------|-------------|
| `GET /api/health` | Estado del servidor |
| `GET /api/bootstrap` | Datos iniciales |
| `POST /api/auth/login` | Login |
| `GET /api/dashboard` | KPIs por rol |
| `/api/patients` | CRUD pacientes |
| `/api/appointments` | Citas + reception-board |
| `/api/clinical/*` | HC, odontograma, perio, recetas, diagnósticos |
| `/api/consents/*` | Plantillas y consentimientos |
| `/api/billing/*` | Facturas, pagos, caja |
| `/api/schedule/*` | Sillones, disponibilidad, bloqueos |
| `/api/treatments/*` | Tratamientos y planes |
| `/api/inventory` | Inventario y movimientos |

Headers RBAC (sesión): `X-User-Id`, `X-User-Role`, `X-User-Name`.

Validaciones con `express-validator`. Migraciones idempotentes en `backend/src/db/migrate.sql`.

Colección Postman: [postman/PRODENTIS-API.postman_collection.json](./postman/PRODENTIS-API.postman_collection.json)

## Estructura

```
Prodentis/
├── frontend/   → React + Vite (UI)
├── backend/    → Express + PostgreSQL (API)
├── postman/
├── docker-compose.yml
└── README.md
```

```
backend/src/
  controllers/
  middleware/   # validate + RBAC
  validators/
  routes/
  db/           # schema + migrate + seed + refreshToday
```
