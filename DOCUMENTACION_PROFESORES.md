# PRODENTIS — Documentación para exposición académica

**Sistema de gestión para consultorio odontológico**  
Stack: **React + Vite** (frontend) · **Node.js + Express** (backend) · **PostgreSQL** (base de datos) · **Axios** (cliente HTTP)

Este documento resume la arquitectura, la lógica de negocio y los puntos técnicos que suelen preguntar en defensa oral, feria o evaluación del proyecto.

---

## 1. Objetivo del sistema

PRODENTIS centraliza la operación diaria de un consultorio dental:

| Módulo | Función |
|--------|---------|
| **Pacientes** | Alta, edición, ficha y estado (activo/inactivo/archivado) |
| **Citas** | Agenda, calendario, estados del turno |
| **Historia clínica** | Evoluciones, diagnósticos, procedimientos, odontograma |
| **Tratamientos** | Planes vinculados a procedimientos del catálogo |
| **Facturación** | Facturas, líneas, pagos parciales/totales |
| **Inventario** | Insumos, stock mínimo, movimientos entrada/salida |
| **Reportes** | Gráficos e indicadores (últimos 12 meses) |
| **Configuración** | Datos del consultorio y cuentas de personal |

La aplicación está pensada para **demostración en feria**: datos de ejemplo abundantes y flujo visual completo.

---

## 2. Estructura del repositorio

```
Desarrollo Web/
├── frontend/          → React + Vite + TypeScript
├── backend/           → Express + PostgreSQL
├── docker-compose.yml → PostgreSQL en contenedor (opcional)
├── README.md          → Instalación rápida
└── DOCUMENTACION_PROFESORES.md  → Este archivo
```

El proyecto se trabaja **únicamente** en `frontend/` y `backend/`. No usar otras carpetas duplicadas del repositorio.

---

## 3. Cómo ejecutar el proyecto (demo en vivo)

### Requisitos

- Node.js 20+
- PostgreSQL 14+ (o Docker)

### Pasos

1. **Base de datos**

   ```bash
   docker compose up -d
   # o crear manualmente: CREATE DATABASE prodentis;
   ```

2. **Variables de entorno del backend**

   ```bash
   cp backend/.env.example backend/.env
   ```

   Ejemplo de `DATABASE_URL`:

   ```
   postgresql://postgres:postgres@localhost:5432/prodentis
   ```

3. **Instalar dependencias**

   ```bash
   npm run install:all
   ```

4. **Levantar API** (puerto **3001**)

   ```bash
   cd backend
   npm run dev
   ```

   Al iniciar, el servidor:
   - Ejecuta el **schema SQL** (tablas si no existen).
   - Si la BD está vacía, carga el **seed** automáticamente.

5. **Levantar frontend** (puerto **5173**)

   ```bash
   cd frontend
   npm run dev
   ```

6. **Recargar datos de demo** (si ya había pocos registros)

   ```bash
   cd backend
   npm run db:reset
   ```

### Credenciales de prueba

| Rol | Email | Contraseña |
|-----|-------|------------|
| Administrador | admin@prodentis.com | admin123 |
| Recepción | recepcion@prodentis.com | recep123 |
| Odontólogo | odontologo@prodentis.com | dent123 |

---

## 4. Arquitectura general

```mermaid
flowchart LR
  subgraph Browser
    UI[React UI]
    RQ[React Query]
    ZS[Zustand Store]
    AX[Axios Client]
  end
  subgraph Server
    EX[Express API]
    VAL[express-validator]
    CTRL[Controllers]
    PG[(PostgreSQL)]
  end
  UI --> RQ
  UI --> ZS
  RQ --> AX
  AX -->|HTTP REST /api| EX
  EX --> VAL --> CTRL --> PG
  AX -.->|GET /bootstrap| EX
  EX -.->|JSON| ZS
```

### Flujo típico de una operación (ejemplo: crear paciente)

1. El usuario completa el formulario en React.
2. **Zod** valida en el cliente antes de enviar.
3. El **servicio** (`patientsService.ts`) llama a `apiClient.post('/patients', body)`.
4. **Axios** envía JSON a `http://localhost:3001/api/patients` (en desarrollo, Vite hace **proxy** de `/api` al backend).
5. **Express** recibe la petición en la ruta → aplica reglas de **express-validator** → ejecuta el **controlador**.
6. El controlador ejecuta `INSERT` en PostgreSQL.
7. La BD aplica **constraints** (UNIQUE, CHECK, FK).
8. La API responde con el paciente creado (JSON en **camelCase**).
9. El frontend actualiza **Zustand** y **React Query** invalida/refresca listas.

