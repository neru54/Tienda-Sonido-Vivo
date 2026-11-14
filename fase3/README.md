# Etapa 3 — Integración frontend + backend

| Carpeta | Contenido |
|---|---|
| `proyecto_Etapa3_REACT/` | Frontend React (copia de la Etapa 2 migrada a axios): servicios por recurso, `useColeccion`, sesión con JWT, permisos por rol |
| `sonido-vivo-api/` | Backend Spring Boot 3 + MySQL + Spring Security/JWT + Swagger. **Repositorio Git propio** (ignorado por este repositorio) |
| `docs/` | `ERS_v3.md`, `Manual_de_Usuario.md`, `APIs_e_Integracion.md` y `openapi.json` |

## Ejecutar

```bash
# Backend (sin instalar MySQL: base H2 en memoria con los datos de demostración)
cd sonido-vivo-api
./mvnw spring-boot:run -Dspring-boot.run.profiles=h2      # Windows: mvnw.cmd ...
# Swagger: http://localhost:8080/swagger-ui.html

# Frontend
cd proyecto_Etapa3_REACT
npm install
npm run dev                                               # http://localhost:5173
```

Base de datos MySQL (local o en la nube): definir `DB_URL`, `DB_USER` y `DB_PASSWORD` y arrancar el backend sin el perfil `h2`. Ver `sonido-vivo-api/README.md`.

## Pruebas

| Comando | Dónde | Resultado |
|---|---|---|
| `./mvnw test` | `sonido-vivo-api` | 76 pruebas (JUnit 5, Mockito, MockMvc) |
| `npm test` / `npm run coverage` | `proyecto_Etapa3_REACT` | 190 pruebas (Vitest), 99 % de líneas |
| `npm run test:integracion` | `proyecto_Etapa3_REACT`, con el backend levantado | 6 pruebas frontend ↔ API real |

Cuentas de demostración: `maria.perez@gmail.com` / `admin123` (Administrador), `carlos.munoz@duoc.cl` / `vend123` (Vendedor), `camila.rojas@gmail.com` / `cli123` (Cliente).
