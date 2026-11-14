import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { CLAVE_CARRITO } from '../context/CartContext'
import { armarPedido } from '../pages/Checkout'
import { CLIENTE, cargarCarrito, iniciarSesionComo, renderApp } from './helpers'
import { servidor } from './servidorFalso'

const GUITARRA = { codigo: 'GA001', nombre: 'Guitarra Acústica Folk', precio: 110490, imagen: '', cantidad: 2 }

function prepararCarritoYSesion() {
  cargarCarrito([GUITARRA])
  iniciarSesionComo(CLIENTE) // sesión iniciada: el checkout debe autocompletar los datos
}

async function llenarEntregaComoInvitado() {
  await userEvent.type(screen.getByLabelText('Nombre'), 'Ana')
  await userEvent.type(screen.getByLabelText('Apellidos'), 'Soto')
  await userEvent.type(screen.getByLabelText('Correo'), 'ana@gmail.com')
  await userEvent.type(screen.getByLabelText('Calle y número'), 'Calle 1')
  await userEvent.selectOptions(screen.getByLabelText('Región'), 'Región de Valparaíso')
  await userEvent.selectOptions(screen.getByLabelText('Comuna'), 'Quilpué')
}

describe('Flujo de pago (POST /boletas)', () => {
  it('Checkout autocompleta los datos del usuario con sesión iniciada', () => {
    prepararCarritoYSesion()
    renderApp('/checkout')
    expect(screen.getByLabelText('Nombre')).toHaveValue('Camila')
    expect(screen.getByLabelText('Correo')).toHaveValue('camila.rojas@gmail.com')
    expect(screen.getByLabelText('Comuna')).toHaveValue('Providencia')
  })

  it('armarPedido solo envía códigos y cantidades (el backend calcula precios y total)', () => {
    const valores = { nombre: ' Ana ', apellidos: 'Soto', correo: 'ana@gmail.com', calle: 'C 1', departamento: '', region: 'R', comuna: 'X', indicaciones: '' }
    const pedido = armarPedido(valores, [GUITARRA], 'SONIDOVIVO10')
    expect(pedido.items).toEqual([{ codigo: 'GA001', cantidad: 2 }])
    expect(pedido.cliente.nombre).toBe('Ana')
    expect(pedido.cupon).toBe('SONIDOVIVO10')
    expect(JSON.stringify(pedido)).not.toContain('110490')
  })

  it('pago exitoso con sesión: crea la boleta asociada al cliente, descuenta stock y vacía el carrito', async () => {
    prepararCarritoYSesion()
    const stockAntes = servidor.db.productos.find((p) => p.codigo === 'GA001').stock
    renderApp('/checkout')
    await userEvent.click(screen.getByRole('button', { name: 'Pagar ahora' }))

    expect(await screen.findByText(/Se ha realizado la compra nro #1001/)).toBeInTheDocument()
    expect(servidor.db.boletas).toHaveLength(1)
    expect(servidor.db.boletas[0].cliente.run).toBe('33333333-3')
    expect(servidor.db.productos.find((p) => p.codigo === 'GA001').stock).toBe(stockAntes - 2)
    expect(JSON.parse(localStorage.getItem(CLAVE_CARRITO))).toEqual([]) // carrito vacío tras pagar
  })

  it('se puede comprar SIN iniciar sesión: la boleta queda sin usuario', async () => {
    cargarCarrito([GUITARRA])
    renderApp('/checkout')
    expect(screen.getByText(/Puedes comprar sin cuenta/)).toBeInTheDocument()
    await llenarEntregaComoInvitado()
    await userEvent.click(screen.getByRole('button', { name: 'Pagar ahora' }))

    expect(await screen.findByText(/Se ha realizado la compra nro #1001/)).toBeInTheDocument()
    expect(servidor.db.boletas[0].cliente.run).toBeNull()
    expect(servidor.peticiones.find((p) => p.url === '/boletas').token).toBeNull()
  })

  it('el total de la boleta lo calcula el backend con el cupón', async () => {
    prepararCarritoYSesion()
    localStorage.setItem('sonidoVivoCupon', 'SONIDOVIVO10')
    renderApp('/checkout')
    await userEvent.click(screen.getByRole('button', { name: 'Pagar ahora' }))
    await screen.findByText(/Se ha realizado la compra/)
    expect(servidor.db.boletas[0]).toMatchObject({ cupon: 'SONIDOVIVO10', subtotal: 220980, descuento: 22098, total: 198882 })
    expect(screen.getByTestId('total-resumen')).toHaveTextContent('$198.882')
  })

  it('si el backend responde 409 por stock, se muestra su mensaje y se conserva el carrito', async () => {
    servidor.db.productos.find((p) => p.codigo === 'GA001').stock = 1
    prepararCarritoYSesion()
    renderApp('/checkout')
    await userEvent.click(screen.getByRole('button', { name: 'Pagar ahora' }))
    expect(await screen.findByText(/No hay stock suficiente de "Guitarra Acústica Folk"/)).toBeInTheDocument()
    expect(servidor.db.boletas).toHaveLength(0)
    expect(JSON.parse(localStorage.getItem(CLAVE_CARRITO))).toHaveLength(1)
    expect(screen.getByRole('button', { name: 'Pagar ahora' })).toBeEnabled()
  })

  it('si se cae la red y se reintenta, se reenvía la MISMA Idempotency-Key y queda una sola boleta', async () => {
    prepararCarritoYSesion()
    renderApp('/checkout')
    servidor.caerse()
    await userEvent.click(screen.getByRole('button', { name: 'Pagar ahora' }))
    expect(await screen.findByText(/No se pudo conectar con el servidor/)).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Pagar ahora' }))
    expect(await screen.findByText(/Se ha realizado la compra nro #1001/)).toBeInTheDocument()

    const claves = servidor.peticiones.filter((p) => p.metodo === 'post' && p.url === '/boletas').map((p) => p.clave)
    expect(claves).toHaveLength(2)
    expect(claves[0]).toMatch(/^[0-9a-f]{32}$/)
    expect(claves[1]).toBe(claves[0])
    expect(servidor.db.boletas).toHaveLength(1)
  })

  it('pago con error simulado: muestra PagoError, no llama a la API y conserva el carrito', async () => {
    prepararCarritoYSesion()
    renderApp('/checkout')
    await userEvent.click(screen.getByLabelText(/Simular error de pago/))
    await userEvent.click(screen.getByRole('button', { name: 'Pagar ahora' }))

    expect(await screen.findByText('No se pudo realizar el pago')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Volver a realizar el pago' })).toHaveAttribute('href', '/checkout')
    expect(servidor.peticiones.some((p) => p.url === '/boletas')).toBe(false)
    expect(JSON.parse(localStorage.getItem(CLAVE_CARRITO))).toHaveLength(1)
  })

  it('checkout con datos inválidos no avanza y muestra errores', async () => {
    prepararCarritoYSesion()
    renderApp('/checkout')
    await userEvent.clear(screen.getByLabelText('Nombre'))
    await userEvent.click(screen.getByRole('button', { name: 'Pagar ahora' }))
    expect(screen.getByText('El nombre es obligatorio.')).toBeInTheDocument()
    expect(servidor.db.boletas).toHaveLength(0)
  })

  it('PagoCorrecto: "Imprimir boleta" llama a window.print y "Enviar por email" confirma', async () => {
    prepararCarritoYSesion()
    renderApp('/checkout')
    await userEvent.click(screen.getByRole('button', { name: 'Pagar ahora' }))
    const imprimir = vi.spyOn(window, 'print').mockImplementation(() => {})

    await userEvent.click(await screen.findByRole('button', { name: 'Imprimir boleta' }))
    expect(imprimir).toHaveBeenCalledTimes(1)

    await userEvent.click(screen.getByRole('button', { name: 'Enviar por email' }))
    expect(screen.getByText(/Boleta enviada a camila.rojas@gmail.com/)).toBeInTheDocument()
  })

  it('PagoCorrecto al recargar pide la boleta a la API si es del usuario de la sesión', async () => {
    const b = servidor.agregarBoleta({ fecha: '2026-05-01T10:00:00.000Z', total: 100, cliente: { run: '33333333-3', nombre: 'Camila', apellidos: 'R', correo: 'camila.rojas@gmail.com' }, direccion: { calle: 'C', region: 'R', comuna: 'X' }, items: [] })
    iniciarSesionComo(CLIENTE)
    renderApp(`/pago-correcto?orden=${b.id}`)
    expect(await screen.findByText(`Se ha realizado la compra nro #${b.id}`)).toBeInTheDocument()
  })

  it('PagoCorrecto con una orden inexistente o ajena avisa que no se encontró', async () => {
    const { unmount } = renderApp('/pago-correcto?orden=9999')
    expect(await screen.findByText('No se encontró la orden indicada.')).toBeInTheDocument() // invitado: 401
    unmount()
    const b = servidor.agregarBoleta({ fecha: '2026-05-01T10:00:00.000Z', total: 1, cliente: { run: '11111111-1', nombre: 'M', apellidos: 'P', correo: 'm@gmail.com' }, direccion: {}, items: [] })
    iniciarSesionComo(CLIENTE)
    renderApp(`/pago-correcto?orden=${b.id}`)
    expect(await screen.findByText('No se encontró la orden indicada.')).toBeInTheDocument() // otra persona: 403
  })
})