---

## 5. Base de datos (PostgreSQL)

### 5.1 Ubicación de archivos

| Archivo | Rol |
|---------|-----|
| `backend/src/db/schema.sql` | Definición de tablas, tipos, CHECK, FK, índices |
| `backend/src/db/generateBulkSeed.js` | Generador programático de datos de demo |
| `backend/src/db/init.js` | Crea tablas, inserta seed, comando `db:reset` |

### 5.2 Modelo de datos (tablas principales)

| Tabla | Descripción |
|-------|-------------|
| `users` | Usuarios del sistema (roles: admin, receptionist, dentist, assistant) |
| `dentists` | Odontólogos vinculados a `users` |
| `patients` | Pacientes del consultorio |
| `procedures` | Catálogo de prestaciones (código, precio, duración) |
| `appointments` | Citas (paciente, odontólogo, horario, estado) |
| `treatments` | Tratamientos en curso o finalizados |
| `clinical_entries` | Registros de historia clínica |
| `odontograms` | Estado dental por paciente (JSON en columna `teeth`) |
| `invoices` / `invoice_lines` | Facturación |
| `payments` | Pagos asociados a facturas |
| `inventory_items` | Insumos |
| `stock_movements` | Movimientos de stock (entrada/salida) |
| `clinic_settings` | Configuración del consultorio (fila única) |

### 5.3 Relaciones (integridad referencial)

- Un **paciente** puede tener muchas **citas**, **tratamientos** y **entradas clínicas** (`ON DELETE CASCADE` en varias tablas hijas).
- Una **cita** referencia `patient_id` y `dentist_id` (FK obligatorias).
- Una **factura** referencia `patient_id`; las **líneas** referencian `invoice_id`.
- Un **movimiento de stock** referencia `item_id` del inventario.

### 5.4 Validación en la base de datos (capa más profunda)

PostgreSQL garantiza tipos y reglas aunque falle la aplicación:

| Tipo de regla | Ejemplo en PRODENTIS |
|---------------|----------------------|
| `CHECK` en enums | `status IN ('pending', 'confirmed', ...)` en citas |
| `CHECK` numérico | `base_price >= 0`, `stock >= 0` |
| `CHECK` lógico | `end_at > start_at` en citas |
| `UNIQUE` | `document_id` de paciente, `sku` de inventario |
| `NOT NULL` | Campos obligatorios |
| `FOREIGN KEY` | Integridad entre pacientes, odontólogos, procedimientos |
| Tipos fuertes | `DATE`, `TIMESTAMPTZ`, `NUMERIC(12,2)`, `JSONB` (odontograma) |

**Ejemplo de error de BD:** intentar insertar dos pacientes con el mismo `document_id` → código PostgreSQL `23505` → el backend lo traduce a HTTP **409 Conflict**.

### 5.5 Volumen de datos de demostración (seed)

Generados automáticamente al iniciar con BD vacía:

| Entidad | Cantidad aproximada |
|---------|---------------------|
| Pacientes | 65 |
| Citas | 185 |
| Tratamientos | 95 |
| Historia clínica | 130 |
| Odontogramas | 40 |
| Facturas | 78 |
| Insumos | 52 |
| Movimientos de stock | 160 |
| Procedimientos | 10 |

Los datos se distribuyen en **12 meses** para que los **reportes** muestren gráficos con actividad realista.

---

## 6. Backend (Node.js + Express)

### 6.1 Capas (patrón por responsabilidades)

```
Petición HTTP
    ↓
routes/          → Define método y ruta (GET, POST, PUT, DELETE)
    ↓
validators/      → Reglas express-validator
    ↓
middleware/validate.js → Si hay errores → 400
    ↓
controllers/     → Lógica de negocio + consultas SQL
    ↓
config/database.js → Pool de conexiones `pg`
    ↓
PostgreSQL
```

### 6.2 Endpoints REST implementados

| Método | Ruta | Acción |
|--------|------|--------|
| GET | `/api/health` | Estado del servidor |
| GET | `/api/bootstrap` | Carga inicial de todos los datos para el frontend |
| GET | `/api/patients` | Listar pacientes |
| GET | `/api/patients/:id` | Obtener uno |
| POST | `/api/patients` | Crear |
| PUT | `/api/patients/:id` | Actualizar |
| DELETE | `/api/patients/:id` | Eliminar |
| GET/POST/PUT/DELETE | `/api/appointments` | CRUD citas |
| GET/POST/PUT/DELETE | `/api/inventory` | CRUD inventario |
| GET | `/api/inventory/movements` | Listar movimientos (filtro `?itemId=`) |
| POST | `/api/inventory/:id/movements` | Registrar entrada/salida y actualizar stock |

