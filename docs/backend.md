# Backend

Express 5 + TypeScript (ESM, `tsx` en dev) + Prisma 7 (Postgres). Punto de entrada `src/index.ts` → `createApp()` en `src/app.ts`.

## Estructura por módulo

Cada feature vive en `src/modules/<feature>/` con 3 archivos:

```
<feature>.routes.ts       # define rutas + middlewares, exporta el Router
<feature>.controller.ts   # req/res, validación Zod, llama al service
<feature>.service.ts      # lógica de negocio + acceso a Prisma
```

Módulos: `auth`, `books`, `recipes`, `scan`, `stats`.

Soporte (`src/`):
- `config/env.ts` — env validado con Zod (ver tabla en [CLAUDE.md](../CLAUDE.md)).
- `db/` — cliente Prisma.
- `middleware/` — `auth.ts` (`requireAuth`), `error.ts` (`errorHandler`, `notFoundHandler`), `upload.ts` (multer: `uploadImage` a disco, `uploadImageToMemory`), `rateLimit.ts` (`loginRateLimiter`).
- `utils/asyncHandler.ts` — envuelve handlers async para propagar errores.
- `schemas/`, `types/`.

Convención: las rutas envuelven cada handler con `asyncHandler(...)`. El montaje vive en `app.ts`.

## API

Montado en `app.ts`. `/api/auth/*` es público; **todo lo demás bajo `/api` exige JWT**.

**Auth** (`/api/auth`)
- `POST /login` — email + password (rate-limited). Devuelve JWT.
- `POST /google` — login con Google (rate-limited).
- `GET /me` — usuario actual (requiere auth).

**Books** (`/api/books`)
- `GET /` · `POST /` · `GET /:id` · `PATCH /:id` · `DELETE /:id`
- `PUT /:id/cover` — sube cover (multipart `cover`, a disco en `UPLOAD_DIR`).
- `GET /:id/cover` — sirve el cover.

**Recipes**
- Anidadas bajo un libro (`/api/books/:bookId/recipes`, `mergeParams`): `POST /`, `POST /bulk`.
- Top-level (`/api/recipes`): `PATCH /:id`, `DELETE /:id`.

**Scan** (`/api/scan`)
- `POST /index` — multipart `image` (en **memoria**, nunca tocando disco) → Claude. Ver abajo.

**Stats** (`/api/stats`)
- `GET /` — agregados para el strip del Home.

**Health**: `GET /healthz` (sin auth, fuera de `/api`).

## Modelo de datos (Prisma)

`prisma/schema.prisma` es la fuente de verdad. Provider `postgresql`.

```prisma
enum BookType { Dulce  Salado  Mixto }

User   { id, email @unique, passwordHash?, googleSub? @unique, createdAt }
Book   { id, title, author, type:BookType, currentPage @default(0),
         totalPages, coverImage?, createdAt, updatedAt, recipes Recipe[] }
Recipe { id, bookId→Book (onDelete: Cascade), name, page,
         score? (1–10, null = sin cocinar), comment?, type?,
         createdAt, updatedAt }   // @@index([bookId])
```

Reglas de dominio:
- Una receta está **completada** si `score !== null`. Progreso de un libro = completadas / total.
- `User` modela un único owner (admin por env); `passwordHash` es null si solo usa Google, `googleSub` se setea en el primer login con Google.

Prisma: `prisma/` contiene `schema.prisma`, `migrations/`, `seed.ts` e `import-excel.ts` (importa `_import_data.json` desde la raíz del repo, generado a partir de `Libros de cocina.xlsx`).

## Integración Claude (scan de índices)

`@anthropic-ai/sdk`. El módulo `scan` recibe una foto del índice en memoria y se la pasa a Claude Vision. System prompt:

> "You are a recipe index parser. Extract every recipe name and its page number. Return ONLY a JSON array like: [{\"name\": \"Recipe Name\", \"page\": 42}]."

El array devuelto alimenta un checklist en el frontend para confirmar antes de hacer `POST /bulk`. Requiere `ANTHROPIC_API_KEY`.

## Tests

Vitest (`pnpm test`). `vitest-mock-extended` para mockear Prisma.
