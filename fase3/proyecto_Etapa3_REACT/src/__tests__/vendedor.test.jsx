import { screen, within } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import AdminSidebar from '../components/AdminSidebar'
import { inicioDelPanel, puede, tieneAccesoAlPanel } from '../utils/roles'
import { VENDEDOR, boletaDe, iniciarSesionComo, renderApp, renderConRouter } from './helpers'
import { servidor } from './servidorFalso'

/*
  Enunciado, rol Vendedor: "Puede visualizar la lista de los productos y el detalle. Puede visualizar
  la lista de órdenes y el detalle. Todos los demás accesos no deben aparecer en la vista del vendedor."
*/
describe('Permisos por rol (utils/roles.js)', () => {
  it('el vendedor solo tiene productos.ver y ordenes.ver', () => {
    const v = { tipoUsuario: 'Vendedor' }
    expect(puede(v, 'productos.ver')).toBe(true)
    expect(puede(v, 'ordenes.ver')).toBe(true)
    for (const p of ['dashboard', 'productos.editar', 'productos.criticos', 'categorias', 'usuarios', 'reportes', 'perfil']) {
      expect(puede(v, p)).toBe(false)
    }
    expect(inicioDelPanel(v)).toBe('/admin/productos')
  })

  it('el administrador tiene todo; el cliente y el visitante, nada del panel', () => {
    expect(puede({ tipoUsuario: 'Administrador' }, 'usuarios')).toBe(true)
    expect(inicioDelPanel({ tipoUsuario: 'Administrador' })).toBe('/admin')
    expect(tieneAccesoAlPanel({ tipoUsuario: 'Cliente' })).toBe(false)
    expect(puede(null, 'productos.ver')).toBe(false)
  })
})

describe('Vista del vendedor', () => {
  beforeEach(() => iniciarSesionComo(VENDEDOR))

  it('el menú lateral solo muestra Productos y Órdenes', () => {
    renderConRouter(<AdminSidebar usuario={VENDEDOR} />)
    const menu = screen.getByRole('navigation', { name: 'Menú del panel' })
    const enlaces = within(menu).getAllByRole('link').map((a) => a.textContent)
    expect(enlaces).toEqual(['Órdenes / Boletas', 'Productos', 'Volver a la tienda'])
  })

  it('el listado de productos no ofrece crear, editar ni eliminar; sí "Ver"', async () => {
    renderApp('/admin/productos')
    const fila = (await screen.findByText('GA001')).closest('tr')
    expect(within(fila).getByRole('link', { name: 'Ver' })).toHaveAttribute('href', '/admin/productos/GA001')
    expect(within(fila).queryByRole('link', { name: 'Editar' })).not.toBeInTheDocument()
    expect(within(fila).queryByRole('button', { name: 'Eliminar' })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Nuevo producto' })).not.toBeInTheDocument()
  })

  it('el detalle de producto es de solo lectura', async () => {
    renderApp('/admin/productos/GA001')
    expect(await screen.findByRole('heading', { name: 'Guitarra Acústica Folk' })).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Editar' })).not.toBeInTheDocument()
  })

  it('ve la lista de órdenes y el detalle de una boleta', async () => {
    servidor.agregarBoleta(boletaDe())
    const { unmount } = renderApp('/admin/ordenes')
    expect(await screen.findByRole('link', { name: 'Ver boleta' })).toBeInTheDocument()
    unmount()
    renderApp('/admin/ordenes/1001')
    expect(await screen.findByRole('heading', { name: 'Boleta #1001' })).toBeInTheDocument()
  })

  it.each([
    '/admin/productos/nuevo', '/admin/productos/GA001/editar', '/admin/productos/criticos', '/admin/categorias',
    '/admin/categorias/nueva', '/admin/usuarios', '/admin/usuarios/nuevo', '/admin/reportes', '/admin/perfil',
  ])('si escribe la URL %s a mano ve "sin permisos" y no se llama a la API', (ruta) => {
    renderApp(ruta)
    expect(screen.getByText('No tienes permisos para ver esta sección.')).toBeInTheDocument()
    expect(servidor.peticiones).toHaveLength(0)
  })
})