> **Importante para la defensa:** Los módulos de facturación, historia clínica, tratamientos y login consumen datos vía **`/api/bootstrap`** y lógica en el **store del frontend**; el CRUD directo a API está implementado de forma completa en **pacientes, citas e inventario**, que son el núcleo exigido (GET/POST/PUT/DELETE + PostgreSQL).

### 6.3 Middlewares

| Middleware | Función |
|------------|---------|
| `cors` | Permite peticiones desde `http://localhost:5173` |
| `express.json()` | Parsea body JSON |
| `validate` | Centraliza errores de express-validator |
| `errorHandler` | Respuestas JSON uniformes `{ error, details }` |

### 6.4 Validación en backend (express-validator)

**Archivo ejemplo:** `backend/src/validators/patientValidator.js`

- `body('email').isEmail()` — formato de correo.
- `body('firstName').trim().isLength({ min: 2, max: 120 })` — longitud del nombre.
- `body('status').isIn(['active', 'inactive', 'archived'])` — solo valores permitidos.
- `param('id').isString().notEmpty()` — ID en la URL.

Si falla → middleware `validate` → respuesta **400** con array `details`.

### 6.5 Controladores y mapeo de datos

- La BD usa **snake_case** (`first_name`, `created_at`).
- La API responde en **camelCase** (`firstName`, `createdAt`) mediante `backend/src/utils/mappers.js`.
- Esto alinea el JSON con los tipos TypeScript del frontend.

### 6.6 Lógica de negocio destacada

**Citas:** al crear/actualizar se valida en controlador que `endAt > startAt`.

**Inventario — movimiento de stock (transacción):**

1. `BEGIN`
2. `SELECT ... FOR UPDATE` del ítem (evita condiciones de carrera).
3. Calcula nuevo stock (entrada suma, salida resta).
4. Si stock &lt; 0 → error 400.
5. Inserta movimiento + actualiza stock.
6. `COMMIT` (o `ROLLBACK` si falla).

**Bootstrap:** un solo `GET /api/bootstrap` devuelve pacientes, citas, facturas, etc., para hidratar la aplicación al cargar.

---

## 7. Frontend (React + Vite)

### 7.1 Tecnologías

| Tecnología | Uso |
|------------|-----|
| **React 19** | Interfaz por componentes |
| **Vite** | Bundler y servidor de desarrollo |
| **TypeScript** | Tipado estático |
| **React Router** | Navegación y rutas protegidas |
| **Axios** | Cliente HTTP hacia `/api` |
| **TanStack React Query** | Caché, loading y refetch de datos |
| **Zustand** | Estado global (sesión + datos del consultorio) |
| **Zod + React Hook Form** | Validación de formularios |
| **Tailwind CSS + Radix UI** | Estilos y componentes accesibles |
| **Recharts** | Gráficos en reportes |

### 7.2 Estructura por módulos (feature-based)

```
frontend/src/
├── app/                 → Router, layouts, providers, stores
├── modules/
│   ├── patients/        → pages, services, schemas
│   ├── appointments/
│   ├── billing/
│   ├── clinical-records/
│   ├── inventory/
│   ├── reports/
│   └── auth/
├── components/          → UI reutilizable (shadcn-style)
├── lib/api/             → Axios, bootstrap, errores
└── data/                → Seed local (fallback sin backend)
```

Cada módulo sigue el patrón:

- **`pages/`** — pantallas.
- **`services/`** — llamadas async (API o store).
- **`schemas/`** — validación Zod del formulario.

### 7.3 Cliente HTTP (Axios)

**Archivo:** `frontend/src/lib/api/client.ts`

- `baseURL`: `/api` (proxy en desarrollo → backend puerto 3001).
- Interceptor de respuesta: convierte errores HTTP en `ApiError` con mensaje y código.

**Servicios conectados a API REST:**

- `patientsService.ts` — CRUD completo.
- `appointmentsService.ts` — CRUD completo.
- `inventoryService.ts` — CRUD + movimientos.

Tras cada mutación, actualizan **Zustand** para que el resto de pantallas vea los cambios.

### 7.4 Carga inicial de datos

**Archivo:** `frontend/src/lib/api/bootstrap.ts`

Al abrir la app, `ApiBootstrap` ejecuta `hydrateAppFromApi()`:

