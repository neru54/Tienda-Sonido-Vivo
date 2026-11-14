import { api, datos } from './cliente'

/* Servicio de categorías: /api/v1/categorias (lectura pública; escritura solo Administrador). */
export const categoriasApi = {
  listar: () => datos(api.get('/categorias')),
  obtener: (id) => datos(api.get(`/categorias/${encodeURIComponent(id)}`)),
  crear: (categoria) => datos(api.post('/categorias', categoria)),
  actualizar: (id, categoria) => datos(api.put(`/categorias/${encodeURIComponent(id)}`, categoria)),
  eliminar: (id) => datos(api.delete(`/categorias/${encodeURIComponent(id)}`)),
}
