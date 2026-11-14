import { api, datos } from './cliente'

/* Reportes (solo Administrador): el cálculo lo hace el backend (ReporteServicio). */
export const reportesApi = {
  ventas: () => datos(api.get('/reportes/ventas')),
}
