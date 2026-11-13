# fvl-back-patients

Plantilla base de backend de la Fundación Valle del Lili: Node 24, Express 5, TypeScript y SQL Server con TypeORM. No contiene reglas de negocio: solo el arranque, las cabeceras de seguridad y el acceso a datos. Los endpoints se agregan encima, uno por uno.

El proyecto es **database first**: la base de datos es la fuente de verdad, y cada tabla se escribe primero en SQL y luego se refleja en una entidad.

La validación de la `X-API-Key` no vive aquí: la hace otro microservicio. Este servicio no tiene tabla de llaves ni middleware de autenticación.

## Qué incluye

| Pieza | Detalle |
|---|---|
| Rutas públicas | `GET /` y `GET /health`, devuelven solo `{ status: "up" }` |
| Prefijo del API | `/{API_BASE_URL}/{ENV}/{API_VERSION}`, por ejemplo `/backend/dev/v1` |
| Respuesta única | `{ message, error, code, data }`, éxito siempre con 200 |
| Seguridad HTTP | helmet, `Permissions-Policy`, `Cache-Control: no-store`, CORS por lista de orígenes, cuerpo máximo de 100 kb |
| Errores | `boom`; los 5xx nunca exponen su mensaje |
| Base de datos | TypeORM + mssql, conexión única perezosa, `synchronize: false`, sin entidades todavía |
| Pruebas | Vitest + supertest, sin red ni base de datos |
| Despliegue | Dockerfile multietapa y `docker-compose.yml`; SQL Server local en `docker-compose.local.yml` |

## Estructura

```
src/
├── index.ts                    conecta la base, crea la app y escucha
├── app.ts                      createApp(): orden fijo de middlewares
├── config/env.ts               getters de variables de entorno
├── db/data-source.ts           getDataSource(); aquí se registran las entidades
├── http/
│   ├── response.ts             success() y failure()
│   ├── routes/index.ts         router donde se montan los endpoints
│   └── middlewares/            securityHeaders y errorHandler
└── shared/logger.ts            log JSON por stdout
tests/                          pruebas
```

Orden de los middlewares: cabeceras de seguridad, CORS, JSON, rutas públicas, rutas del API, 404, manejador de errores.

## Arranque

Requiere Node 24 o superior y Docker.

```bash
npm ci
cp .env.example .env
npm run db:local:up
```

Completa `.env` (la contraseña de `MAIN_DB_PASSWORD` crea el usuario `sa` del contenedor local) y crea en el servidor la base indicada en `MAIN_DB_NAME`. Luego:

```bash
npm run dev
curl http://localhost:3000/health
```

El servicio no arranca si no logra conectarse a la base de datos.

## Agregar una tabla y un endpoint

1. Crea la tabla en la base de datos con su DDL, que se guarda en `db/`.
2. Crea la entidad en `src/db/entities/<Nombre>.class.ts` con las propiedades y tipos exactos de las columnas, y regístrala en `entities` de `src/db/data-source.ts`.
3. Crea `src/db/repositories/<nombre>.repository.ts` con funciones sueltas.
4. Crea el controller, el validador y la ruta del endpoint, y móntala en `src/http/routes/index.ts`. Los errores se lanzan con `boom`; la respuesta de éxito usa `success()`.
5. Entrega sus pruebas en el mismo cambio.

## Convenciones

- Funcional: sin clases (salvo entidades), sin `any`, ESM con imports `.js`.
- Sin comentarios en el código. Solo se documentan las funciones con un JSDoc de una descripción corta en inglés, sin `@param` ni `@returns`.
- `process.env` se lee solo dentro de funciones.
- Dependencias con versión exacta. `.npmrc` activa `legacy-peer-deps` porque npm falla al resolver `vitest` sin él.
- Commits: asunto en inglés, en MAYÚSCULAS y en imperativo; cuerpo en español con viñetas; última viñeta con el resultado de pruebas, `tsc` y `eslint`.

## Comandos

| Comando | Qué hace |
|---|---|
| `npm run dev` | Servidor con recarga al guardar |
| `npm run build` y `npm start` | Compila a `dist/` y lo ejecuta |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint |
| `npm test` y `npm run test:coverage` | Pruebas, con cobertura |
| `npm run db:local:up` y `db:local:down` | SQL Server local en Docker |

En Windows, ejecuta los comandos desde una consola cuya ruta empiece con la letra de unidad en mayúscula (`D:\`). Con `d:\` Vitest carga los módulos dos veces y falla con "failed to find the current suite".

## Pendientes

- Verificar la conexión real a SQL Server: las pruebas nunca tocan la base.
- Definir el alcance de pacientes y citas, y la matriz de roles.
- Documentación de API (`api-guide.html`), `CHANGELOG.md` y rollback, que exigen los lineamientos al entregar.
