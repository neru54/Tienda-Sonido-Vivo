import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { reportesApi } from '../api/reportes'
import { productoAValores, valoresAProducto } from '../utils/productos'
import { ADMIN, boletaDe, iniciarSesionComo, renderApp } from './helpers'
import { PRODUCTOS } from './semilla'
import { servidor } from './servidorFalso'

beforeEach(() => iniciarSesionComo(ADMIN))

const producto = (codigo) => servidor.db.productos.find((p) => p.codigo === codigo) ?? null
const categoria = (id) => servidor.db.categorias.find((c) => c.id === id) ?? null
const usuario = (run) => servidor.db.usuarios.find((u) => u.run === run) ?? null

describe('Acceso al panel', () => {
  it('un cliente no puede entrar al panel', () => {
    iniciarSesionComo({ run: '33333333-3', nombre: 'Camila', tipoUsuario: 'Cliente' })
    renderApp('/admin')
    expect(screen.getByText(/solo para administradores y vendedores/)).toBeInTheDocument()
  })

  it('si el token vence (401) la sesión se cierra y se pide iniciar sesión de nuevo', async () => {
    servidor.responderCon(401, 'Debes iniciar sesión para acceder a este recurso.')
    renderApp('/admin/usuarios')
    expect(await screen.findByText('Tu sesión expiró. Vuelve a iniciar sesión para continuar.')).toBeInTheDocument()
    expect(sessionStorage.getItem('sonidoVivoToken')).toBeNull()
  })
})

describe('Dashboard y reportes', () => {
  it('el dashboard muestra las métricas que entrega la API', async () => {
    servidor.agregarBoleta(boletaDe())
    renderApp('/admin')
    expect(await screen.findByTestId('stat-Compras')).toHaveTextContent('1')
    expect(screen.getByTestId('stat-Productos')).toHaveTextContent(String(PRODUCTOS.length))
    expect(screen.getByTestId('stat-Usuarios')).toHaveTextContent('3')
  })

  it('la página de reportes muestra el resumen que calcula el backend', async () => {
    servidor.agregarBoleta(boletaDe())
    renderApp('/admin/reportes')
    expect(await screen.findByTestId('stat-Ventas')).toHaveTextContent('$20.000')
    expect(screen.getByTestId('stat-Ticket promedio')).toHaveTextContent('$20.000')
    expect(screen.getAllByText('Guitarra Acústica Folk').length).toBeGreaterThan(0)
    expect(screen.getByText('Guitarras Acústicas')).toBeInTheDocument()
  })

  it('si el catálogo no responde, "Unidades en stock" muestra — y el resto del reporte sigue', async () => {
    const espia = vi.spyOn(reportesApi, 'ventas').mockResolvedValue({
      cantidadOrdenes: 1, totalVendido: 20000, ticketPromedio: 20000, unidadesEnStock: null, topProductos: [], porCategoria: [],
    })
    renderApp('/admin/reportes')
    expect(await screen.findByTestId('stat-Unidades en stock')).toHaveTextContent('—')
    expect(screen.getByText('Catálogo no disponible')).toBeInTheDocument()
    expect(screen.getByTestId('stat-Ventas')).toHaveTextContent('$20.000')
    espia.mockRestore()
  })

  it('los reportes sin ventas lo indican', async () => {
    renderApp('/admin/reportes')
    expect(await screen.findAllByText('Sin ventas todavía.')).toHaveLength(2)
  })
})

