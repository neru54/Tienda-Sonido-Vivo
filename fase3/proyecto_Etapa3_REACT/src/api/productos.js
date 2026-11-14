import { api, datos } from './cliente'

/* Servicio de productos: /api/v1/productos (lectura pública; escritura solo Administrador). */
export const productosApi = {
  /** filtros opcionales: { categoria (id), q (texto), oferta (true) } */
  listar: (filtros = {}) => datos(api.get('/productos', { params: filtros })),
  obtener: (codigo) => datos(api.get(`/productos/${encodeURIComponent(codigo)}`)),
  criticos: () => datos(api.get('/productos/criticos')),
  crear: (producto) => datos(api.post('/productos', producto)),
  actualizar: (codigo, producto) => datos(api.put(`/productos/${encodeURIComponent(codigo)}`, producto)),
  eliminar: (codigo) => datos(api.delete(`/productos/${encodeURIComponent(codigo)}`)),
}
