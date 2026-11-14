# Manual de Usuario — Tienda Sonido Vivo

Versión 3.0 · 06-11-2026 · DSY1104 Desarrollo Fullstack II · Evaluación Parcial 3

Este manual explica cómo usar la tienda online **Sonido Vivo** y su panel de administración, según el rol de cada persona:

| Rol | Qué puede hacer | Sección |
|---|---|---|
| Visitante (sin cuenta) | Ver el catálogo, armar el carrito y **comprar sin registrarse** | 2 |
| Cliente | Lo mismo, con sus datos autocompletados y sus compras guardadas en su cuenta | 2 |
| Vendedor | Ver productos y órdenes en el panel | 4 |
| Administrador | Todo: productos, categorías, usuarios, órdenes, reportes y perfil | 3 |

> **Cómo usar los recuadros de pantallazos.** Cada recuadro 📷 indica qué captura insertar en ese lugar (número, pantalla y qué debe verse). Al reemplazarlo por la imagen, conserva el número y el título como pie de figura.

---

## 1. Antes de empezar

### 1.1 Acceso
- **Tienda:** `http://localhost:5173` (o la dirección publicada por el equipo).
- **Navegadores:** Chrome, Edge, Firefox o Safari recientes, en computador, tablet o celular.
- La tienda necesita que el servidor (API) esté en funcionamiento. Si no lo está, las páginas muestran *"No se pudo conectar con el servidor…"* con un botón **Reintentar** (ver sección 6).

### 1.2 Cuentas de demostración

| Rol | Correo | Contraseña |
|---|---|---|
| Administrador | maria.perez@gmail.com | admin123 |
| Vendedor | carlos.munoz@duoc.cl | vend123 |
| Cliente | camila.rojas@gmail.com | cli123 |

### 1.3 Para el equipo: levantar el sistema
1. Backend: en `fase3/sonido-vivo-api`, ejecutar `mvnw.cmd spring-boot:run -Dspring-boot.run.profiles=h2` (sin base de datos instalada) o `mvnw.cmd spring-boot:run` con MySQL configurado.
2. Frontend: en `fase3/proyecto_Etapa3_REACT`, ejecutar `npm install` y luego `npm run dev`.
3. Abrir `http://localhost:5173`.

> 📷 **Pantallazo 01 — Sistema en funcionamiento.** *Dos terminales: la del backend mostrando "Started SonidoVivoApiApplication" y "Carga inicial: 51 productos", y la del frontend mostrando la URL `http://localhost:5173`.*

---

## 2. Tienda (visitantes y clientes)

### 2.1 Portada
La portada muestra el mensaje de la tienda, el botón **Explorar productos**, las **categorías** (cada tarjeta lleva a sus productos) y las **ofertas destacadas**. Mientras se cargan los datos aparece *"Cargando…"*.

> 📷 **Pantallazo 02 — Portada.** *Página de inicio completa: hero con "Hecho por músicos. Hecho para sonar.", la grilla "Explora las categorías" y las ofertas destacadas.*

En la barra superior están siempre: el **Carrito** (con la cantidad de unidades) e **Iniciar sesión** (o **Cerrar sesión** si ya entraste). En celular, el resto del menú se abre con el botón ☰.

> 📷 **Pantallazo 03 — Barra de navegación en celular.** *Vista móvil (ancho ≈ 375 px) con el menú ☰ abierto, mostrando Carrito e Iniciar sesión siempre visibles.*

### 2.2 Buscar y filtrar productos
1. Entra a **Productos**.
2. Escribe en el buscador: filtra al instante por nombre, marca, modelo o código.
3. Elige una categoría en la lista **Todas las categorías** para acotar.
4. Debajo se indica cuántos productos coinciden. Si no hay coincidencias verás *"No hay productos"*.

> 📷 **Pantallazo 04 — Catálogo con búsqueda.** *Página Productos con "yamaha" escrito en el buscador y el contador "N producto(s)".*

