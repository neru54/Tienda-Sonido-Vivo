import { renderHook, act, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { CartProvider, carritoReducer, calcularTotal, useCart } from '../context/CartContext'
import { SessionProvider, useSession } from '../context/SessionContext'
import { CLIENTE, cargarCarrito, iniciarSesionComo, renderApp } from './helpers'
import { PRODUCTOS } from './semilla'
import { servidor } from './servidorFalso'

const cuerdas = { codigo: 'AC001', nombre: 'Cuerdas', precio: 5000, imagen: '' }

describe('Reducer del carrito (lógica pura)', () => {
  it('agregar suma la cantidad si el producto ya existe', () => {
    let items = carritoReducer([], { tipo: 'agregar', producto: cuerdas, cantidad: 1 })
    items = carritoReducer(items, { tipo: 'agregar', producto: cuerdas, cantidad: 2 })
    expect(items).toHaveLength(1)
    expect(items[0].cantidad).toBe(3)
    expect(calcularTotal(items)).toBe(15000)
  })

  it('cambiarCantidad a 0 elimina el ítem; quitar y vaciar también', () => {
    const base = [{ ...cuerdas, cantidad: 2 }, { ...cuerdas, codigo: 'B', cantidad: 1 }]
    expect(carritoReducer(base, { tipo: 'cambiarCantidad', codigo: 'AC001', cantidad: 0 })).toHaveLength(1)
    expect(carritoReducer(base, { tipo: 'quitar', codigo: 'B' })).toHaveLength(1)
    expect(carritoReducer(base, { tipo: 'vaciar' })).toEqual([])
    expect(carritoReducer(base, { tipo: 'desconocida' })).toBe(base)
  })
})

describe('Contextos y hooks', () => {
  it('useCart / useSession fuera de su Provider lanzan error', () => {
    expect(() => renderHook(() => useCart())).toThrow(/CartProvider/)
    expect(() => renderHook(() => useSession())).toThrow(/SessionProvider/)
  })

  it('CartProvider persiste el carrito en localStorage', () => {
    const { result } = renderHook(() => useCart(), { wrapper: CartProvider })
    act(() => result.current.agregar(cuerdas, 2))
    expect(result.current.cantidadTotal).toBe(2)
    expect(JSON.parse(localStorage.getItem('sonidoVivoCarrito'))[0].cantidad).toBe(2)
  })

  it('CartProvider ignora un carrito corrupto en localStorage', () => {
    localStorage.setItem('sonidoVivoCarrito', '{roto')
    const { result } = renderHook(() => useCart(), { wrapper: CartProvider })
    expect(result.current.items).toEqual([])
  })

  it('SessionProvider guarda token y usuario en sessionStorage (sin contraseña) y los borra al cerrar', () => {
    const { result } = renderHook(() => useSession(), { wrapper: SessionProvider })
    act(() => result.current.iniciarSesion({ token: 'abc.def.ghi', usuario: { run: '1', nombre: 'Ana', tipoUsuario: 'Administrador', password: 'secreta' } }))
    expect(result.current.usuario).toMatchObject({ nombre: 'Ana', tipoUsuario: 'Administrador' })
    expect(sessionStorage.getItem('sonidoVivoToken')).toBe('abc.def.ghi')
    expect(sessionStorage.getItem('sonidoVivoSesion')).not.toContain('secreta')
    expect(localStorage.getItem('sonidoVivoSesion')).toBeNull() // ya no se usa localStorage para la sesión
    act(() => result.current.cerrarSesion())
    expect(result.current.usuario).toBeNull()
    expect(sessionStorage.getItem('sonidoVivoToken')).toBeNull()
  })

  it('el carrito cobra el precio de oferta cuando el producto está en oferta', () => {
    const enOferta = { ...cuerdas, precio: 5000, oferta: true, precioOferta: 4000 }
    const items = carritoReducer([], { tipo: 'agregar', producto: enOferta, cantidad: 2 })
    expect(items[0].precio).toBe(4000)
    expect(calcularTotal(items)).toBe(8000)
  })
})

describe('Páginas de la tienda (datos desde la API)', () => {
  it('Productos muestra "Cargando…" y luego el catálogo pedido a GET /productos', async () => {
    renderApp('/productos')
    expect(screen.getByRole('status')).toHaveTextContent('Cargando')
    expect(await screen.findByText(`${PRODUCTOS.length} producto(s)`)).toBeInTheDocument()
    expect(servidor.peticiones.some((p) => p.metodo === 'get' && p.url === '/productos')).toBe(true)
  })

  it('si la API no responde se muestra el error y "Reintentar" vuelve a pedir los datos', async () => {
    servidor.caerse()
    renderApp('/ofertas')
    expect(await screen.findByText(/No se pudo conectar con el servidor/)).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Reintentar' }))
    expect(await screen.findAllByText('Oferta')).toHaveLength(PRODUCTOS.filter((p) => p.oferta).length)
  })

  it('añadir al carrito desde Productos actualiza el contador del navbar', async () => {
    renderApp('/productos')
    expect(screen.getByTestId('contador-carrito')).toHaveTextContent('0')
    await userEvent.click((await screen.findAllByRole('button', { name: 'Añadir al carrito' }))[0])
    expect(screen.getByTestId('contador-carrito')).toHaveTextContent('1')
  })

  it('la búsqueda reduce la lista de productos', async () => {
    renderApp('/productos')
    const esperado = PRODUCTOS.filter((p) => JSON.stringify([p.nombre, p.marca, p.modelo, p.codigo]).toLowerCase().includes('yamaha')).length
    expect(await screen.findByText(`${PRODUCTOS.length} producto(s)`)).toBeInTheDocument()
    await userEvent.type(screen.getByRole('searchbox'), 'yamaha')
    expect(screen.getByText(`${esperado} producto(s)`)).toBeInTheDocument()
    expect(esperado).toBeLessThan(PRODUCTOS.length)
  })

  it('una búsqueda sin resultados muestra "No hay productos"', async () => {
    renderApp('/productos')
    await screen.findByText(`${PRODUCTOS.length} producto(s)`)
    await userEvent.type(screen.getByRole('searchbox'), 'zzzzzz')
    expect(screen.getByText('No hay productos')).toBeInTheDocument()
  })

  it('el filtro por categoría muestra solo esa categoría', async () => {
    renderApp('/productos')
    await screen.findByText(`${PRODUCTOS.length} producto(s)`)
    await userEvent.selectOptions(screen.getByLabelText('Filtrar por categoría'), 'Baterías')
    const esperado = PRODUCTOS.filter((p) => p.categoria === 'Baterías').length
    expect(screen.getByText(`${esperado} producto(s)`)).toBeInTheDocument()
  })

  it('Categorías: elegir una categoría por URL pide GET /productos?categoria=:id y muestra sus productos', async () => {
    renderApp('/categorias/baterias')
    expect(await screen.findByText('Batería Acústica 5 piezas')).toBeInTheDocument()
    expect(screen.getAllByRole('heading', { name: 'Baterías' })).toHaveLength(2) // tarjeta + título de la sección
  })

  it('Categorías: una categoría inexistente avisa', async () => {
    renderApp('/categorias/no-existe')
    expect(await screen.findByText('La categoría solicitada no existe.')).toBeInTheDocument()
  })

  it('Ofertas muestra solo productos en oferta', async () => {
    renderApp('/ofertas')
    expect(await screen.findAllByText('Oferta')).toHaveLength(PRODUCTOS.filter((p) => p.oferta).length)
  })

  it('DetalleProducto: añade la cantidad elegida y confirma', async () => {
    renderApp('/productos/GA001')
    const cantidad = await screen.findByLabelText('Cantidad')
    await userEvent.tripleClick(cantidad) // selecciona el 1 y lo reemplaza
    await userEvent.keyboard('3')
    await userEvent.click(screen.getByRole('button', { name: 'Añadir al carrito' }))
    expect(screen.getByText(/Se añadieron 3 unidad/)).toBeInTheDocument()
    expect(screen.getByTestId('contador-carrito')).toHaveTextContent('3')
  })

  it('DetalleProducto con código inexistente avisa (404 de la API)', async () => {
    renderApp('/productos/NOEXISTE')
    expect(await screen.findByText('No se encontró el producto solicitado.')).toBeInTheDocument()
  })

  it('DetalleProducto con error del servidor muestra el mensaje del backend', async () => {
    servidor.responderCon(500, 'Ocurrió un error inesperado. Inténtalo nuevamente.')
    renderApp('/productos/GA001')
    expect(await screen.findByText('Ocurrió un error inesperado. Inténtalo nuevamente.')).toBeInTheDocument()
  })

  it('Carrito: la cantidad sube y baja y el total se recalcula; en 0 se elimina', async () => {
    cargarCarrito([{ codigo: 'AC001', nombre: 'Cuerdas', precio: 5000, imagen: '', cantidad: 2 }])
    renderApp('/carrito')
    expect(screen.getByTestId('total-carrito')).toHaveTextContent('$10.000')
    await userEvent.click(screen.getByRole('button', { name: 'Aumentar Cuerdas' }))
    expect(screen.getByTestId('cantidad-AC001')).toHaveTextContent('3')
    expect(screen.getByTestId('total-carrito')).toHaveTextContent('$15.000')
    await userEvent.click(screen.getByRole('button', { name: 'Disminuir Cuerdas' }))
    await userEvent.click(screen.getByRole('button', { name: 'Disminuir Cuerdas' }))
    await userEvent.click(screen.getByRole('button', { name: 'Disminuir Cuerdas' }))
    expect(screen.getByText('Tu carrito está vacío')).toBeInTheDocument()
  })

  it('Carrito: "Limpiar carrito" vacía todo', async () => {
    cargarCarrito([{ codigo: 'AC001', nombre: 'Cuerdas', precio: 5000, imagen: '', cantidad: 1 }])
    renderApp('/carrito')
    await userEvent.click(screen.getByRole('button', { name: 'Limpiar carrito' }))
    expect(screen.getByText('Tu carrito está vacío')).toBeInTheDocument()
  })

  it('Checkout con el carrito vacío no permite pagar', () => {
    renderApp('/checkout')
    expect(screen.getByText(/no hay nada que pagar/)).toBeInTheDocument()
  })

  it('Blogs: lista ambos artículos y el detalle muestra su contenido (contenido estático)', async () => {
    renderApp('/blogs')
    expect(screen.getAllByRole('link', { name: 'Ver caso' })).toHaveLength(2)
    await userEvent.click(screen.getAllByRole('link', { name: 'Ver caso' })[0])
    expect(screen.getByRole('heading', { name: /Fender/ })).toBeInTheDocument()
  })

  it('DetalleBlog con id inexistente avisa', () => {
    renderApp('/blogs/99')
    expect(screen.getByText('No se encontró el artículo.')).toBeInTheDocument()
  })

  it('Home muestra las 10 categorías con foto y lema, enlazadas a su página', async () => {
    renderApp('/')
    expect(await screen.findByRole('heading', { name: 'Explora las categorías' })).toBeInTheDocument()
    const bateria = screen.getByRole('link', { name: /Baterías\s*Marca el ritmo/ })
    expect(bateria).toHaveAttribute('href', '/categorias/baterias')
    expect(bateria.querySelector('img')).toHaveAttribute('src', '/img/portada/baterias.jpg')
    expect(document.querySelectorAll('.sv-cat-card img')).toHaveLength(10)
    expect(screen.getByRole('link', { name: 'Explorar productos' })).toHaveAttribute('href', '/productos')
  })

  it('Home, Nosotros y NotFound se renderizan', async () => {
    const { unmount } = renderApp('/')
    expect(screen.getByRole('heading', { level: 1, name: /Hecho por músicos\.\s*Hecho para sonar\./ })).toBeInTheDocument()
    await screen.findByRole('heading', { name: 'Explora las categorías' })
    unmount()
    const nosotros = renderApp('/nosotros')
    expect(screen.getByText(/Once años/)).toBeInTheDocument()
    nosotros.unmount()
    renderApp('/ruta/inventada')
    expect(screen.getByText('404')).toBeInTheDocument()
  })
})

describe('Login (POST /auth/login)', () => {
  async function ingresar(correo, password) {
    await userEvent.type(screen.getByLabelText('Correo'), correo)
    await userEvent.type(screen.getByLabelText('Contraseña'), password)
    await userEvent.click(screen.getByRole('button', { name: 'Ingresar' }))
  }

  it('submit inválido muestra los errores de validación y no llama a la API', async () => {
    renderApp('/login')
    await userEvent.click(screen.getByRole('button', { name: 'Ingresar' }))
    expect(screen.getByText('El correo es obligatorio.')).toBeInTheDocument()
    expect(screen.getByText('La contraseña es obligatoria.')).toBeInTheDocument()
    expect(servidor.peticiones).toHaveLength(0)
  })

  it('validación en vivo: el error del correo aparece mientras se escribe', async () => {
    renderApp('/login')
    await userEvent.type(screen.getByLabelText('Correo'), 'x@hotmail.com')
    expect(screen.getByText(/Solo se aceptan correos/)).toBeInTheDocument()
  })

  it('credenciales incorrectas muestran el mensaje del backend (401)', async () => {
    renderApp('/login')
    await ingresar('maria.perez@gmail.com', 'mala1')
    expect(await screen.findByText('Correo o contraseña incorrectos.')).toBeInTheDocument()
    expect(sessionStorage.getItem('sonidoVivoToken')).toBeNull()
  })

  it('un cliente que entra queda con sesión (token guardado) y el navbar muestra su nombre', async () => {
    renderApp('/login')
    await ingresar('camila.rojas@gmail.com', 'cli123')
    expect(await screen.findByText('Camila')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Cerrar sesión' })).toBeInTheDocument()
    expect(sessionStorage.getItem('sonidoVivoToken')).toBe(servidor.tokenDe('33333333-3'))
  })

  it('un vendedor entra al panel en Productos y no ve el dashboard', async () => {
    renderApp('/login')
    await ingresar('carlos.munoz@duoc.cl', 'vend123')
    expect(await screen.findByRole('heading', { name: 'Productos' })).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Dashboard' })).not.toBeInTheDocument()
  })

  it('un administrador entra directo al dashboard', async () => {
    renderApp('/login')
    await ingresar('maria.perez@gmail.com', 'admin123')
    expect(await screen.findByRole('heading', { name: 'Dashboard' })).toBeInTheDocument()
  })

  it('después del login, las peticiones llevan "Authorization: Bearer <token>"', async () => {
    renderApp('/login')
    await ingresar('maria.perez@gmail.com', 'admin123')
    await screen.findByTestId('stat-Usuarios')
    const usuarios = servidor.peticiones.find((p) => p.url === '/usuarios')
    expect(usuarios.token).toBe(`Bearer ${servidor.tokenDe('11111111-1')}`)
    expect(servidor.peticiones.find((p) => p.url === '/auth/login').token).toBeNull()
  })

  it('cerrar sesión desde la tienda vuelve a mostrar "Iniciar sesión"', async () => {
    iniciarSesionComo(CLIENTE)
    renderApp('/')
    await userEvent.click(screen.getByRole('button', { name: 'Cerrar sesión' }))
    expect(screen.getByRole('link', { name: 'Iniciar sesión' })).toBeInTheDocument()
    expect(sessionStorage.getItem('sonidoVivoToken')).toBeNull()
  })
})

describe('Registro (POST /auth/registro) y Contacto', () => {
  async function llenarRegistro(run, correo) {
    await userEvent.type(screen.getByLabelText(/RUN/), run)
    await userEvent.type(screen.getByLabelText('Correo'), correo)
    await userEvent.type(screen.getByLabelText('Nombre'), 'Ana')
    await userEvent.type(screen.getByLabelText('Apellidos'), 'Soto')
    await userEvent.selectOptions(screen.getByLabelText('Región'), 'Región de Valparaíso')
    await userEvent.selectOptions(screen.getByLabelText('Comuna'), 'Quilpué')
    await userEvent.type(screen.getByLabelText('Dirección'), 'Calle 1')
    await userEvent.type(screen.getByLabelText(/^Contraseña/), 'abcd')
    await userEvent.type(screen.getByLabelText('Confirmar contraseña'), 'abcd')
  }

  it('la comuna depende de la región elegida', async () => {
    renderApp('/registro')
    expect(screen.getByLabelText('Comuna')).toBeDisabled()
    await userEvent.selectOptions(screen.getByLabelText('Región'), 'Región de Ñuble')
    expect(screen.getByRole('option', { name: 'Chillán' })).toBeInTheDocument()
  })

  it('registro inválido muestra errores y no llama a la API', async () => {
    renderApp('/registro')
    await userEvent.click(screen.getByRole('button', { name: 'Crear cuenta' }))
    expect(screen.getByText('El RUN es obligatorio.')).toBeInTheDocument()
    expect(servidor.peticiones).toHaveLength(0)
  })

  it('registro válido crea un usuario Cliente y abre su sesión', async () => {
    renderApp('/registro')
    await llenarRegistro('12345678-5', 'ana@gmail.com')
    await userEvent.click(screen.getByRole('button', { name: 'Crear cuenta' }))
    expect(await screen.findByText('Ana')).toBeInTheDocument()
    await waitFor(() => expect(servidor.db.usuarios.find((u) => u.run === '12345678-5')).toMatchObject({ tipoUsuario: 'Cliente' }))
    const enviado = servidor.peticiones.find((p) => p.url === '/auth/registro').cuerpo
    expect(enviado).not.toHaveProperty('confirmacion')
  })

  it('registro con un correo ya existente muestra el 409 del backend', async () => {
    renderApp('/registro')
    await llenarRegistro('12345678-5', 'camila.rojas@gmail.com')
    await userEvent.click(screen.getByRole('button', { name: 'Crear cuenta' }))
    expect(await screen.findByText('Ya existe un usuario con ese correo.')).toBeInTheDocument()
  })

  it('registro con un RUN ya existente avisa', async () => {
    renderApp('/registro')
    await llenarRegistro('11111111-1', 'otra@gmail.com')
    await userEvent.click(screen.getByRole('button', { name: 'Crear cuenta' }))
    expect(await screen.findByText('Ya existe un usuario con ese RUN.')).toBeInTheDocument()
  })

  it('Contacto: cuenta caracteres, valida y confirma el envío', async () => {
    renderApp('/contacto')
    await userEvent.type(screen.getByLabelText('Comentario'), 'Hola')
    expect(screen.getByTestId('contador-comentario')).toHaveTextContent('4 / 500')
    await userEvent.click(screen.getByRole('button', { name: 'Enviar' }))
    expect(screen.getByText('El nombre es obligatorio.')).toBeInTheDocument()
    await userEvent.type(screen.getByLabelText('Nombre completo'), 'Ana')
    await userEvent.click(screen.getByRole('button', { name: 'Enviar' }))
    expect(screen.getByText(/Mensaje enviado/)).toBeInTheDocument()
  })
})
