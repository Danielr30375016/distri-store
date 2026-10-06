# DistriStore

Tienda en línea para una ferretería, construida con **Next.js 16 (App Router)**, **Prisma ORM** y **PostgreSQL**. Incluye catálogo de productos, panel de administración, carrito de compras, checkout como invitado con recálculo de precios en servidor, y una pasarela de pago **Wompi** (Colombia) lista para activarse.

## Stack

- **Next.js 16** (App Router, Turbopack) + **React 19** + **TypeScript**
- **Tailwind CSS 4**
- **Prisma 7** sobre **PostgreSQL** (`@prisma/adapter-pg`)
- **Vercel Blob** para almacenamiento de imágenes
- **Wompi** (Web Checkout hospedado) para pagos en línea
- **Resend** para notificaciones por correo
- Autenticación de administrador: `bcryptjs` + sesiones firmadas con `jose`
- Validación de datos con `zod`
- Hosting objetivo: **Vercel**

## Requisitos previos

- Node.js 20+
- Una base de datos PostgreSQL (se usa [Prisma Postgres](https://www.prisma.io/postgres) / Vercel Postgres en este proyecto)

## Configuración local

1. Instala dependencias:
   ```bash
   npm install
   ```
2. Copia `.env.example` a `.env.local` y completa los valores (ver sección de variables de entorno abajo).
3. Aplica las migraciones de base de datos:
   ```bash
   npx prisma migrate deploy
   ```
4. (Opcional) Carga datos de ejemplo:
   ```bash
   npm run db:seed
   ```
5. Levanta el servidor de desarrollo:
   ```bash
   npm run dev
   ```
   Abre [http://localhost:3000](http://localhost:3000).

## Variables de entorno

Ver `.env.example` para la lista completa. Resumen:

| Variable | Descripción |
|---|---|
| `DATABASE_URL` | Cadena de conexión a PostgreSQL. Debe incluir `sslmode=require` (o `verify-full`) — nunca se desactiva la verificación del certificado. |
| `ADMIN_PASSWORD_HASH` | Hash **bcrypt** de la contraseña de administrador (nunca la contraseña en texto plano). Generarlo con `node -e "console.log(require('bcryptjs').hashSync('tu-contraseña', 12))"`. |
| `SESSION_SECRET` | Cadena aleatoria larga usada para firmar las sesiones de admin (`openssl rand -hex 32`). |
| `BLOB_READ_WRITE_TOKEN` | Token de Vercel Blob para subir imágenes de productos. |
| `NEXT_PUBLIC_WOMPI_PUBLIC_KEY` | Llave pública de Wompi (sandbox o producción). |
| `WOMPI_INTEGRITY_SECRET` | Secreto de integridad de Wompi, usado para firmar el checkout. |
| `WOMPI_EVENTS_SECRET` | Secreto de eventos de Wompi, usado para verificar el webhook de confirmación de pago. |
| `RESEND_API_KEY` | API key de [Resend](https://resend.com) para enviar correos de confirmación. |
| `ORDER_NOTIFICATIONS_FROM_EMAIL` | Correo remitente de las notificaciones de pedidos. |
| `NEXT_PUBLIC_SITE_URL` | URL pública del sitio (usada en la redirección de pago y en los correos). |

**Nunca** subas `.env` ni `.env.local` al repositorio — ya están excluidos en `.gitignore`.

## Arquitectura

```
app/
  (admin)/            Panel de administración (protegido por proxy.ts)
  (store)/             Tienda pública: catálogo, carrito, checkout, estado de pedido
  api/
    admin/             Login/logout de admin
    products, banners, brands, categories, subcategories, upload   -> CRUD del catálogo (mutaciones protegidas)
    checkout/          Crea el pedido, recalcula precios/stock en servidor, arma la URL de pago Wompi
    orders/[id]/       Consulta de estado de un pedido
    webhooks/wompi/    Recibe la confirmación de pago de Wompi y actualiza el pedido
lib/
  auth.ts              Sesiones de admin (bcrypt + jose) y rate limiting de login
  validation.ts        Esquemas zod de todas las entradas de la API
  orders.ts            Lógica de creación/actualización de pedidos
  wompi.ts             Firma de integridad y verificación de webhooks de Wompi
  email.ts             Envío de notificaciones (Resend)
  db.ts                Cliente Prisma
prisma/
  schema.prisma        Modelos: Product, Banner, Brand, Category, Subcategory, Order, OrderItem, LoginAttempt
```

### Flujo de compra

El checkout es **de invitado**: el cliente no necesita crear una cuenta. Completa nombre, teléfono, correo y dirección; el servidor:

1. Recalcula el total y valida el stock **contra la base de datos** (nunca confía en el precio que envía el navegador).
2. Crea un `Order` con estado `PENDING` y descuenta el stock.
3. Envía un correo de confirmación al cliente (si `RESEND_API_KEY` está configurada).
4. Si Wompi está configurado, redirige al cliente al Web Checkout hospedado de Wompi.
5. Wompi notifica el resultado del pago a `/api/webhooks/wompi` (firma verificada); el pedido pasa a `PAID` o `FAILED` y se envían las notificaciones correspondientes al cliente y al admin.

El botón "Finalizar por WhatsApp" se mantiene como canal manual alternativo.

## Activar Wompi

1. Crea una cuenta de comercio en [comercios.wompi.co](https://comercios.wompi.co) y genera tus llaves de **sandbox** primero.
2. Copia `public key`, `integrity secret` y `events secret` a tu `.env.local`.
3. Configura la URL del webhook en el panel de Wompi apuntando a `https://tu-dominio/api/webhooks/wompi`.
4. Prueba una compra completa en sandbox con las [tarjetas de prueba de Wompi](https://docs.wompi.co/docs/colombia/pruebas-vs-produccion/).
5. Cuando todo funcione, reemplaza las llaves por las de producción.

## Activar notificaciones por correo

1. Crea una cuenta en [resend.com](https://resend.com) y verifica tu dominio de envío.
2. Copia el API key a `RESEND_API_KEY` y define `ORDER_NOTIFICATIONS_FROM_EMAIL` con un correo de ese dominio.

## Seguridad aplicada

- Autenticación de admin con hash bcrypt (no SHA-256), sesión firmada con expiración (JWT vía `jose`), y bloqueo tras 5 intentos fallidos de login (15 min).
- Validación de esquemas (`zod`) en todas las rutas API que reciben datos.
- Cabeceras de seguridad (CSP, HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy) configuradas en `next.config.ts`.
- Conexión a PostgreSQL con verificación de certificado TLS activa (`sslmode=require`/`verify-full`, sin `rejectUnauthorized: false`).
- El total de una compra siempre se calcula en el servidor a partir del precio real en base de datos.
- Los datos de tarjeta nunca pasan por este servidor: Wompi los maneja directamente en su Web Checkout.

### Pendiente / recomendado a futuro

- Pruebas automatizadas (no hay suite de tests todavía).
- Rotar las credenciales que estuvieron en `.env`/`.env.local` en texto plano antes de esta migración (contraseña de admin, connection string, token de Vercel Blob), como buena práctica preventiva.
- Considerar 2FA o múltiples cuentas de administrador si el equipo crece.

## Despliegue

Pensado para desplegarse en [Vercel](https://vercel.com):

1. Conecta el repositorio en Vercel.
2. Configura todas las variables de entorno del `.env.example` en el panel de Vercel (Production y Preview).
3. Vercel ejecuta `prisma generate` automáticamente vía el script `postinstall`.
4. Aplica las migraciones (`npx prisma migrate deploy`) contra la base de producción antes o durante el primer despliegue.