Las etiquetas de cada tarjeta indican: **Oferta** (precio normal tachado y precio rebajado), **Stock crítico** (quedan pocas unidades) y **Sin stock** (no se puede añadir).

### 2.3 Categorías y ofertas
- **Categorías:** elige una tarjeta para ver solo sus productos. La dirección de la página cambia (por ejemplo `/categorias/baterias`), así puedes compartir el enlace.
- **Ofertas:** lista todos los productos rebajados.

> 📷 **Pantallazo 05 — Categoría seleccionada.** *Página Categorías con "Baterías" marcada y sus productos debajo.*

### 2.4 Detalle de un producto
Haz clic en un producto para ver su foto, marca, modelo, descripción, precio y stock disponible. Elige la **Cantidad** (no puede superar el stock) y pulsa **Añadir al carrito**; aparecerá *"Se añadieron N unidad(es) al carrito."* y el contador de la barra subirá.

> 📷 **Pantallazo 06 — Detalle de producto.** *Ficha de "Guitarra Acústica Folk" con el precio de oferta, el selector de cantidad y el mensaje de confirmación verde.*

### 2.5 Carrito y cupones
En **Carrito** puedes:
- Subir o bajar cantidades con **+** y **−** (si llega a 0, el producto se quita).
- **Eliminar** un producto o **Limpiar carrito**.
- Aplicar un **cupón de descuento** en *¿Tienes un cupón?* → **Aplicar cupón**. Cupones vigentes: `SONIDOVIVO10` (10 %) y `BIENVENIDO5` (5 %). Si es válido verás *"Cupón aplicado correctamente."* y el descuento; si no, *"El cupón ingresado no es válido."*.

El carrito se guarda en tu navegador: no se pierde si recargas la página.

> 📷 **Pantallazo 07 — Carrito con cupón.** *Carrito con dos productos, el cupón SONIDOVIVO10 aplicado y el detalle subtotal / descuento / total.*

Pulsa **Ir a pagar** para continuar.

### 2.6 Comprar (checkout)
**No necesitas una cuenta para comprar.** Si no iniciaste sesión verás el aviso *"Puedes comprar sin cuenta. Inicia sesión para guardar la compra en tu historial."*.

1. Completa **Datos del cliente** (nombre, apellidos, correo) y **Dirección de entrega** (calle, departamento opcional, región, comuna e indicaciones opcionales). Si iniciaste sesión, estos datos ya vienen completados.
2. Revisa el **Resumen de la compra** a la derecha.
3. Pulsa **Pagar ahora**. El botón cambia a *"Procesando pago…"* mientras el servidor confirma la compra.

> 📷 **Pantallazo 08 — Checkout como invitado.** *Formulario de checkout sin sesión, con el aviso "Puedes comprar sin cuenta" y el resumen a la derecha.*

> 📷 **Pantallazo 09 — Checkout con sesión.** *Mismo formulario con la sesión de Camila iniciada: datos ya completados.*

**Si algún dato está mal**, el campo se marca en rojo con una explicación y no se envía nada.
**Si un producto ya no tiene stock suficiente**, verás por ejemplo *"No hay stock suficiente de "Guitarra Acústica Folk" (disponible: 1)."*; tu carrito se conserva para que ajustes la cantidad.

> 📷 **Pantallazo 10 — Error de stock.** *Checkout mostrando el aviso rojo de stock insuficiente.*

### 2.7 Confirmación de la compra
Si el pago se realiza verás *"Se ha realizado la compra nro #N"*, la fecha, los datos de entrega y el detalle con los montos finales. Puedes:
- **Imprimir boleta** (abre la impresión del navegador sin menús ni botones).
- **Enviar por email** (demostración: confirma el envío al correo indicado).
- **Seguir comprando**.

El carrito queda vacío.

> 📷 **Pantallazo 11 — Compra realizada.** *Página "Se ha realizado la compra nro #…" con el resumen y los tres botones.*

