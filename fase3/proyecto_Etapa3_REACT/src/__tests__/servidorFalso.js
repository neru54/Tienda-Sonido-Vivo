import { AxiosError } from 'axios'
import { api } from '../api/cliente'
import { CATEGORIAS, PRODUCTOS, USUARIOS } from './semilla'

/*
  Servidor FALSO para las pruebas del frontend.
  Se conecta como "adapter" del cliente axios real (api/cliente.js): las páginas, los servicios
  y los interceptores funcionan igual que en producción, pero en vez de salir a la red la petición
  la responde esta copia en memoria del backend (mismas rutas, códigos HTTP y mensajes que la API
  Spring Boot). Así las pruebas no dependen de tener el backend levantado.

  Uso en pruebas:
    servidor.db.productos ...        estado actual de la "base"
    servidor.peticiones               historial: [{ metodo, url, cuerpo, token, clave }]
    servidor.caerse()                 la próxima petición falla como si no hubiera red
    servidor.responderCon(500)        la próxima petición responde ese código
  Se reinicia antes de cada prueba (setupTests.js).
*/

const copiar = (v) => JSON.parse(JSON.stringify(v))
const slug = (t) => String(t).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
const CUPONES = { SONIDOVIVO10: 0.1, BIENVENIDO5: 0.05 }

class ErrorHttp extends Error {
  constructor(estado, mensaje) {
    super(mensaje)
    this.estado = estado
  }
}
const error = (estado, mensaje) => {
  throw new ErrorHttp(estado, mensaje)
}

function estadoInicial() {
  const categorias = copiar(CATEGORIAS)
  const porNombre = Object.fromEntries(categorias.map((c) => [c.nombre, c.id]))
  return {
    categorias,
    productos: PRODUCTOS.map(({ categoria, ...p }) => ({ ...copiar(p), categoriaId: porNombre[categoria] })),
    usuarios: copiar(USUARIOS),
    boletas: [],
    siguienteBoleta: 1001,
  }
}

export const servidor = {
  db: estadoInicial(),
  peticiones: [],
  falla: null,
  clavesCompra: new Map(), // Idempotency-Key -> id de boleta (como el microservicio pedidos)
  reiniciar() {
    this.db = estadoInicial()
    this.peticiones = []
    this.clavesCompra = new Map()
    this.falla = null
  },
  caerse() {
    this.falla = 'red'
  },
  responderCon(estado, mensaje = 'Error simulado.') {
    this.falla = { estado, mensaje }
  },
  /** Token falso con el que el "backend" reconoce al usuario. */
  tokenDe: (run) => `token-falso.${run}`,
  /** Agrega una boleta directo a la base (para preparar escenarios). */
  agregarBoleta(boleta) {
    const b = { id: this.db.siguienteBoleta++, estado: 'Pagada', cupon: null, descuento: 0, ...copiar(boleta) }
    b.subtotal ??= b.total
    this.db.boletas.push(b)
    return b
  },
}

/* ---------- conversión a la forma de la API (DTO) ---------- */

const db = () => servidor.db
const categoriaDe = (p) => db().categorias.find((c) => c.id === p.categoriaId)
const precioVigente = (p) => (p.oferta && p.precioOferta != null ? p.precioOferta : p.precio)
const productoDTO = (p) => ({ ...copiar(p), categoria: categoriaDe(p)?.nombre ?? '', precioVigente: precioVigente(p), critico: p.stock <= p.stockCritico })
const categoriaDTO = (c) => ({ ...copiar(c), cantidadProductos: db().productos.filter((p) => p.categoriaId === c.id).length })
const usuarioDTO = ({ password: _p, ...u }) => ({ ...copiar(u), fechaNacimiento: u.fechaNacimiento || null })
const ordenar = (lista) => [...lista].sort((a, b) => b.fecha.localeCompare(a.fecha) || b.id - a.id).map(copiar)

function quienEs(config) {
  const auth = config.headers?.Authorization ?? config.headers?.authorization
  const run = auth?.startsWith('Bearer token-falso.') ? auth.slice('Bearer token-falso.'.length) : null
  return run ? db().usuarios.find((u) => u.run === run) ?? null : null
}

function exigir(yo, ...roles) {
  if (!yo) error(401, 'Debes iniciar sesión para acceder a este recurso.')
  if (roles.length && !roles.includes(yo.tipoUsuario)) error(403, 'No tienes permisos para realizar esta acción.')
}

const buscarProducto = (codigo) => db().productos.find((p) => p.codigo === String(codigo).toUpperCase()) ?? error(404, 'No se encontró el producto solicitado.')
const buscarCategoria = (id) => db().categorias.find((c) => c.id === id) ?? error(404, 'No se encontró la categoría.')
const buscarUsuario = (run) => db().usuarios.find((u) => u.run === String(run).toUpperCase()) ?? error(404, 'No se encontró el usuario.')

