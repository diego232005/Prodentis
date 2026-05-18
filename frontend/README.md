# PRODENTIS — Frontend

Aplicación web para la gestión de un **consultorio odontológico**: pacientes, citas, historia clínica, tratamientos, facturación, inventario y reportes.

| Capa | Tecnología |
|------|------------|
| UI | React 19 + TypeScript |
| Build | Vite 5 |
| Estilos | Tailwind CSS 3 + Radix UI |
| Rutas | React Router 7 |
| Estado global | Zustand |
| Datos remotos | TanStack React Query + **Axios** |
| Formularios | React Hook Form + Zod |

La API vive en [`../backend`](../backend). Documentación académica completa: [`../DOCUMENTACION_PROFESORES.md`](../DOCUMENTACION_PROFESORES.md).

---

## Requisitos previos

- **Node.js** 20+ (recomendado 20.19+)
- **PostgreSQL** 14+ (o `docker compose up -d` en la raíz del repo)
- **Backend** corriendo en `http://localhost:3001`

---

## Instalación y ejecución

### Solo frontend (desarrollo)

```bash
cd frontend
npm install
npm run dev
```

Abrir **http://localhost:5173**.

Vite redirige las peticiones `/api/*` al backend (ver `vite.config.ts` → `server.proxy`).

### Frontend + backend (recomendado)

Desde la raíz `Desarrollo Web/`:

```bash
npm run install:all
npm run dev
```

### Variables de entorno opcionales

Crear `frontend/.env` si necesitás apuntar a otra API:

```env
VITE_API_URL=http://localhost:3001/api
```

Si no se define, el cliente usa `/api` (proxy en desarrollo).

---

## Conexión con el backend

```
Navegador  →  Axios (apiClient)  →  /api  →  Vite proxy  →  Express :3001  →  PostgreSQL
```

| Archivo | Rol |
|---------|-----|
| `src/lib/api/client.ts` | Instancia Axios, interceptor de errores |
| `src/lib/api/bootstrap.ts` | `GET /bootstrap` — carga inicial del store |
| `src/lib/api/errors.ts` | `ApiError` con código HTTP |
| `src/modules/*/services/*.ts` | Llamadas por dominio |

**CRUD contra API REST:** pacientes, citas e inventario. El resto de módulos (facturación, historia clínica, tratamientos, login) usa datos del **bootstrap** y el store local sincronizado al iniciar.

Al arrancar la app, `ApiBootstrap` hidrata `useAppDataStore`. Si el backend no responde, se muestra un aviso y se usan datos de `src/data/generateBulkSeed.ts`.

---

## Módulos de la interfaz

| Ruta | Módulo | Descripción |
|------|--------|-------------|
| `/` | Landing | Página pública del consultorio |
| `/login` | Auth | Inicio de sesión (usuarios del seed) |
| `/dashboard` | Dashboard | KPIs y accesos rápidos |
| `/patients` | Pacientes | Listado, alta, edición, ficha |
| `/appointments` | Citas | Lista, calendario, formulario |
| `/clinical-records` | Historia clínica | Evoluciones y odontograma |
| `/treatments` | Tratamientos | Planes y estados |
| `/billing` | Facturación | Facturas y pagos |
| `/inventory` | Inventario | Stock y movimientos |
| `/reports` | Reportes | Gráficos (12 meses) |
| `/settings` | Configuración | Datos del consultorio |

**Roles:** admin, recepción, odontólogo, auxiliar — rutas filtradas en `RoleGuard`.

### Usuarios de prueba

| Correo | Contraseña | Rol |
|--------|------------|-----|
| admin@prodentis.com | admin123 | Administrador |
| recepcion@prodentis.com | recep123 | Recepción |
| odontologo@prodentis.com | dent123 | Odontólogo |
| auxiliar@prodentis.com | aux123 | Auxiliar |

---

## Estructura del código (`src/`)

```
src/
├── app/              # Router, layouts, providers, stores
├── modules/          # Un folder por dominio (pages, services, schemas)
├── components/       # UI reutilizable (shadcn-style)
├── lib/
│   ├── api/          # Axios, bootstrap, errores
│   ├── constants/    # Rutas, roles, branding
│   └── formatters/   # Fechas, moneda
├── data/             # Seed local (fallback)
├── types/            # Tipos TypeScript compartidos
└── styles/           # globals.css (tema)
```

Patrón por módulo:

- **`pages/`** — pantallas
- **`services/`** — funciones async (API)
- **`schemas/`** — validación Zod de formularios

---

## Probar la API con Postman

Colección incluida en el repositorio:

**[`../postman/PRODENTIS-API.postman_collection.json`](../postman/PRODENTIS-API.postman_collection.json)**

1. Importar en Postman (Import → archivo JSON).
2. Asegurarse de que el backend esté activo: `cd backend && npm run dev`.
3. La variable de colección `baseUrl` por defecto es `http://localhost:3001/api`.
4. Tras crear un paciente/cita, Postman guarda IDs en variables (`patientId`, `appointmentId`, etc.) para encadenar requests.

---

## Scripts npm

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Servidor de desarrollo (puerto 5173) |
| `npm run build` | Typecheck + bundle de producción |
| `npm run preview` | Sirve la carpeta `dist/` |
| `npm run lint` | ESLint |

---

## Assets y logo

- Logo: `public/brand/prodentis-logo.png`
- Favicon: configurado en `index.html`

Si el logo muestra un recuadro blanco, ejecutar (requiere `sharp`):

```bash
npm install sharp
node scripts/fix-logo-transparency.mjs
```

---

## Solución de problemas

| Problema | Qué revisar |
|----------|-------------|
| Pantalla vacía / sin datos | ¿Backend en 3001? ¿PostgreSQL activo? `cd backend && npm run db:reset` |
| Error de red en consola | `backend/.env` y `DATABASE_URL` |
| Cambios en API no se ven | Refrescar con Ctrl+F5; reiniciar backend |
| Build falla en Node antiguo | Usar Node 20.19+ o mantener Vite 5 (ya configurado) |

---

## Enlaces útiles

- [README del monorepo](../README.md) — instalación global y Docker
- [DOCUMENTACION_PROFESORES.md](../DOCUMENTACION_PROFESORES.md) — defensa oral / feria
- [Backend README](../backend) — API, seed, `npm run db:reset`
