# Sonido Vivo — Etapa 3 (React + API REST)

Vite + React (JavaScript) + react-router-dom + Bootstrap 5 + **axios**. Pruebas con Vitest y Testing Library.
Desde esta etapa los datos ya no viven en el navegador: la tienda consume la API Spring Boot `sonido-vivo-api`
(repositorio separado; en este repositorio está en `fase3/sonido-vivo-api`, ignorado por git).

```bash
npm install
npm run dev               # servidor de desarrollo (http://localhost:5173)
npm test                  # pruebas unitarias e integración con un servidor falso en memoria
npm run coverage          # pruebas + cobertura (reporte en ./coverage)
npm run test:integracion  # pruebas contra el backend REAL (debe estar levantado)
npm run build             # build de producción
```

Antes de `npm run dev`, levanta la API (ver su README). Sin base de datos instalada:

```bash
cd ../sonido-vivo-api
./mvnw spring-boot:run -Dspring-boot.run.profiles=h2
```

La URL de la API se configura con `VITE_API_URL` (copiar `.env.example` como `.env`). Por defecto: `http://localhost:8080/api/v1`.

## Estructura de `src/`

| Carpeta | Responsabilidad |
|---|---|
| `api/` | `cliente.js`: instancia de axios con interceptores (agrega `Authorization: Bearer <token>`, detecta sesión vencida) y `mensajeDeError`. Un servicio por recurso: `productos`, `categorias`, `usuarios`, `boletas`, `auth`, `reportes` |
| `hooks/` | `useColeccion`: carga asíncrona con estados `cargando` / `error` / `datos`, `recargar()` y `setDatos()` |
| `components/` | Piezas reutilizables (`ProductCard`, `CartTable`, `FormField`...), `EstadoCarga` (spinner / error con Reintentar) y `RequierePermiso` (protege rutas del panel por rol) |
| `pages/`, `pages/admin/` | Una vista por archivo, enrutadas en `App.jsx` |
| `layouts/` | `StoreLayout` (navbar + footer) y `AdminLayout` (sidebar filtrada por rol) |
| `context/` | Sesión (usuario + JWT en `sessionStorage`) y carrito (`localStorage`) |
| `data/` | Contenido estático: `portada.js` (fotos de la portada) y `blogs.js` |
| `utils/` | Funciones puras: validaciones, formularios, **roles y permisos**, regiones/comunas, formato, productos, cupones (vista previa) |
| `__tests__/` | Pruebas Vitest. `servidorFalso.js` imita la API; `integracion/` prueba contra la API real |

## Roles en la interfaz

| Rol | Ve |
|---|---|
| Visitante / Cliente | La tienda completa. Puede comprar **sin iniciar sesión** |
| Vendedor | Panel con solo **Productos** (lista y detalle, sin crear/editar/eliminar) y **Órdenes** (lista y detalle). Cualquier otra ruta del panel muestra "No tienes permisos" |
| Administrador | Todo el panel |

La interfaz solo oculta: quien autoriza es el backend (responde 401/403).

Cuentas de demostración: `maria.perez@gmail.com` / `admin123` (administradora), `carlos.munoz@duoc.cl` / `vend123` (vendedor) y `camila.rojas@gmail.com` / `cli123` (cliente).

Documentación del proyecto (ERS v3, manual de usuario, APIs e integración, `openapi.json`): carpeta `fase3/docs/`.

## Despliegue en AWS S3 (sitio web estático)

El frontend sigue siendo un sitio estático (solo se sube `dist/`), pero ahora necesita la URL pública de la API **al compilar**:

```powershell
$env:VITE_API_URL = "https://<dominio-de-la-api>/api/v1"
powershell -ExecutionPolicy Bypass -File aws/deploy-s3.ps1 -Bucket nombre-unico-del-bucket
```

En el backend hay que agregar la URL del sitio a `CORS_ORIGINS`. El resto del procedimiento (bucket, política pública `aws/bucket-policy.json`, documento de error `index.html`) es igual al de la Etapa 2. El endpoint de sitio web de S3 es solo HTTP; si la API está en HTTPS conviene servir el sitio con CloudFront para evitar contenido mixto.