function validarProducto(d) {
  if (!db().categorias.some((c) => c.id === d.categoriaId)) error(400, 'La categoría seleccionada no existe.')
  if (d.oferta && d.precioOferta > d.precio) error(400, 'El precio de oferta no puede ser mayor al precio normal.')
}

/* ---------- rutas: [método, patrón, manejador(ctx)] ---------- */

const RUTAS = [
  ['post', '/auth/login', ({ cuerpo }) => {
    const u = db().usuarios.find((x) => x.correo.toLowerCase() === String(cuerpo.correo).toLowerCase() && x.password === cuerpo.password)
    if (!u) error(401, 'Correo o contraseña incorrectos.')
    return { token: servidor.tokenDe(u.run), tipo: 'Bearer', usuario: usuarioDTO(u) }
  }],
  ['post', '/auth/registro', ({ cuerpo }) => {
    if (db().usuarios.some((x) => x.correo.toLowerCase() === cuerpo.correo.toLowerCase())) error(409, 'Ya existe un usuario con ese correo.')
    if (db().usuarios.some((x) => x.run === cuerpo.run)) error(409, 'Ya existe un usuario con ese RUN.')
    const u = { ...cuerpo, tipoUsuario: 'Cliente' }
    db().usuarios.push(u)
    return [201, { token: servidor.tokenDe(u.run), tipo: 'Bearer', usuario: usuarioDTO(u) }]
  }],
  ['get', '/auth/me', ({ yo }) => (exigir(yo), usuarioDTO(yo))],

  ['get', '/productos', ({ params }) => {
    const q = String(params.q ?? '').toLowerCase()
    return db().productos
      .filter((p) => !params.categoria || p.categoriaId === params.categoria)
      .filter((p) => !params.oferta || p.oferta)
      .filter((p) => !q || [p.nombre, p.marca, p.modelo, p.codigo].some((c) => String(c ?? '').toLowerCase().includes(q)))
      .map(productoDTO)
  }],
  ['get', '/productos/criticos', ({ yo }) => (exigir(yo, 'Administrador'), db().productos.filter((p) => p.stock <= p.stockCritico).map(productoDTO))],
  ['get', '/productos/:codigo', ({ p }) => productoDTO(buscarProducto(p.codigo))],
  ['post', '/productos', ({ yo, cuerpo }) => {
    exigir(yo, 'Administrador')
    const codigo = cuerpo.codigo.toUpperCase()
    if (db().productos.some((x) => x.codigo === codigo)) error(409, 'Ya existe un producto con ese código.')
    validarProducto(cuerpo)
    const nuevo = { ...cuerpo, codigo, precioOferta: cuerpo.oferta ? cuerpo.precioOferta : null }
    db().productos.push(nuevo)
    return [201, productoDTO(nuevo)]
  }],
  ['put', '/productos/:codigo', ({ yo, cuerpo, p }) => {
    exigir(yo, 'Administrador')
    const actual = buscarProducto(p.codigo)
    validarProducto(cuerpo)
    Object.assign(actual, { ...cuerpo, codigo: actual.codigo })
    return productoDTO(actual)
  }],
  ['delete', '/productos/:codigo', ({ yo, p }) => {
    exigir(yo, 'Administrador')
    const actual = buscarProducto(p.codigo)
    if (db().boletas.some((b) => b.items.some((i) => i.codigo === actual.codigo))) {
      error(409, 'No se puede eliminar el producto porque tiene ventas registradas. Puedes dejar su stock en 0.')
    }
    db().productos = db().productos.filter((x) => x !== actual)
    return [204, null]
  }],

  ['get', '/categorias', () => db().categorias.map(categoriaDTO)],
  ['get', '/categorias/:id', ({ p }) => categoriaDTO(buscarCategoria(p.id))],
  ['post', '/categorias', ({ yo, cuerpo }) => {
    exigir(yo, 'Administrador')
    const id = slug(cuerpo.nombre)
    if (db().categorias.some((c) => c.id === id || c.nombre.toLowerCase() === cuerpo.nombre.toLowerCase())) error(409, 'Ya existe una categoría con ese nombre.')
    const nueva = { id, nombre: cuerpo.nombre, descripcion: cuerpo.descripcion || null, color: '#2A241C' }
    db().categorias.push(nueva)
    return [201, categoriaDTO(nueva)]
  }],
  ['put', '/categorias/:id', ({ yo, cuerpo, p }) => {
    exigir(yo, 'Administrador')
    const c = buscarCategoria(p.id)
    if (db().categorias.some((x) => x.id !== c.id && x.nombre.toLowerCase() === cuerpo.nombre.toLowerCase())) error(409, 'Ya existe una categoría con ese nombre.')
    Object.assign(c, { nombre: cuerpo.nombre, descripcion: cuerpo.descripcion || null })
    return categoriaDTO(c)
  }],
  ['delete', '/categorias/:id', ({ yo, p }) => {
    exigir(yo, 'Administrador')
    const c = buscarCategoria(p.id)
    if (db().productos.some((x) => x.categoriaId === c.id)) error(409, `No se puede eliminar "${c.nombre}" porque tiene productos asociados.`)
    db().categorias = db().categorias.filter((x) => x !== c)
    return [204, null]
  }],

  ['get', '/usuarios/me', ({ yo }) => (exigir(yo), usuarioDTO(yo))],
  ['put', '/usuarios/me', ({ yo, cuerpo }) => {
    exigir(yo)
    const { run: _r, correo: _c, tipoUsuario: _t, password, ...resto } = cuerpo
    Object.assign(yo, resto, password ? { password } : {})
    return usuarioDTO(yo)
  }],
  ['get', '/usuarios/me/boletas', ({ yo }) => (exigir(yo), ordenar(db().boletas.filter((b) => b.cliente.run === yo.run)))],
  ['get', '/usuarios', ({ yo }) => (exigir(yo, 'Administrador'), db().usuarios.map(usuarioDTO))],
  ['get', '/usuarios/:run', ({ yo, p }) => (exigir(yo, 'Administrador'), usuarioDTO(buscarUsuario(p.run)))],
  ['get', '/usuarios/:run/boletas', ({ yo, p }) => {
    exigir(yo, 'Administrador')
    const u = buscarUsuario(p.run)
    return ordenar(db().boletas.filter((b) => b.cliente.run === u.run))
  }],
  ['post', '/usuarios', ({ yo, cuerpo }) => {
    exigir(yo, 'Administrador')
    if (db().usuarios.some((x) => x.correo.toLowerCase() === cuerpo.correo.toLowerCase())) error(409, 'Ya existe un usuario con ese correo.')
    if (db().usuarios.some((x) => x.run === cuerpo.run)) error(409, 'Ya existe un usuario con ese RUN.')
    db().usuarios.push({ ...cuerpo })
    return [201, usuarioDTO(cuerpo)]
  }],
  ['put', '/usuarios/:run', ({ yo, cuerpo, p }) => {
    exigir(yo, 'Administrador')
    const u = buscarUsuario(p.run)
    if (db().usuarios.some((x) => x.run !== u.run && x.correo.toLowerCase() === cuerpo.correo.toLowerCase())) error(409, 'Ya existe un usuario con ese correo.')
    const { password, run: _r, ...resto } = cuerpo
    Object.assign(u, resto, password ? { password } : {})
    return usuarioDTO(u)
  }],
  ['delete', '/usuarios/:run', ({ yo, p }) => {
    exigir(yo, 'Administrador')
    const u = buscarUsuario(p.run)
    if (u.run === yo.run) error(409, 'No puedes eliminar tu propio usuario mientras tienes la sesión iniciada.')
    db().usuarios = db().usuarios.filter((x) => x !== u)
    return [204, null]
  }],

  ['post', '/boletas', ({ yo, cuerpo, clave }) => {
    // Misma Idempotency-Key = misma compra: se devuelve la boleta ya creada sin descontar otra vez
    if (clave && servidor.clavesCompra.has(clave)) return [201, copiar(db().boletas.find((b) => b.id === servidor.clavesCompra.get(clave)))]
    if (!cuerpo.items?.length) error(400, 'El carrito está vacío.')
    let cupon = null
    if (cuerpo.cupon) {
      cupon = String(cuerpo.cupon).trim().toUpperCase()
      if (!CUPONES[cupon]) error(400, `El cupón "${cuerpo.cupon}" no es válido.`)
    }
    const lineas = cuerpo.items.map((i) => {
      const prod = db().productos.find((x) => x.codigo === i.codigo) ?? error(404, `El producto ${i.codigo} ya no existe.`)
      if (prod.stock < i.cantidad) error(409, `No hay stock suficiente de "${prod.nombre}" (disponible: ${prod.stock}).`)
      return { prod, cantidad: i.cantidad }
    })
    const items = lineas.map(({ prod, cantidad }) => {
      prod.stock -= cantidad
      const precio = precioVigente(prod)
      return { codigo: prod.codigo, nombre: prod.nombre, precio, cantidad, subtotal: precio * cantidad }
    })
    const subtotal = items.reduce((a, i) => a + i.subtotal, 0)
    const descuento = cupon ? Math.round(subtotal * CUPONES[cupon]) : 0
    const boleta = servidor.agregarBoleta({
      fecha: new Date().toISOString(),
      cliente: { run: yo?.run ?? null, ...cuerpo.cliente },
      direccion: cuerpo.direccion,
      items, cupon, subtotal, descuento, total: subtotal - descuento,
    })
    if (clave) servidor.clavesCompra.set(clave, boleta.id)
    return [201, copiar(boleta)]
  }],
  ['get', '/boletas', ({ yo }) => (exigir(yo, 'Administrador', 'Vendedor'), ordenar(db().boletas))],
  ['get', '/boletas/:id', ({ yo, p }) => {
    exigir(yo)
    const b = db().boletas.find((x) => String(x.id) === String(p.id)) ?? error(404, 'No se encontró la orden.')
    const esPersonal = ['Administrador', 'Vendedor'].includes(yo.tipoUsuario)
    if (!esPersonal && b.cliente.run !== yo.run) error(403, 'No tienes permisos para realizar esta acción.')
    return copiar(b)
  }],

  ['get', '/reportes/ventas', ({ yo }) => {
    exigir(yo, 'Administrador')
    const boletas = db().boletas
    const totalVendido = boletas.reduce((a, b) => a + b.total, 0)
    const porProducto = new Map()
    const porCategoria = new Map()
    for (const b of boletas) {
      for (const i of b.items) {
        const previo = porProducto.get(i.codigo) ?? { codigo: i.codigo, nombre: i.nombre, unidades: 0, monto: 0 }
        previo.unidades += i.cantidad
        previo.monto += i.precio * i.cantidad
        porProducto.set(i.codigo, previo)
        const prod = db().productos.find((p) => p.codigo === i.codigo)
        const cat = prod ? categoriaDe(prod)?.nombre : 'Sin categoría'
        porCategoria.set(cat, (porCategoria.get(cat) ?? 0) + i.precio * i.cantidad)
      }
    }
    return {
      cantidadOrdenes: boletas.length,
      totalVendido,
      ticketPromedio: boletas.length ? Math.round(totalVendido / boletas.length) : 0,
      unidadesEnStock: db().productos.reduce((a, p) => a + p.stock, 0),
      topProductos: [...porProducto.values()].sort((a, b) => b.unidades - a.unidades).slice(0, 5),
      porCategoria: [...porCategoria.entries()].map(([categoria, monto]) => ({ categoria, monto })).sort((a, b) => b.monto - a.monto),
    }
  }],
]

