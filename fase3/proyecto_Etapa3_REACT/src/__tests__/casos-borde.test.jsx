import { act, renderHook, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import ProductosTabla from '../components/ProductosTabla'
import { CartProvider, useCart } from '../context/CartContext'
import { SessionProvider, useSession } from '../context/SessionContext'
import { ADMIN, CLIENTE, boletaDe, cargarCarrito, iniciarSesionComo, renderApp, renderConRouter } from './helpers'
import { servidor } from './servidorFalso'

/* Casos borde y rutas de error que las otras pruebas no recorren. */

describe('Casos borde', () => {
  it('SessionProvider ignora una sesión corrupta en sessionStorage', () => {
    sessionStorage.setItem('sonidoVivoToken', 'x')
    sessionStorage.setItem('sonidoVivoSesion', '{roto')
    const { result } = renderHook(() => useSession(), { wrapper: SessionProvider })
    expect(result.current.usuario).toBeNull()
  })

  it('useCart.quitar elimina un producto del carrito', () => {
    const { result } = renderHook(() => useCart(), { wrapper: CartProvider })
    act(() => result.current.agregar({ codigo: 'A', nombre: 'A', precio: 1, imagen: '' }, 1))
    act(() => result.current.quitar('A'))
    expect(result.current.items).toEqual([])
  })

  it('ProductosTabla sin productos muestra "No hay productos"', () => {
    renderConRouter(<ProductosTabla productos={[]} />)
    expect(screen.getByText('No hay productos')).toBeInTheDocument()
  })

  it('las órdenes se muestran en el orden que entrega la API (más reciente primero)', async () => {
    servidor.agregarBoleta(boletaDe({ fecha: '2026-01-01T10:00:00.000Z' }))
    servidor.agregarBoleta(boletaDe({ fecha: '2026-06-01T10:00:00.000Z' }))
    iniciarSesionComo(ADMIN)
    renderApp('/admin/ordenes')
    await screen.findByText('#1002')
    const filas = screen.getAllByRole('row').slice(1)
    expect(filas[0]).toHaveTextContent('#1002')
    expect(filas[1]).toHaveTextContent('#1001')
  })

  it('la boleta del admin se puede imprimir', async () => {
    servidor.agregarBoleta(boletaDe({ direccion: { calle: 'C', departamento: '12', region: 'R', comuna: 'X', indicaciones: 'Tocar timbre' } }))
    iniciarSesionComo(ADMIN)
    const imprimir = vi.spyOn(window, 'print').mockImplementation(() => {})
    renderApp('/admin/ordenes/1001')
    expect(await screen.findByText(/Tocar timbre/)).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Imprimir boleta' }))
    expect(imprimir).toHaveBeenCalledTimes(1)
  })

  it('un cupón que el backend rechaza muestra su mensaje en el checkout', async () => {
    cargarCarrito([{ codigo: 'GA001', nombre: 'Guitarra', precio: 1, imagen: '', cantidad: 1 }])
    localStorage.setItem('sonidoVivoCupon', 'SONIDOVIVO10')
    iniciarSesionComo(CLIENTE)
    servidor.responderCon(400, 'El cupón "SONIDOVIVO10" no es válido.')
    renderApp('/checkout')
    await userEvent.click(screen.getByRole('button', { name: 'Pagar ahora' }))
    expect(await screen.findByText('El cupón "SONIDOVIVO10" no es válido.')).toBeInTheDocument()
  })

  it('si el servidor está caído al pagar se informa sin perder el carrito', async () => {
    cargarCarrito([{ codigo: 'GA001', nombre: 'Guitarra', precio: 1, imagen: '', cantidad: 1 }])
    iniciarSesionComo(CLIENTE)
    servidor.caerse()
    renderApp('/checkout')
    await userEvent.click(screen.getByRole('button', { name: 'Pagar ahora' }))
    expect(await screen.findByText(/No se pudo conectar con el servidor/)).toBeInTheDocument()
    expect(JSON.parse(localStorage.getItem('sonidoVivoCarrito'))).toHaveLength(1)
  })

  it('en el checkout, cambiar la región limpia la comuna', async () => {
    cargarCarrito([{ codigo: 'GA001', nombre: 'Guitarra', precio: 1, imagen: '', cantidad: 1 }])
    renderApp('/checkout')
    await userEvent.selectOptions(screen.getByLabelText('Región'), 'Región de Los Lagos')
    await userEvent.selectOptions(screen.getByLabelText('Comuna'), 'Osorno')
    await userEvent.selectOptions(screen.getByLabelText('Región'), 'Región del Biobío')
    expect(screen.getByLabelText('Comuna')).toHaveValue('')
  })
})