1. `GET /api/bootstrap`
2. Rellena `useAppDataStore` con pacientes, citas, facturas, inventario, etc.

Si el backend no está disponible, se muestra aviso y la app usa el **seed local** (`frontend/src/data/generateBulkSeed.ts`).

### 7.5 Estado global (Zustand)

| Store | Contenido |
|-------|-----------|
| `useSessionStore` | Usuario logueado (sesión) |
| `useAppDataStore` | Todos los datos del consultorio |
| `useUiStore` | Preferencias de interfaz |

**Buena práctica aplicada:** los selectores de Zustand no deben devolver arrays filtrados directamente (`.filter()`), porque crean referencia nueva en cada render y pueden causar bucles en React 19. Se usa `useMemo` después de leer el array base.

### 7.6 Rutas y seguridad en cliente

```mermaid
flowchart TD
  A["/"] --> Landing[Página pública]
  B["/login"] --> Guest[GuestRoute]
  Guest --> Auth[AuthLayout]
  C["/dashboard ..."] --> Protected[ProtectedRoute]
  Protected --> Role[RoleGuard]
  Role --> Main[MainLayout + módulos]
```

- **`ProtectedRoute`:** sin sesión → redirige a `/login`.
- **`RoleGuard`:** según rol (admin, recepción, odontólogo, auxiliar) limita rutas sensibles.
- **`GuestRoute`:** usuarios logueados no vuelven al login.

> El login valida contra usuarios en memoria (seed/bootstrap). Está preparado para migrar a `POST /api/auth/login` en una versión futura.

### 7.7 Validación en frontend (Zod)

**Ejemplo:** `frontend/src/modules/patients/schemas/patientSchema.ts`

```typescript
email: z.string().email('Correo inválido')
status: z.enum(['active', 'inactive', 'archived'])
```

Integrado con **React Hook Form** (`zodResolver`): errores se muestran antes de llamar a la API.

**Doble validación (defensa oral):**

1. **Cliente (Zod)** — mejor experiencia de usuario, feedback inmediato.
2. **Servidor (express-validator)** — seguridad; no se confía solo en el navegador.
3. **Base de datos (CHECK/FK/UNIQUE)** — última línea de defensa e integridad.

---

## 8. Módulos funcionales (qué hace cada uno)

### Pacientes

- Listado con búsqueda, alta, edición, ficha detallada.
- Persistencia vía API REST + sincronización con store.

### Citas

- Lista, calendario, detalle, formulario.
- Estados: pendiente, confirmada, en curso, completada, cancelada.
- API REST completa.

### Historia clínica

- Entradas por paciente (evolución, diagnóstico, procedimiento, nota).
- Odontograma simplificado (32 piezas, estados: sano, caries, obturado, etc.).
- Datos desde bootstrap/store (lectura/escritura local sincronizada al store).

### Tratamientos

- Vinculados a procedimiento del catálogo y odontólogo.
- Estados: planificado, en progreso, completado, cancelado.

### Facturación

- Facturas con líneas, IVA 21%, estados: pendiente, pagada, parcial, anulada.
- Registro de pagos actualiza `amountPaid` y puede cambiar estado a `paid`/`partial`.

### Inventario

- CRUD de insumos vía API.
- Alertas visuales cuando `stock <= minStock`.
- Movimientos con transacción en backend.

### Reportes

**Archivo:** `frontend/src/modules/reports/services/reportsService.ts`

Calcula en tiempo real desde el store:

- Citas e ingresos por mes (12 meses).
- Pacientes nuevos por mes.
- Registros clínicos por mes.
- Citas por estado, facturación por estado.
- Tratamientos más frecuentes.
- Carga por odontólogo.
- Inventario por categoría e insumos con menor stock relativo.

No requiere endpoint propio: es **lógica de agregación** sobre datos ya cargados.

---

## 9. Configuración de red (desarrollo)

**Vite proxy** (`frontend/vite.config.ts`):

```typescript
proxy: { '/api': { target: 'http://localhost:3001', changeOrigin: true } }
```

El navegador pide `http://localhost:5173/api/patients` → Vite reenvía a `http://localhost:3001/api/patients`.

Ventaja: evita problemas de CORS en desarrollo y simula un despliegue con API en el mismo dominio.

---

## 10. Preguntas frecuentes en defensa oral

### ¿Por qué separaron frontend y backend?

- **Desacoplamiento:** el equipo puede trabajar en paralelo.
- **Escalabilidad:** la API puede servir web, móvil u otros clientes.
- **Cumplimiento del consigna:** React + Vite + Node + Express + PostgreSQL + Axios.