> 📷 **Pantallazo 12 — Boleta impresa.** *Vista previa de impresión de la boleta (sin barra de navegación).*

**Pago con error (demostración):** marca *"Simular error de pago"* antes de pagar para ver la pantalla *"No se pudo realizar el pago"*; tu carrito se conserva y puedes pulsar **Volver a realizar el pago**.

> 📷 **Pantallazo 13 — Pago con error.** *Pantalla "No se pudo realizar el pago" con el botón "Volver a realizar el pago".*

### 2.8 Crear una cuenta
1. Pulsa **Registrarse** en la barra.
2. Completa RUN (sin puntos y con guion, ej. `12345678-5`), correo (`@duoc.cl`, `@profesor.duoc.cl` o `@gmail.com`), nombre, apellidos, región, comuna (se habilita al elegir la región), dirección y contraseña (4 a 10 caracteres) dos veces.
3. Pulsa **Crear cuenta**. Quedarás con la sesión iniciada como cliente.

Los errores aparecen mientras escribes. Si el RUN o el correo ya están registrados verás *"Ya existe un usuario con ese RUN."* o *"Ya existe un usuario con ese correo."*.

> 📷 **Pantallazo 14 — Registro con errores.** *Formulario de registro con un RUN inválido y un correo @hotmail.com marcados en rojo.*

### 2.9 Iniciar y cerrar sesión
1. Pulsa **Iniciar sesión**, escribe correo y contraseña y pulsa **Ingresar**.
2. Según tu rol: el cliente vuelve a la tienda (su nombre aparece en la barra), el administrador entra al **Dashboard** y el vendedor a **Productos** del panel.
3. Si los datos no coinciden verás *"Correo o contraseña incorrectos."*.
4. Para salir, pulsa **Cerrar sesión**.

Por seguridad, la sesión se cierra sola al cerrar la pestaña o después de 2 horas; en ese caso verás *"Tu sesión expiró. Vuelve a iniciar sesión."*.

> 📷 **Pantallazo 15 — Inicio de sesión.** *Formulario de login con el mensaje "Correo o contraseña incorrectos."*

> 📷 **Pantallazo 16 — Cliente con sesión.** *Barra de navegación con el nombre "Camila" y el botón "Cerrar sesión".*

### 2.10 Blogs, Nosotros y Contacto
- **Blogs:** artículos sobre instrumentos; cada uno enlaza a la categoría relacionada.
- **Nosotros:** historia y equipo de la tienda.
- **Contacto:** nombre y comentario (máx. 500 caracteres, con contador) son obligatorios; el correo es opcional. Al enviar verás la confirmación.

> 📷 **Pantallazo 17 — Contacto.** *Formulario de contacto con el contador de caracteres y el mensaje de envío confirmado.*

---

## 3. Panel de administración (Administrador)

Inicia sesión con una cuenta de administrador. También puedes entrar desde el botón **Admin** de la barra. El menú lateral tiene: Dashboard, Órdenes / Boletas, Productos, Productos críticos, Categorías, Usuarios, Reportes, Perfil y Volver a la tienda.

### 3.1 Dashboard
Muestra la cantidad de **compras** y el total vendido, la cantidad de **productos** y cuántos están en stock crítico, y la cantidad de **usuarios**, con accesos rápidos a las tareas más comunes.

> 📷 **Pantallazo 18 — Dashboard.** *Panel del administrador con las tres tarjetas de métricas, los accesos rápidos y el menú lateral completo.*

### 3.2 Órdenes / Boletas
La lista muestra las compras de la más reciente a la más antigua: número, fecha, cliente (con la etiqueta **Invitado** si se compró sin cuenta), estado y total. **Ver boleta** abre el detalle, que se puede imprimir.

> 📷 **Pantallazo 19 — Lista de órdenes.** *Tabla de órdenes con al menos una compra "Invitado".*

