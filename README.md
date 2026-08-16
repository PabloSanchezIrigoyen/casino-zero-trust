# Casino Zero Trust

Laboratorio ético WEB de privacidad, permisos y ciberseguridad. **No es un sitio malicioso.**

- `frontend/` — Next.js (lobby, juegos visuales, concientización, admin)
- `backend/` — Express + Prisma + MySQL (sesión, bitácora, dashboard API)

## Requisitos

- Node.js 20+
- MySQL (XAMPP / WAMP / MySQL Server) y phpMyAdmin
- Crear la base `casino_zero_trust` (vacía; Prisma crea las tablas)

En phpMyAdmin: *Nueva* → nombre `casino_zero_trust` → crear.

Si tu MySQL tiene contraseña, edita `backend/.env`:

```
DATABASE_URL="mysql://root:TU_PASSWORD@localhost:3306/casino_zero_trust"
```

## Arranque local

```bash
cd casino-zero-trust
npm install
npm run install:all
npm run db:push
npm run db:seed
npm run dev
```

- Casino: http://localhost:3000 (el usuario crea cuenta con correo y contraseña)
- Admin: http://localhost:3000/admin/login
- API: http://localhost:4000/api/health

Credenciales de administrador: `admin` / `lab-casino-2026`

## Despliegue (Vercel + Railway)

Vercel solo sirve el frontend. El backend Express y MySQL van en Railway (recomendado) o Render.

Orden: primero el backend, luego el frontend, luego pegas la URL de Vercel en el backend.

### 1. Backend en Railway

1. Entra a [railway.app](https://railway.app) e inicia sesión con GitHub.
2. *New Project* → *Deploy from GitHub repo* → `casino-zero-trust`.
3. Añade un servicio **MySQL** al mismo proyecto (*Add service* → *Database* → *MySQL*).
4. En el servicio de la API (el del repo):
   - **Root Directory vacío** (no pongas `backend`; el `Dockerfile` de la raíz ya construye la API)
   - *Variables*:

| Variable | Valor |
|---|---|
| `DATABASE_URL` | `${{MySQL.MYSQL_URL}}` |
| `FRONTEND_ORIGIN` | `https://TU-APP.vercel.app` (la pones en el paso 3) |
| `JWT_SECRET` | una frase larga aleatoria |
| `ADMIN_USER` | `admin` |
| `ADMIN_PASSWORD` | `lab-casino-2026` (o cámbiala) |
| `NODE_ENV` | `production` |

5. *Settings* → *Networking* → *Generate domain*. Copia la URL, por ejemplo `https://casino-zero-trust-production.up.railway.app`.
6. Comprueba `https://TU-API.up.railway.app/api/health`. Debe devolver `{ "ok": true, ... }`.

phpMyAdmin en Railway (opcional, para la práctica):

1. *Add service* → *Docker Image* → `phpmyadmin/phpmyadmin:latest`
2. Variables: `PMA_HOST=${{MySQL.MYSQLHOST}}`, `PMA_PORT=${{MySQL.MYSQLPORT}}`, `PMA_USER=${{MySQL.MYSQLUSER}}`, `PMA_PASSWORD=${{MySQL.MYSQLPASSWORD}}`
3. *Generate domain* y abre esa URL.

### 2. Frontend en Vercel

1. Entra a [vercel.com/new](https://vercel.com/new) e importa `PabloSanchezIrigoyen/casino-zero-trust`.
2. *Root Directory* = `frontend`
3. *Environment Variables*:
   - `NEXT_PUBLIC_API_URL` = `https://TU-API.up.railway.app` (sin barra final)
4. Deploy.

### 3. Cerrar el círculo

En Railway, pon `FRONTEND_ORIGIN` = la URL de Vercel (`https://tu-app.vercel.app`) y redespliega el backend.

Luego entra al casino en Vercel y al admin en `/admin/login`.

### Render (alternativa al backend)

Render no trae MySQL gestionado. Crea un *Web Service* con *Root Directory* `backend` y pega en `DATABASE_URL` un MySQL externo (el de Railway, AlwaysData, etc.). El archivo `render.yaml` ya define el servicio.

Variables iguales que en Railway: `FRONTEND_ORIGIN`, `JWT_SECRET`, `DATABASE_URL`, `ADMIN_USER`, `ADMIN_PASSWORD`.

## Qué se guarda (y qué no)

Solo cuentas con correo y contraseña. Se actualiza: hora, IP, dispositivo, navegador y permisos reales del navegador.

No se guarda video ni audio. La contraseña se guarda cifrada, nunca en texto plano. Los usuarios anónimos o de prueba se eliminan.

Los datos se actualizan en cada heartbeat (12s) y al volver o cambiar de laptop/celular.

En internet (HTTPS) la IP pública, cámara, micrófono y geolocalización son más precisos que en localhost.

## Uso fuera del laboratorio

Prohibido. Solo dispositivos autorizados y fines formativos.
