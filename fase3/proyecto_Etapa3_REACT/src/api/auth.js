import { api, datos } from './cliente'

/* Autenticación: devuelve { token, tipo, expiraEn, usuario }. */
export const authApi = {
  login: (correo, password) => datos(api.post('/auth/login', { correo: String(correo).trim(), password })),
  registrar: (usuario) => datos(api.post('/auth/registro', usuario)),
  yo: () => datos(api.get('/auth/me')),
}