### ¿Qué es RESTful en su proyecto?

Usamos verbos HTTP con significado:

- **GET** — leer (listar / obtener por id).
- **POST** — crear.
- **PUT** — actualizar recurso existente.
- **DELETE** — eliminar.

Las URLs son sustantivos (`/patients`, `/appointments`), no acciones (`/createPatient`).

### ¿Dónde están las validaciones?

| Capa | Herramienta | Archivo ejemplo |
|------|-------------|-----------------|
| Formulario UI | Zod | `patientSchema.ts` |
| API | express-validator | `patientValidator.js` |
| BD | SQL CHECK, FK, UNIQUE | `schema.sql` |

### ¿Cómo se conecta React con PostgreSQL?

**No hay conexión directa.** Siempre: React → Axios → Express → driver `pg` → PostgreSQL.

### ¿Qué pasa si el backend está apagado?

El componente `ApiBootstrap` detecta el error, muestra aviso y la app funciona con datos locales del seed para no quedar vacía en la demo.

### ¿Cómo garantizan consistencia del stock?

Transacción SQL con `BEGIN` / `COMMIT` y bloqueo `FOR UPDATE` en el ítem de inventario al registrar un movimiento.

### ¿Autenticación real?

Actualmente **simulada en cliente** comparando email/contraseña con usuarios del seed. La sesión vive en `useSessionStore` (memoria del navegador). Para producción se recomienda JWT, hash de contraseñas (bcrypt) y endpoint `/api/auth/login`.

### ¿Por qué camelCase en JSON y snake_case en BD?

Convención habitual: JavaScript/TypeScript usa camelCase; PostgreSQL suele usar snake_case. Los **mappers** en el backend traducen entre ambos.

---

## 11. Diagrama entidad-relación (simplificado)

```mermaid
erDiagram
  PATIENTS ||--o{ APPOINTMENTS : tiene
  DENTISTS ||--o{ APPOINTMENTS : atiende
  PATIENTS ||--o{ TREATMENTS : recibe
  PROCEDURES ||--o{ TREATMENTS : define
  PATIENTS ||--o{ CLINICAL_ENTRIES : tiene
  PATIENTS ||--o{ INVOICES : factura
  INVOICES ||--o{ INVOICE_LINES : contiene
  INVOICES ||--o{ PAYMENTS : pago
  INVENTORY_ITEMS ||--o{ STOCK_MOVEMENTS : movimiento
  PATIENTS ||--o| ODONTOGRAMS : odontograma
```

---

## 12. Checklist de requisitos académicos

| Requisito | Cumplimiento |
|-----------|--------------|
| React + Vite | `frontend/` |
| Node.js + Express | `backend/` |
| Axios | `frontend/src/lib/api/client.ts` |
| CRUD + PostgreSQL | Pacientes, citas, inventario |
| GET / POST / PUT / DELETE | Rutas en `backend/src/routes/` |
| Middlewares | CORS, JSON, validación, errores |
| Validaciones | Zod + express-validator + SQL |
| Controladores | `backend/src/controllers/` |
| Datos de demo | Seed masivo + `npm run db:reset` |
| Listo para feria | Login, módulos visuales, reportes con gráficos |

---

## 13. Mejoras futuras (si preguntan “qué harían después”)

1. Endpoints REST para facturación, historia clínica y tratamientos.
2. Autenticación JWT con contraseñas hasheadas.
3. Paginación y filtros en listados grandes.
4. Tests automatizados (Jest/Supertest en API, Vitest en UI).
5. Despliegue (frontend en estático, API y BD en cloud).

---

## 14. Referencia rápida de archivos clave

| Tema | Ruta |
|------|------|
| Schema BD | `backend/src/db/schema.sql` |
| Seed / reset | `backend/src/db/init.js`, `npm run db:reset` |
| Rutas API | `backend/src/routes/index.js` |
| Validadores | `backend/src/validators/*.js` |
| Controladores | `backend/src/controllers/*.js` |
| Axios | `frontend/src/lib/api/client.ts` |
| Bootstrap | `frontend/src/lib/api/bootstrap.ts` |
| Store datos | `frontend/src/app/store/useAppDataStore.ts` |
| Router | `frontend/src/app/router/index.tsx` |
| Reportes | `frontend/src/modules/reports/` |

---

**Equipo PRODENTIS** — Documento de apoyo para evaluación docente.  
Última actualización: alineado con la estructura `frontend/` + `backend/` y seed masivo de demostración.
