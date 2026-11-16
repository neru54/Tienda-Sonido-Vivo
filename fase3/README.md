# Etapa 3 — Integración frontend + backend

| Carpeta | Contenido |
|---|---|
| `proyecto_Etapa3_REACT/` | Frontend React (copia de la Etapa 2 migrada a axios): servicios por recurso, `useColeccion`, sesión con JWT, permisos por rol |
| `backend-microservicios/` | Backend de microservicios Spring Boot 3: usuarios, catálogo y pedidos + API Gateway + `common`, MySQL con 3 esquemas, Spring Security/JWT y Swagger. **Repositorio Git propio** |
| `../docs/Fase3/` | Documentación (raíz del repositorio): ERS v3.1, APIs e Integración, Manual de Usuario, Mapa de la rúbrica, OpenAPI y evidencias |

## Ejecutar

```powershell
# Backend (sin instalar MySQL: H2 con los datos de demostración)
cd backend-microservicios
.\mvnw.cmd -DskipTests package
powershell -ExecutionPolicy Bypass -File scripts\iniciar-h2.ps1   # Gateway en http://localhost:8080
# Swagger: http://localhost:8080/swagger-ui.html

# Frontend
cd ..\proyecto_Etapa3_REACT
npm install
npm run dev                                                       # http://localhost:5173
```

Para MySQL o Docker, ver `backend-microservicios/README.md`.

## Pruebas

| Comando | Dónde | Resultado |
|---|---|---|
| `.\mvnw.cmd clean verify` | `backend-microservicios` | 45 pruebas (JUnit 5, Mockito, MockMvc) + JaCoCo |
| `npm test` / `npm run coverage` | `proyecto_Etapa3_REACT` | 192 pruebas (Vitest), 99 % de líneas |
| `npm run test:integracion` | `proyecto_Etapa3_REACT`, con el backend levantado | 6 pruebas frontend ↔ API real |

Cuentas de demostración: `maria.perez@gmail.com` / `admin123` (Administrador), `carlos.munoz@duoc.cl` / `vend123` (Vendedor), `camila.rojas@gmail.com` / `cli123` (Cliente).