describe('Órdenes e historial', () => {
  it('lista las órdenes y abre la boleta', async () => {
    servidor.agregarBoleta(boletaDe())
    renderApp('/admin/ordenes')
    await userEvent.click(await screen.findByRole('link', { name: 'Ver boleta' }))
    expect(await screen.findByRole('heading', { name: 'Boleta #1001' })).toBeInTheDocument()
    expect(screen.getByTestId('total-resumen')).toHaveTextContent('$20.000')
  })

  it('una compra sin cuenta se marca como "Invitado"', async () => {
    servidor.agregarBoleta(boletaDe({ cliente: { run: null, nombre: 'Ana', apellidos: 'S', correo: 'ana@gmail.com' } }))
    renderApp('/admin/ordenes')
    expect(await screen.findByText('Invitado')).toBeInTheDocument()
  })

  it('sin órdenes muestra el mensaje vacío; boleta inexistente avisa', async () => {
    const { unmount } = renderApp('/admin/ordenes')
    expect(await screen.findByText('Aún no hay compras registradas.')).toBeInTheDocument()
    unmount()
    renderApp('/admin/ordenes/9999')
    expect(await screen.findByText('No se encontró la orden.')).toBeInTheDocument()
  })

  it('el historial de un usuario solo incluye sus compras', async () => {
    servidor.agregarBoleta(boletaDe())
    servidor.agregarBoleta(boletaDe({ cliente: { run: '22222222-2', nombre: 'Carlos', apellidos: 'M', correo: 'carlos.munoz@duoc.cl' } }))
    renderApp('/admin/usuarios/33333333-3/historial')
    expect(await screen.findAllByRole('link', { name: 'Ver boleta' })).toHaveLength(1)
  })

  it('historial vacío y usuario inexistente', async () => {
    const { unmount } = renderApp('/admin/usuarios/33333333-3/historial')
    expect(await screen.findByText('Este usuario aún no tiene compras.')).toBeInTheDocument()
    unmount()
    renderApp('/admin/usuarios/0-0/historial')
    expect(await screen.findByText('No se encontró el usuario.')).toBeInTheDocument()
  })
})

