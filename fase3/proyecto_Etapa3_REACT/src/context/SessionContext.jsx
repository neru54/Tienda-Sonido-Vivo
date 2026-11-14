import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { CLAVE_TOKEN, EVENTO_SESION_EXPIRADA } from '../api/cliente'

/*
  Sesión de usuario (Context). Estado: el usuario actual (o null) y su JWT.
  Ambos se guardan en sessionStorage: sobreviven a recargar la página, pero se borran al
  cerrar la pestaña. El token lo agrega el interceptor de axios (api/cliente.js) a cada
  petición; aquí solo se guarda o se borra.
  Si el backend responde 401 con un token (venció), el interceptor emite EVENTO_SESION_EXPIRADA
  y esta sesión se cierra sola.
  Nota: el rol guardado aquí solo decide qué se MUESTRA; quien realmente autoriza es el backend.
*/
export const CLAVE_SESION = 'sonidoVivoSesion'

function leerSesion() {
  try {
    if (!sessionStorage.getItem(CLAVE_TOKEN)) return null
    return JSON.parse(sessionStorage.getItem(CLAVE_SESION)) || null
  } catch {
    return null
  }
}

function guardar(token, usuario) {
  try {
    sessionStorage.setItem(CLAVE_TOKEN, token)
    sessionStorage.setItem(CLAVE_SESION, JSON.stringify(usuario))
  } catch {
    /* almacenamiento bloqueado: la sesión dura hasta recargar */
  }
}

function borrar() {
  try {
    sessionStorage.removeItem(CLAVE_TOKEN)
    sessionStorage.removeItem(CLAVE_SESION)
  } catch {
    /* nada que borrar */
  }
}

const SessionContext = createContext(null)

export function SessionProvider({ children }) {
  const [usuario, setUsuario] = useState(leerSesion)
  const [expirada, setExpirada] = useState(false)

  useEffect(() => {
    const alExpirar = () => {
      borrar()
      setUsuario(null)
      setExpirada(true)
    }
    window.addEventListener(EVENTO_SESION_EXPIRADA, alExpirar)
    return () => window.removeEventListener(EVENTO_SESION_EXPIRADA, alExpirar)
  }, [])

  const valor = useMemo(
    () => ({
      usuario,
      expirada,
      /** Recibe la respuesta del login/registro: { token, usuario }. */
      iniciarSesion: ({ token, usuario: datos }) => {
        // por si acaso: la contraseña nunca se guarda en la sesión
        const { password: _omitida, ...seguro } = datos
        guardar(token, seguro)
        setUsuario(seguro)
        setExpirada(false)
      },
      /** Refresca los datos mostrados (p. ej. tras editar el perfil) sin tocar el token. */
      actualizarUsuario: (datos) => {
        const { password: _omitida, ...seguro } = datos
        try {
          sessionStorage.setItem(CLAVE_SESION, JSON.stringify(seguro))
        } catch {
          /* sin almacenamiento */
        }
        setUsuario(seguro)
      },
      cerrarSesion: () => {
        borrar()
        setUsuario(null)
        setExpirada(false)
      },
    }),
    [usuario, expirada],
  )

  return <SessionContext.Provider value={valor}>{children}</SessionContext.Provider>
}

export function useSession() {
  const ctx = useContext(SessionContext)
  if (!ctx) throw new Error('useSession debe usarse dentro de <SessionProvider>')
  return ctx
}