> 📷 **Pantallazo 20 — Detalle de boleta.** *Boleta #N con cliente, dirección de entrega, detalle de productos, descuento y total.*

### 3.3 Productos
- **Buscar:** escribe en el buscador sobre la tabla.
- **Ver:** ficha de solo lectura del producto.
- **Nuevo producto:** completa código (3 a 20 caracteres, único), nombre, categoría, precio y stock (números enteros, sin puntos), y opcionalmente marca, modelo, descripción, URL de imagen y stock crítico (si lo dejas vacío se usa 3). Si marcas **Producto en oferta**, indica el precio de oferta (no puede ser mayor al precio normal). Pulsa **Crear producto**.
- **Editar:** el código no se puede cambiar. Pulsa **Guardar cambios**.
- **Eliminar:** pulsa **Eliminar** y confirma con **Sí**. Un producto que ya se vendió no se puede eliminar (*"…tiene ventas registradas. Puedes dejar su stock en 0."*).

> 📷 **Pantallazo 21 — Lista de productos (administrador).** *Tabla con los botones Ver, Editar y Eliminar, y el botón "Nuevo producto".*

> 📷 **Pantallazo 22 — Nuevo producto.** *Formulario con "Producto en oferta" marcado y el campo de precio de oferta visible.*

> 📷 **Pantallazo 23 — Confirmar eliminación.** *Fila de un producto con la confirmación "¿Eliminar? Sí / No".*

### 3.4 Productos críticos
Lista los productos cuyo stock es menor o igual a su stock crítico, para reponerlos (usa **Editar** para actualizar el stock).

> 📷 **Pantallazo 24 — Productos críticos.** *Tabla con las etiquetas "Stock crítico".*

### 3.5 Categorías
- **Nueva categoría:** nombre (máx. 50, no repetido) y descripción opcional.
- **Editar:** al cambiar el nombre, los productos de la categoría muestran el nombre nuevo automáticamente.
- **Eliminar:** solo si la categoría no tiene productos; si los tiene verás *"No se puede eliminar "…" porque tiene productos asociados."*.

> 📷 **Pantallazo 25 — Categorías.** *Tabla de categorías con la columna "Productos" y el aviso rojo al intentar eliminar una con productos.*

### 3.6 Usuarios
- **Nuevo usuario:** RUN, nombre, apellidos, correo, **tipo de usuario** (Administrador, Vendedor o Cliente), fecha de nacimiento (opcional), región, comuna, dirección y contraseña.
- **Editar:** el RUN no se puede cambiar. Si dejas **Nueva contraseña** vacía, se conserva la actual.
- **Historial:** muestra las compras de ese usuario con enlace a cada boleta.
- **Eliminar:** no puedes eliminar tu propia cuenta mientras tienes la sesión iniciada. Las boletas de un usuario eliminado se conservan.

> 📷 **Pantallazo 26 — Usuarios.** *Tabla de usuarios con los botones Historial, Editar y Eliminar.*

> 📷 **Pantallazo 27 — Historial de compras.** *Historial de Camila Rojas con sus boletas.*

### 3.7 Reportes
Muestra el total vendido y la cantidad de compras, el ticket promedio, las unidades en stock, los 5 productos más vendidos y las ventas por categoría.

> 📷 **Pantallazo 28 — Reportes.** *Página de reportes con las tarjetas y las dos tablas, después de realizar algunas compras.*

### 3.8 Perfil
Permite editar tus propios datos (nombre, apellidos, fecha de nacimiento, región, comuna, dirección y contraseña). RUN, correo y tipo de usuario aparecen bloqueados.

> 📷 **Pantallazo 29 — Mi perfil.** *Formulario de perfil con RUN, correo y tipo de usuario deshabilitados y el mensaje "Perfil actualizado correctamente."*

---

## 4. Panel del Vendedor

