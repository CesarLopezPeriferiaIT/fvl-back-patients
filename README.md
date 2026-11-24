# fvl-back-patients

Plantilla base de backend de la Fundación Valle del Lili: Node 24, Express 5, TypeScript y SQL Server con TypeORM. Es una base ligera: arranque, cabeceras de seguridad, acceso a datos y, por ahora, un único endpoint de negocio (registro de paciente). Los demás endpoints se agregan encima, uno por uno.

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
| Base de datos | TypeORM + mssql, conexión única perezosa, `synchronize: false`, entidad `Paciente` |
| Pruebas | Vitest + supertest, sin red ni base de datos |
| Despliegue | Dockerfile multietapa y `docker-compose.yml`; SQL Server local en `docker-compose.local.yml` |

## Endpoints

Cuelgan de `/{API_BASE_URL}/{ENV}/{API_VERSION}`, por ejemplo `/backend/dev/v1`.

| Método | Ruta | Entrada (cuerpo JSON) | `data` en la respuesta 200 |
|---|---|---|---|
| `GET` | `/` y `/health` (sin prefijo) | — | `{ status: "up" }` |
| `POST` | `/patients` | `fecha_nacimiento` (obligatoria, `YYYY-MM-DD`, entre 1900-01-01 y hoy); opcionales: `geolocalizacion_lat` y `geolocalizacion_lon` (juntas), `municipio_id` y `departamento_id` (enteros entre 1 y 2147483647), `etnia` (hasta 20 caracteres) | `{ patient: { paciente_id, fecha_nacimiento, edad, geolocalizacion_lat, geolocalizacion_lon, municipio_id, departamento_id, etnia } }` |

La documentación interactiva (Swagger UI) está en `/api-docs` y el documento OpenAPI en `/api-docs.json`, ambos fuera del prefijo. Solo se publican con `ENV=dev`. El documento se escribe a mano en `src/http/openapi.ts`: al agregar un endpoint hay que agregarlo también ahí. Una prueba falla si una ruta del router no está documentada.

La `edad` la calcula el servidor desde `fecha_nacimiento`; si el cliente la envía, se ignora. Errores: 400 si falla la validación y 503 si la base no responde.

## Errores

Todos los mensajes que se devuelven van en español. Cada error sale del diccionario [src/http/errors.ts](src/http/errors.ts), que define su status y su mensaje. El cliente debe decidir por `data.error_code` y no por el texto:

```json
{ "message": "La fecha de nacimiento no puede ser futura.", "error": true, "code": 400,
  "data": { "error_code": "FECHA_NACIMIENTO_FUTURE" } }
```

Un error nuevo se agrega al diccionario, se lanza con `httpError('CODIGO')` y, si es de validación, el esquema usa el código como `errorMessage`. Un error inesperado responde `INTERNAL_ERROR` sin exponer su detalle. Esto se aparta de la plantilla FVL, que escribe cada mensaje en su controller, en inglés y sin catálogo.

## Estructura

