# Mis Libros de Cocina — Backend

API del proyecto personal "Mis Libros de Cocina" (app mobile-first para rastrear libros de cocina y recetas, con un escáner de índices que usa Claude Vision). Este repo es **solo el backend**: Express 5 + TypeScript (ESM) + Prisma 7 / Postgres. El frontend (React + Vite) vive en un repo aparte, `libros-de-cocina`, y se comunica con este servicio por HTTP bajo `/api`.

## Antes de empezar

Para el detalle de API, rutas, módulos (controllers/services), auth, modelo de datos, Prisma y la integración con Claude, lee [docs/backend.md](docs/backend.md). Está escrito para ser autosuficiente.

## Comandos (desde la raíz del repo)

```bash
pnpm dev              # tsx watch src/index.ts — puerto 3001
pnpm build            # prisma generate && tsc
pnpm start            # prisma migrate deploy && node dist/index.js
pnpm test             # vitest run
pnpm test:coverage    # vitest run --coverage
pnpm seed             # tsx prisma/seed.ts
pnpm prisma:generate  # prisma generate
pnpm prisma:migrate   # prisma migrate dev
pnpm typecheck        # tsc --noEmit
```

**Setup inicial**: `pnpm install`. **pnpm only** (no npm/yarn). Node ≥ 20.

## Variables de entorno

Validadas con Zod en `src/config/env.ts` — el proceso **crashea al boot** si falta algo requerido. Ver `.env.example`.

| Var | Requerida | Default | Notas |
|---|---|---|---|
| `DATABASE_URL` | ✅ | — | Postgres |
| `JWT_SECRET` | ✅ | — | ≥ 16 chars |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | ✅ | — | único usuario "owner" |
| `ANTHROPIC_API_KEY` | ⚠️ opcional | — | requerido para el scan |
| `GOOGLE_CLIENT_ID` | opcional | — | login con Google |
| `PORT` | | 3001 | |
| `CORS_ORIGIN` | | `http://localhost:5173` | CSV → array; incluir la URL pública del frontend |
| `JWT_EXPIRES_IN` | | `7d` | |
| `UPLOAD_DIR` | | `./uploads` | covers en disco — en producción, apuntar al mount path de un Railway Volume |
| `MAX_UPLOAD_BYTES` | | 5 MB | |
| `NODE_ENV` | | `development` | |

## Flujo entre servicios

- El frontend llama a `/api/*`; en dev, Vite hace proxy de `/api` → `http://localhost:3001`.
- Toda ruta bajo `/api` excepto `/api/auth/*` requiere JWT (`Authorization: Bearer …`).
- `GET /healthz` (sin auth, fuera de `/api`) es la liveness probe.

## Deploy (Railway)

Servicio Railway independiente, con Root Directory = raíz de este repo (`railway.json`). Build `pnpm install --frozen-lockfile && pnpm build`, start `pnpm start`.

**Covers persistentes**: el filesystem del contenedor en Railway es efímero — sin un **Volume** montado, las covers subidas se pierden en cada redeploy/restart. Agregar un Volume al servicio y apuntar `UPLOAD_DIR` a su mount path. El `CORS_ORIGIN` debe incluir la URL pública del frontend.

## Reglas

- **pnpm only** (no npm/yarn). Node ≥ 20.
- Estructura por módulo (`routes` → `controller` → `service`). Ver [docs/backend.md](docs/backend.md).