El vendedor solo puede **consultar productos y órdenes**. Al iniciar sesión entra directamente a **Productos**, y su menú lateral muestra únicamente:

- **Órdenes / Boletas:** lista de compras y detalle de cada boleta (igual que en 3.2, incluida la impresión).
- **Productos:** lista con buscador y botón **Ver** para la ficha de cada producto. No aparecen los botones Nuevo producto, Editar ni Eliminar.

Si un vendedor escribe a mano la dirección de otra sección del panel (por ejemplo `/admin/usuarios`), verá *"No tienes permisos para ver esta sección."* con un botón para volver.

> 📷 **Pantallazo 30 — Menú del vendedor.** *Panel con la sesión de Carlos (Vendedor): el menú lateral solo con "Órdenes / Boletas", "Productos" y "Volver a la tienda".*

> 📷 **Pantallazo 31 — Productos (vendedor).** *Lista de productos con solo el botón "Ver" en cada fila.*

> 📷 **Pantallazo 32 — Ficha de producto (vendedor).** *Detalle de un producto en el panel, sin botón Editar.*

> 📷 **Pantallazo 33 — Acceso no permitido.** *Vendedor en `/admin/usuarios` viendo "No tienes permisos para ver esta sección."*

---

## 5. Documentación de la API (equipo técnico)

Con el backend en funcionamiento, la documentación interactiva está en `http://localhost:8080/swagger-ui.html`:

1. Abre **Autenticación → POST /api/v1/auth/login**, pulsa **Try it out**, escribe correo y contraseña y pulsa **Execute**.
2. Copia el valor de `token` de la respuesta.
3. Pulsa **Authorize** (arriba a la derecha), pega el token y confirma.
4. Ahora puedes probar los endpoints protegidos según el rol de esa cuenta.

> 📷 **Pantallazo 34 — Swagger UI.** *Página de Swagger con las secciones Autenticación, Boletas, Categorías, Productos, Reportes y Usuarios.*

> 📷 **Pantallazo 35 — Probar un endpoint.** *POST /api/v1/boletas ejecutado en Swagger con la respuesta 201.*

El detalle de cada endpoint está en el documento **APIs e Integración**.

---

## 6. Mensajes frecuentes y qué hacer

| Mensaje | Qué significa | Qué hacer |
|---|---|---|
| *Cargando…* | La página está pidiendo los datos al servidor | Esperar unos segundos |
| *No se pudo conectar con el servidor. Revisa tu conexión o que la API esté en ejecución.* | El servidor no responde | Revisar la conexión o avisar al equipo; luego pulsar **Reintentar** |
| *Correo o contraseña incorrectos.* | Los datos de acceso no coinciden | Revisar mayúsculas y el correo completo |
| *Tu sesión expiró. Vuelve a iniciar sesión.* | Pasaron más de 2 horas o se cerró la pestaña | Iniciar sesión otra vez |
| *No tienes permisos para ver esta sección.* | Tu rol no tiene acceso a esa parte del panel | Usar las secciones del menú lateral |
| *No hay stock suficiente de "…" (disponible: N).* | Otra persona compró antes o el stock cambió | Bajar la cantidad en el carrito |
| *El cupón "…" no es válido.* | El cupón no existe | Revisar el código o quitar el cupón |
| *Ya existe un usuario con ese correo / RUN.* | La cuenta ya está registrada | Iniciar sesión o usar otros datos |
| *No se puede eliminar … porque tiene productos asociados.* | La categoría aún tiene productos | Mover o eliminar esos productos primero |
| *No se puede eliminar el producto porque tiene ventas registradas.* | El producto aparece en boletas | Dejar su stock en 0 |
| *No puedes eliminar tu propio usuario…* | Intentaste borrar la cuenta con la que entraste | Pedirlo a otro administrador |

> 📷 **Pantallazo 36 — Servidor sin conexión.** *Página Productos con el aviso rojo de conexión y el botón "Reintentar".*