```
src/
├── index.ts                    conecta la base, crea la app y escucha
├── app.ts                      createApp(): orden fijo de middlewares
├── config/env.ts               getters de variables de entorno
├── db/
│   ├── data-source.ts          getDataSource(); aquí se registran las entidades
│   ├── entities/               una entidad por tabla, <Nombre>.class.ts
│   ├── repositories/           acceso a datos por tabla
│   └── types/                  tipos de los repositorios
├── http/
│   ├── errors.ts               diccionario de errores y httpError()
│   ├── response.ts             success() y failure()
│   ├── types/                  tipos del contrato HTTP, un archivo por endpoint
│   ├── openapi.ts              documento OpenAPI escrito a mano
│   ├── routes/index.ts         router donde se montan los endpoints
│   ├── controllers/            un controller por endpoint
│   ├── validators/             un esquema de express-validator por endpoint
│   └── middlewares/            securityHeaders, apiDocs y errorHandler
└── shared/                     logger y fechas, con sus tipos en shared/types/
tests/                          pruebas
db/                             scripts SQL aplicados a la base
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

## Variables de entorno

Se leen de `.env` (modelo en `.env.example`).

| Variable | Qué es |
|---|---|
| `ENV` | Ambiente: `dev`, `qas` o `prd`. Va en la URL del API y solo con `dev` se publica Swagger |
| `PORT` | Puerto en el que escucha Node |
| `API_BASE_URL` | Primer segmento de la URL del API (`backend`) |
| `API_VERSION` | Versión del API en la URL (`v1`) |
| `ALLOWED_ORIGINS` | Orígenes de navegador que pueden leer respuestas, separados por coma. Vacío: ninguno |
| `MAIN_DB_HOST`, `MAIN_DB_PORT` | Servidor y puerto de SQL Server |
| `MAIN_DB_USER`, `MAIN_DB_PASSWORD` | Usuario propio de la aplicación (nunca el administrador) y su contraseña |
| `MAIN_DB_NAME` | Base de datos |

## Agregar una tabla y un endpoint

1. Crea o modifica la tabla en la base de datos y guarda el script SQL en `db/` (ver `db/paciente-alter.sql`).
2. Crea la entidad en `src/db/entities/<Nombre>.class.ts` con las propiedades y tipos exactos de las columnas, y regístrala en `entities` de `src/db/data-source.ts`.
3. Crea `src/db/repositories/<nombre>.repository.ts` con funciones sueltas.
4. Crea el controller, el validador y la ruta del endpoint, y móntala en `src/http/routes/index.ts`. Los errores se lanzan con `boom`; la respuesta de éxito usa `success()`.
5. Entrega sus pruebas en el mismo cambio.

## Convenciones

- Funcional: sin clases (salvo entidades), sin `any`, ESM con imports `.js`.
- Sin comentarios en el código. Solo se documentan las funciones con un JSDoc de una descripción corta en inglés, sin `@param` ni `@returns`.
- Los tipos no se declaran en controllers, repositorios ni utilidades: viven en la carpeta `types/` de su capa (`http/types`, `db/types`, `shared/types`).
- `process.env` se lee solo dentro de funciones.
- Dependencias con versión exacta. `.npmrc` activa `legacy-peer-deps` porque npm falla al resolver `vitest` sin él.
- Commits: asunto en inglés, en MAYÚSCULAS y en imperativo; cuerpo en español con viñetas; última viñeta con el resultado de pruebas, `tsc` y `eslint`.

## Comandos

| Comando | Qué hace |
|---|---|
| `npm run dev` | Servidor con recarga al guardar |
| `npm run build` y `npm start` | Compila a `dist/` y lo ejecuta, cargando `.env` si existe |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint |
| `npm test` y `npm run test:coverage` | Pruebas, con cobertura |
| `npm run db:local:up` y `db:local:down` | SQL Server local en Docker |

En Windows, ejecuta los comandos desde una consola cuya ruta empiece con la letra de unidad en mayúscula (`D:\`). Con `d:\` Vitest carga los módulos dos veces y falla con "failed to find the current suite".

## Pendientes

- Probar `POST /patients` contra la base real: las pruebas simulan el repositorio y no insertan datos. La tabla `paciente` estaba vacía, así que la lectura de `date` y `decimal` aún no se ha comprobado con filas reales.
- Guardar en `db/` el `CREATE TABLE` de `paciente`: hoy solo está el `ALTER` de las columnas nuevas, y con una base vacía el endpoint responde 503.
- Validar `municipio_id` y `departamento_id` contra sus catálogos cuando existan sus tablas.
- Consulta, modificación y borrado de pacientes, e idempotencia del registro.
- Matriz de roles.
- Documentación de API (`api-guide.html`), `CHANGELOG.md` y rollback, que exigen los lineamientos al entregar.
