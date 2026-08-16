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

## Arranque

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

## Qué se guarda (y qué no)

Solo cuentas con correo y contraseña. Se actualiza: hora, IP, dispositivo, navegador y permisos reales del navegador.

No se guarda video ni audio. La contraseña se guarda cifrada, nunca en texto plano. Los usuarios anónimos o de prueba se eliminan.

Los datos se actualizan en cada heartbeat (12s) y al volver o cambiar de laptop/celular.

## Uso fuera del laboratorio

Prohibido. Solo dispositivos autorizados y fines formativos.
