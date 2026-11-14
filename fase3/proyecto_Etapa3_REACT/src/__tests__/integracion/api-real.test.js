import { beforeAll, describe, expect, it } from 'vitest'
import { authApi } from '../../api/auth'
import { boletasApi } from '../../api/boletas'
import { categoriasApi } from '../../api/categorias'
import { CLAVE_TOKEN, api, estadoHttp, mensajeDeError } from '../../api/cliente'
import { productosApi } from '../../api/productos'
import { reportesApi } from '../../api/reportes'
import { usuariosApi } from '../../api/usuarios'

/*
  PRUEBA DE INTEGRACIÓN REAL: usa los servicios del frontend contra el backend Spring Boot levantado.
  No corre con `npm test`; se ejecuta con `npm run test:integracion` teniendo la API arriba:
      cd ../sonido-vivo-api && ./mvnw spring-boot:run -Dspring-boot.run.profiles=h2
  Modifica datos (crea una categoría, un producto y boletas): usar una base de prueba (perfil h2).
*/

const sesionComo = async (correo, password) => {
  const { token, usuario } = await authApi.login(correo, password)
  sessionStorage.setItem(CLAVE_TOKEN, token)
  return usuario
}
const sinSesion = () => sessionStorage.removeItem(CLAVE_TOKEN)
const fallo = (promesa) => promesa.then(() => { throw new Error('se esperaba un error') }, (e) => e)

const sufijo = String(Date.now()).slice(-6)
const PEDIDO = (codigo, cantidad, cupon = null) => ({
  cliente: { nombre: 'Prueba', apellidos: 'Integración', correo: 'prueba@gmail.com' },
  direccion: { calle: 'Calle 1', departamento: '', region: 'Región de Valparaíso', comuna: 'Quilpué', indicaciones: '' },
  items: [{ codigo, cantidad }],
  cupon,
})

beforeAll(() => {
  api.defaults.adapter = 'http' // red real (en las demás pruebas responde el servidor falso)
})

describe('Frontend + backend real', () => {
  it('catálogo público: 51 productos y 10 categorías con la forma que usan las páginas', async () => {
    sinSesion()
    const productos = await productosApi.listar()
    const categorias = await categoriasApi.listar()
    expect(productos.length).toBeGreaterThanOrEqual(51)
    expect(categorias.length).toBeGreaterThanOrEqual(10)
    expect(productos[0]).toEqual(expect.objectContaining({ codigo: expect.any(String), categoria: expect.any(String), categoriaId: expect.any(String), precio: expect.any(Number), stock: expect.any(Number), oferta: expect.any(Boolean) }))
    expect(categorias[0]).toEqual(expect.objectContaining({ id: expect.any(String), nombre: expect.any(String), cantidadProductos: expect.any(Number) }))
    const ofertas = await productosApi.listar({ oferta: true })
    expect(ofertas.every((p) => p.oferta)).toBe(true)
    const baterias = await productosApi.listar({ categoria: 'baterias' })
    expect(baterias.every((p) => p.categoriaId === 'baterias')).toBe(true)
  })

  it('login: credenciales malas -> 401 con mensaje; buenas -> token y usuario sin contraseña', async () => {
    sinSesion()
    const e = await fallo(authApi.login('maria.perez@gmail.com', 'mala'))
    expect(estadoHttp(e)).toBe(401)
    expect(mensajeDeError(e)).toBe('Correo o contraseña incorrectos.')
    const admin = await sesionComo('maria.perez@gmail.com', 'admin123')
    expect(admin.tipoUsuario).toBe('Administrador')
    expect(admin).not.toHaveProperty('password')
    expect((await authApi.yo()).run).toBe('11111111-1')
  })

  it('administrador: crea categoría y producto; el vendedor recibe 403 al intentar escribir', async () => {
    await sesionComo('maria.perez@gmail.com', 'admin123')
    const cat = await categoriasApi.crear({ nombre: `Integración ${sufijo}`, descripcion: 'Prueba' })
    expect(cat.id).toBe(`integracion-${sufijo}`)
    const prod = await productosApi.crear({ codigo: `IT${sufijo}`, nombre: 'Producto de prueba', categoriaId: cat.id, precio: 1000, stock: 3, stockCritico: null, oferta: false, precioOferta: null })
    expect(prod).toMatchObject({ categoria: `Integración ${sufijo}`, stockCritico: 3, critico: true })
    expect(estadoHttp(await fallo(categoriasApi.eliminar(cat.id)))).toBe(409) // tiene productos

    await sesionComo('carlos.munoz@duoc.cl', 'vend123')
    expect(estadoHttp(await fallo(productosApi.eliminar(prod.codigo)))).toBe(403)
    expect(estadoHttp(await fallo(usuariosApi.listar()))).toBe(403)
    expect(Array.isArray(await boletasApi.listar())).toBe(true) // sí puede ver órdenes
  })

  it('checkout como invitado: el backend calcula el total, aplica el cupón y descuenta stock', async () => {
    sinSesion()
    const codigo = `IT${sufijo}`
    const boleta = await boletasApi.crear(PEDIDO(codigo, 2, 'sonidovivo10'))
    expect(boleta).toMatchObject({ cupon: 'SONIDOVIVO10', subtotal: 2000, descuento: 200, total: 1800, cliente: { run: null } })
    expect((await productosApi.obtener(codigo)).stock).toBe(1)
    const sinStock = await fallo(boletasApi.crear(PEDIDO(codigo, 5)))
    expect(estadoHttp(sinStock)).toBe(409)
    expect(mensajeDeError(sinStock)).toMatch(/No hay stock suficiente/)
    expect(estadoHttp(await fallo(boletasApi.obtener(boleta.id)))).toBe(401) // un invitado no puede consultarla después
  })

  it('checkout con sesión de cliente: la boleta queda en "mis compras" y no puede ver boletas ajenas', async () => {
    await sesionComo('camila.rojas@gmail.com', 'cli123')
    const propia = await boletasApi.crear(PEDIDO('AC001', 1))
    expect(propia.cliente.run).toBe('33333333-3')
    expect((await usuariosApi.misBoletas()).some((b) => b.id === propia.id)).toBe(true)
    expect((await boletasApi.obtener(propia.id)).id).toBe(propia.id)
    sinSesion()
    const ajena = await boletasApi.crear(PEDIDO('AC001', 1))
    await sesionComo('camila.rojas@gmail.com', 'cli123')
    expect(estadoHttp(await fallo(boletasApi.obtener(ajena.id)))).toBe(403)
    expect(estadoHttp(await fallo(boletasApi.listar()))).toBe(403)
  })

  it('reportes del administrador reflejan las ventas', async () => {
    await sesionComo('maria.perez@gmail.com', 'admin123')
    const r = await reportesApi.ventas()
    expect(r.cantidadOrdenes).toBeGreaterThanOrEqual(3)
    expect(r.topProductos.length).toBeGreaterThan(0)
  })
})