describe('Productos (CRUD contra la API)', () => {
  async function llenar({ codigo, nombre = 'Cable', precio = '1000', stock = '5' }) {
    await userEvent.type(await screen.findByLabelText('Código'), codigo)
    await userEvent.type(screen.getByLabelText('Nombre'), nombre)
    await userEvent.selectOptions(screen.getByLabelText('Categoría'), 'Accesorios')
    await userEvent.type(screen.getByLabelText('Precio (CLP)'), precio)
    await userEvent.type(screen.getByLabelText('Stock'), stock)
  }

  it('crear un producto válido hace POST con categoriaId y vuelve al listado', async () => {
    renderApp('/admin/productos/nuevo')
    await llenar({ codigo: 'ZZ001' })
    await userEvent.click(screen.getByRole('button', { name: 'Crear producto' }))
    expect(await screen.findByRole('heading', { name: 'Productos' })).toBeInTheDocument()
    expect(producto('ZZ001')).toMatchObject({ nombre: 'Cable', precio: 1000, stock: 5, stockCritico: 3, categoriaId: 'accesorios' })
  })

  it('crear con un código existente muestra el 409 del backend', async () => {
    renderApp('/admin/productos/nuevo')
    await llenar({ codigo: 'GA001' })
    await userEvent.click(screen.getByRole('button', { name: 'Crear producto' }))
    expect(await screen.findByText('Ya existe un producto con ese código.')).toBeInTheDocument()
  })

  it('el formulario muestra errores de precio y stock inválidos', async () => {
    renderApp('/admin/productos/nuevo')
    await llenar({ codigo: 'ZZ002', precio: '-5', stock: '1.5' })
    expect(screen.getByText(/Ingresa el precio en pesos/)).toBeInTheDocument()
    expect(screen.getByText('Solo se permiten números enteros.')).toBeInTheDocument()
  })

  it('al marcar "en oferta" pide el precio de oferta y lo valida', async () => {
    renderApp('/admin/productos/nuevo')
    await llenar({ codigo: 'ZZ003' })
    await userEvent.click(screen.getByLabelText('Producto en oferta'))
    await userEvent.type(screen.getByLabelText('Precio de oferta (CLP)'), '5000')
    expect(screen.getByText(/no mayor al precio normal/)).toBeInTheDocument()
  })

  it('editar actualiza el producto (PUT) y bloquea el código', async () => {
    renderApp('/admin/productos/GA001/editar')
    expect(await screen.findByLabelText('Código')).toHaveAttribute('readonly')
    expect(screen.getByLabelText('Categoría')).toHaveValue('guitarras-acusticas')
    const nombre = screen.getByLabelText('Nombre')
    await userEvent.clear(nombre)
    await userEvent.type(nombre, 'Guitarra Renovada')
    await userEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }))
    await waitFor(() => expect(producto('GA001').nombre).toBe('Guitarra Renovada'))
  })

  it('editar un producto inexistente avisa', async () => {
    renderApp('/admin/productos/NOPE/editar')
    expect(await screen.findByText('No se encontró el producto solicitado.')).toBeInTheDocument()
  })

  it('eliminar pide confirmación y borra el producto (DELETE)', async () => {
    renderApp('/admin/productos')
    const fila = (await screen.findByText('GA001')).closest('tr')
    await userEvent.click(within(fila).getByRole('button', { name: 'Eliminar' }))
    await userEvent.click(within(fila).getByRole('button', { name: 'Sí' }))
    await waitFor(() => expect(screen.queryByText('GA001')).not.toBeInTheDocument())
    expect(producto('GA001')).toBeNull()
  })

  it('un producto con ventas no se puede eliminar: se muestra el motivo del backend', async () => {
    servidor.agregarBoleta(boletaDe())
    renderApp('/admin/productos')
    const fila = (await screen.findByText('GA001')).closest('tr')
    await userEvent.click(within(fila).getByRole('button', { name: 'Eliminar' }))
    await userEvent.click(within(fila).getByRole('button', { name: 'Sí' }))
    expect(await screen.findByText(/tiene ventas registradas/)).toBeInTheDocument()
    expect(producto('GA001')).not.toBeNull()
  })

  it('el listado se puede buscar', async () => {
    renderApp('/admin/productos')
    await screen.findByText('GA001')
    await userEvent.type(screen.getByRole('searchbox'), 'GA001')
    expect(screen.getAllByRole('row')).toHaveLength(2) // encabezado + 1
  })

  it('la lista de críticos la entrega GET /productos/criticos', async () => {
    renderApp('/admin/productos/criticos')
    const esperados = PRODUCTOS.filter((p) => p.stock <= p.stockCritico).length
    expect(await screen.findAllByText('Stock crítico')).toHaveLength(esperados)
    expect(screen.getAllByRole('row')).toHaveLength(esperados + 1)
  })

  it('la ficha de detalle del panel muestra el producto', async () => {
    renderApp('/admin/productos/GA001')
    expect(await screen.findByRole('heading', { name: 'Guitarra Acústica Folk' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Editar' })).toHaveAttribute('href', '/admin/productos/GA001/editar')
  })

  it('valoresAProducto y productoAValores son operaciones inversas', () => {
    const p = { ...producto('GA001') }
    expect(valoresAProducto(productoAValores(p))).toMatchObject({ codigo: 'GA001', categoriaId: p.categoriaId, precio: p.precio, stock: p.stock, oferta: p.oferta })
  })
})

describe('Categorías', () => {
  it('crear una categoría nueva: el backend deriva el id del nombre', async () => {
    renderApp('/admin/categorias/nueva')
    await userEvent.type(screen.getByLabelText('Nombre'), 'Vientos y Metales')
    await userEvent.click(screen.getByRole('button', { name: 'Crear categoría' }))
    await waitFor(() => expect(categoria('vientos-y-metales')).toMatchObject({ nombre: 'Vientos y Metales' }))
  })

  it('crear una categoría repetida muestra el error', async () => {
    renderApp('/admin/categorias/nueva')
    await userEvent.type(screen.getByLabelText('Nombre'), 'Baterías')
    await userEvent.click(screen.getByRole('button', { name: 'Crear categoría' }))
    expect(await screen.findByText('Ya existe una categoría con ese nombre.')).toBeInTheDocument()
  })

  it('no permite eliminar una categoría con productos (409)', async () => {
    renderApp('/admin/categorias')
    const fila = (await screen.findByText('Baterías')).closest('tr')
    await userEvent.click(within(fila).getByRole('button', { name: 'Eliminar' }))
    await userEvent.click(within(fila).getByRole('button', { name: 'Sí' }))
    expect(await screen.findByText(/tiene productos asociados/)).toBeInTheDocument()
    expect(categoria('baterias')).not.toBeNull()
  })

  it('permite eliminar una categoría sin productos', async () => {
    servidor.db.categorias.push({ id: 'vacia', nombre: 'Vacía', descripcion: '' })
    renderApp('/admin/categorias')
    const fila = (await screen.findByText('Vacía')).closest('tr')
    await userEvent.click(within(fila).getByRole('button', { name: 'Eliminar' }))
    await userEvent.click(within(fila).getByRole('button', { name: 'Sí' }))
    await waitFor(() => expect(screen.queryByText('Vacía')).not.toBeInTheDocument())
    expect(categoria('vacia')).toBeNull()
  })

  it('renombrar una categoría: sus productos muestran el nombre nuevo (FK)', async () => {
    renderApp('/admin/categorias/baterias/editar')
    const nombre = await screen.findByLabelText('Nombre')
    await userEvent.clear(nombre)
    await userEvent.type(nombre, 'Percusión')
    await userEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }))
    await waitFor(() => expect(categoria('baterias').nombre).toBe('Percusión'))
    expect(producto('BT001').categoriaId).toBe('baterias')
  })

  it('renombrar una categoría con el nombre de otra muestra el error', async () => {
    renderApp('/admin/categorias/baterias/editar')
    const nombre = await screen.findByLabelText('Nombre')
    await userEvent.clear(nombre)
    await userEvent.type(nombre, 'Micrófonos')
    await userEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }))
    expect(await screen.findByText('Ya existe una categoría con ese nombre.')).toBeInTheDocument()
    expect(categoria('baterias').nombre).toBe('Baterías')
  })

  it('editar una categoría inexistente avisa', async () => {
    renderApp('/admin/categorias/nada/editar')
    expect(await screen.findByText('No se encontró la categoría.')).toBeInTheDocument()
  })
})

