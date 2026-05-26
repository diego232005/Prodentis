# PRODENTIS — Consultorio odontológico

Proyecto full stack para demostración en feria:

- **Frontend:** React + Vite + TypeScript (`/frontend`)
- **Backend:** Node.js + Express + PostgreSQL (`/backend`)
- **HTTP:** Axios desde el frontend hacia API REST

## Requisitos

- Node.js 20+
- PostgreSQL 14+

## Base de datos

**Opción A — Docker (recomendado para la feria):**

```bash
docker compose up -d
```

**Opción B — PostgreSQL local:**

```sql
CREATE DATABASE prodentis;
```

Copiá la configuración del backend:

```bash
cp backend/.env.example backend/.env
```

Editá `DATABASE_URL` en `backend/.env` si tu usuario/clave de PostgreSQL es distinto.

## Instalación

```bash
npm run install:all
```

## Ejecutar (demo)

Terminal 1 — API (puerto 3001, crea tablas y carga datos de ejemplo):

```bash
cd backend
npm run dev
```

Terminal 2 — interfaz (puerto 5173):

```bash
cd frontend
npm run dev
```

O desde la raíz (con `concurrently` instalado):

```bash
npm install
npm run dev
```

## Credenciales de prueba

| Rol        | Email                    | Contraseña |
|-----------|--------------------------|------------|
| Admin     | admin@prodentis.com      | admin123   |
| Recepción | recepcion@prodentis.com  | recep123   |
| Odontólogo| odontologo@prodentis.com | dent123  |

## API REST (ejemplos)

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/health` | Estado del servidor |
| GET | `/api/bootstrap` | Todos los datos iniciales |
| GET/POST/PUT/DELETE | `/api/patients` | CRUD pacientes |
| GET/POST/PUT/DELETE | `/api/appointments` | CRUD citas |
| GET/POST/PUT/DELETE | `/api/inventory` | CRUD inventario |
| POST | `/api/inventory/:id/movements` | Movimiento de stock |

Validaciones con `express-validator`, capas: rutas → middleware → controladores → PostgreSQL (constraints y tipos en SQL).

### Recargar datos de demo (65+ pacientes, 185 citas, etc.)

Si la base ya existía con pocos registros:

```bash
cd backend
npm run db:reset
```

Reiniciá el backend y refrescá el frontend.

## Estructura del repositorio

```
Desarrollo Web/
├── frontend/   → React + Vite (UI)
├── backend/    → Express + PostgreSQL (API)
├── README.md
└── DOCUMENTACION_PROFESORES.md
```


Colección Postman: [postman/PRODENTIS-API.postman_collection.json](./postman/PRODENTIS-API.postman_collection.json)

## Estructura del backend

```
backend/src/
  controllers/
  middleware/
  validators/
  routes/
  db/         schema + seed
```
