import { api, datos } from './cliente'

const ruta = (run) => `/usuarios/${encodeURIComponent(run)}`

/* Servicio de usuarios: CRUD solo Administrador; /me para la propia cuenta. */
export const usuariosApi = {
  listar: () => datos(api.get('/usuarios')),
  obtener: (run) => datos(api.get(ruta(run))),
  historial: (run) => datos(api.get(`${ruta(run)}/boletas`)),
  crear: (usuario) => datos(api.post('/usuarios', usuario)),
  actualizar: (run, usuario) => datos(api.put(ruta(run), usuario)),
  eliminar: (run) => datos(api.delete(ruta(run))),
  miPerfil: () => datos(api.get('/usuarios/me')),
  actualizarPerfil: (perfil) => datos(api.put('/usuarios/me', perfil)),
  misBoletas: () => datos(api.get('/usuarios/me/boletas')),
}
