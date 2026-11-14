import axios from 'axios'

/*
  Cliente HTTP único de la app (axios). Todas las llamadas al backend pasan por aquí:

  - baseURL: VITE_API_URL (archivo .env) o, por defecto, el API Gateway local (puerto 8080), que
    reparte cada ruta entre los microservicios usuarios, catalogo y pedidos.
  - Interceptor de PETICIÓN: si hay sesión, agrega "Authorization: Bearer <token>" a cada llamada,
    así ningún servicio tiene que acordarse de mandar el token.
  - Interceptor de RESPUESTA: si el backend contesta 401 teniendo un token (venció o es inválido),
    avisa con el evento EVENTO_SESION_EXPIRADA y SessionContext cierra la sesión.

  El token vive en sessionStorage (se borra al cerrar la pestaña), no en localStorage.
*/
export const URL_API = import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1'
export const CLAVE_TOKEN = 'sonidoVivoToken'
export const EVENTO_SESION_EXPIRADA = 'sonidovivo:sesion-expirada'

export function leerToken() {
  try {
    return sessionStorage.getItem(CLAVE_TOKEN)
  } catch {
    return null
  }
}

export const api = axios.create({
  baseURL: URL_API,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
  const token = leerToken()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (respuesta) => respuesta,
  (error) => {
    if (error.response?.status === 401 && error.config?.headers?.Authorization) {
      window.dispatchEvent(new Event(EVENTO_SESION_EXPIRADA))
    }
    return Promise.reject(error)
  },
)

/** Extrae los datos de la respuesta (así los servicios devuelven directamente el JSON). */
export const datos = (promesa) => promesa.then((r) => r.data)

/** Código HTTP de un error de axios (undefined si no hubo respuesta: servidor caído, sin red...). */
export const estadoHttp = (error) => error?.response?.status

export const esNoEncontrado = (error) => estadoHttp(error) === 404

/**
 * Mensaje para mostrar al usuario. El backend siempre responde { mensaje } en sus errores;
 * si no hubo respuesta, se explica que no se pudo conectar.
 */
export function mensajeDeError(error, porDefecto = 'Ocurrió un error inesperado. Inténtalo nuevamente.') {
  const mensaje = error?.response?.data?.mensaje
  if (mensaje) return mensaje
  if (error?.response) return porDefecto
  if (error?.request || error?.code === 'ECONNABORTED' || error?.code === 'ERR_NETWORK') {
    return 'No se pudo conectar con el servidor. Revisa tu conexión o que la API esté en ejecución.'
  }
  return error?.message || porDefecto
}