describe('Usuarios y perfil', () => {
  async function llenarUsuario(run, correo) {
    await userEvent.type(screen.getByLabelText(/RUN/), run)
    await userEvent.type(screen.getByLabelText('Nombre'), 'Pedro')
    await userEvent.type(screen.getByLabelText('Apellidos'), 'Díaz')
    await userEvent.type(screen.getByLabelText('Correo'), correo)
    await userEvent.selectOptions(screen.getByLabelText('Tipo de usuario'), 'Vendedor')
    await userEvent.selectOptions(screen.getByLabelText('Región'), 'Región de Los Lagos')
    await userEvent.selectOptions(screen.getByLabelText('Comuna'), 'Osorno')
    await userEvent.type(screen.getByLabelText('Dirección'), 'Calle 5')
    await userEvent.type(screen.getByLabelText(/^Contraseña/), 'abcd')
  }

  it('crea un usuario válido (fecha vacía viaja como null)', async () => {
    renderApp('/admin/usuarios/nuevo')
    await llenarUsuario('12345678-5', 'pedro@gmail.com')
    await userEvent.click(screen.getByRole('button', { name: 'Crear usuario' }))
    await waitFor(() => expect(usuario('12345678-5')).toMatchObject({ tipoUsuario: 'Vendedor', comuna: 'Osorno', fechaNacimiento: null }))
  })

  it('rechaza RUN duplicado y correo duplicado', async () => {
    const { unmount } = renderApp('/admin/usuarios/nuevo')
    await llenarUsuario('11111111-1', 'pedro@gmail.com')
    await userEvent.click(screen.getByRole('button', { name: 'Crear usuario' }))
    expect(await screen.findByText('Ya existe un usuario con ese RUN.')).toBeInTheDocument()
    unmount()
    renderApp('/admin/usuarios/nuevo')
    await llenarUsuario('12345678-5', 'camila.rojas@gmail.com')
    await userEvent.click(screen.getByRole('button', { name: 'Crear usuario' }))
    expect(await screen.findByText('Ya existe un usuario con ese correo.')).toBeInTheDocument()
  })

  it('editar sin contraseña no la envía y cambia los demás datos', async () => {
    renderApp('/admin/usuarios/33333333-3/editar')
    const nombre = await screen.findByLabelText('Nombre')
    await userEvent.clear(nombre)
    await userEvent.type(nombre, 'Camilita')
    await userEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }))
    await waitFor(() => expect(usuario('33333333-3')).toMatchObject({ nombre: 'Camilita', password: 'cli123' }))
    expect(servidor.peticiones.find((p) => p.metodo === 'put').cuerpo.password).toBeNull()
  })

  it('editar con una contraseña nueva la reemplaza', async () => {
    renderApp('/admin/usuarios/33333333-3/editar')
    await userEvent.type(await screen.findByLabelText(/Nueva contraseña/), 'nueva1')
    await userEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }))
    await waitFor(() => expect(usuario('33333333-3').password).toBe('nueva1'))
  })

  it('editar no deja usar el correo de otro usuario', async () => {
    renderApp('/admin/usuarios/22222222-2/editar')
    const correo = await screen.findByLabelText('Correo')
    await userEvent.clear(correo)
    await userEvent.type(correo, 'maria.perez@gmail.com')
    await userEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }))
    expect(await screen.findByText('Ya existe un usuario con ese correo.')).toBeInTheDocument()
    expect(usuario('22222222-2').correo).toBe('carlos.munoz@duoc.cl')
  })

  it('editar un usuario inexistente avisa', async () => {
    renderApp('/admin/usuarios/0-0/editar')
    expect(await screen.findByText('No se encontró el usuario.')).toBeInTheDocument()
  })

  it('no deja eliminar al usuario con la sesión activa, pero sí a otro', async () => {
    renderApp('/admin/usuarios')
    const propia = (await screen.findByText('maria.perez@gmail.com')).closest('tr')
    await userEvent.click(within(propia).getByRole('button', { name: 'Eliminar' }))
    await userEvent.click(within(propia).getByRole('button', { name: 'Sí' }))
    expect(await screen.findByText(/No puedes eliminar tu propio usuario/)).toBeInTheDocument()

    const otra = screen.getByText('camila.rojas@gmail.com').closest('tr')
    await userEvent.click(within(otra).getByRole('button', { name: 'Eliminar' }))
    await userEvent.click(within(otra).getByRole('button', { name: 'Sí' }))
    await waitFor(() => expect(screen.queryByText('camila.rojas@gmail.com')).not.toBeInTheDocument())
    expect(usuario('33333333-3')).toBeNull()
    expect(servidor.db.usuarios).toHaveLength(2)
  })

  it('el perfil (/usuarios/me) actualiza los datos propios y bloquea el tipo de usuario', async () => {
    renderApp('/admin/perfil')
    expect(await screen.findByLabelText('Tipo de usuario')).toBeDisabled()
    const nombre = screen.getByLabelText('Nombre')
    await userEvent.clear(nombre)
    await userEvent.type(nombre, 'María José')
    await userEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }))
    expect(await screen.findByText('Perfil actualizado correctamente.')).toBeInTheDocument()
    expect(usuario('11111111-1').nombre).toBe('María José')
    expect(screen.getByText(/María José · Administrador/)).toBeInTheDocument() // sidebar refrescado
    expect(servidor.peticiones.find((p) => p.url === '/usuarios/me' && p.metodo === 'put').cuerpo).not.toHaveProperty('tipoUsuario')
  })
})
