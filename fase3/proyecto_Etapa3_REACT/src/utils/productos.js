/*
  Reglas puras sobre productos para la INTERFAZ (mostrar precios, filtrar en vivo).
  Las reglas que deciden datos reales (precio cobrado, stock, validaciones) las aplica el backend;
  estas funciones solo evitan esperar al servidor para dibujar la pantalla.
*/

export const STOCK_CRITICO_DEFAULT = 3

/** Un producto es crítico cuando su stock es menor o igual a su stock crítico. */
export function esStockCritico(producto) {
  const limite = producto.stockCritico ?? STOCK_CRITICO_DEFAULT
  return producto.stock <= limite
}

/** Precio que realmente se cobra: el de oferta si está en oferta. */
export function precioVigente(producto) {
  return producto.oferta && producto.precioOferta != null ? producto.precioOferta : producto.precio
}

/**
 * Filtra por texto (nombre, marca, modelo, código) y por categoría (nombre).
 * categoria '' o 'todas' = sin filtro de categoría.
 */
export function filtrarProductos(productos, { texto = '', categoria = '' } = {}) {
  const busca = texto.trim().toLowerCase()
  return productos.filter((p) => {
    const coincideCategoria = !categoria || categoria === 'todas' || p.categoria === categoria
    const coincideTexto =
      !busca || [p.nombre, p.marca, p.modelo, p.codigo].some((c) => String(c ?? '').toLowerCase().includes(busca))
    return coincideCategoria && coincideTexto
  })
}

const entero = (v) => parseInt(String(v).trim(), 10)

/**
 * Convierte los valores (todo texto) del formulario de producto en el cuerpo que espera
 * POST/PUT /api/v1/productos (ProductoRequest). Precios en pesos chilenos enteros.
 * Si el stock crítico viene vacío se usa el valor por defecto.
 */
export function valoresAProducto(v) {
  const enOferta = Boolean(v.oferta)
  return {
    codigo: String(v.codigo).trim(),
    nombre: String(v.nombre).trim(),
    categoriaId: v.categoriaId,
    marca: String(v.marca ?? '').trim(),
    modelo: String(v.modelo ?? '').trim(),
    descripcion: String(v.descripcion ?? '').trim(),
    imagen: String(v.imagen ?? '').trim(),
    precio: entero(v.precio),
    stock: entero(v.stock),
    stockCritico: String(v.stockCritico ?? '').trim() === '' ? STOCK_CRITICO_DEFAULT : entero(v.stockCritico),
    oferta: enOferta,
    precioOferta: enOferta ? entero(v.precioOferta) : null,
  }
}

/** Operación inversa: producto de la API -> valores de texto para rellenar el formulario. */
export function productoAValores(p) {
  return {
    codigo: p.codigo,
    nombre: p.nombre,
    categoriaId: p.categoriaId ?? '',
    marca: p.marca ?? '',
    modelo: p.modelo ?? '',
    descripcion: p.descripcion ?? '',
    imagen: p.imagen ?? '',
    precio: String(p.precio),
    stock: String(p.stock),
    stockCritico: p.stockCritico == null ? '' : String(p.stockCritico),
    oferta: Boolean(p.oferta),
    precioOferta: p.precioOferta == null ? '' : String(p.precioOferta),
  }
}