function coincide(patron, ruta) {
  const a = patron.split('/')
  const b = ruta.split('/')
  if (a.length !== b.length) return null
  const p = {}
  for (let i = 0; i < a.length; i++) {
    if (a[i].startsWith(':')) p[a[i].slice(1)] = decodeURIComponent(b[i])
    else if (a[i] !== b[i]) return null
  }
  return p
}

async function adaptador(config) {
  const metodo = (config.method ?? 'get').toLowerCase()
  const ruta = (config.url ?? '').split('?')[0]
  const cuerpo = typeof config.data === 'string' ? JSON.parse(config.data) : config.data ?? {}
  const yo = quienEs(config)
  const clave = config.headers?.['Idempotency-Key'] ?? null
  servidor.peticiones.push({ metodo, url: ruta, cuerpo, token: config.headers?.Authorization ?? null, clave })

  const responder = (status, data) => {
    const respuesta = { data, status, statusText: String(status), headers: {}, config, request: {} }
    if (status >= 400) {
      throw new AxiosError(`Request failed with status code ${status}`, AxiosError.ERR_BAD_RESPONSE, config, {}, respuesta)
    }
    return respuesta
  }

  await Promise.resolve() // la respuesta siempre llega de forma asíncrona, como en la red

  if (servidor.falla === 'red') {
    servidor.falla = null
    throw new AxiosError('Network Error', AxiosError.ERR_NETWORK, config, {})
  }
  if (servidor.falla) {
    const { estado, mensaje } = servidor.falla
    servidor.falla = null
    return responder(estado, { estado, mensaje })
  }

  for (const [m, patron, manejar] of RUTAS) {
    if (m !== metodo) continue
    const p = coincide(patron, ruta)
    if (!p) continue
    try {
      const resultado = manejar({ yo, cuerpo, p, clave, params: config.params ?? {} })
      const [status, data] = Array.isArray(resultado) && typeof resultado[0] === 'number' ? resultado : [200, resultado]
      return responder(status, data)
    } catch (e) {
      if (e instanceof ErrorHttp) return responder(e.estado, { estado: e.estado, mensaje: e.message })
      throw e
    }
  }
  return responder(404, { estado: 404, mensaje: 'La ruta solicitada no existe.' })
}

/** Conecta el servidor falso al cliente axios de la app (lo llama setupTests.js). */
export function instalarServidorFalso() {
  api.defaults.adapter = adaptador
}
