import { useCallback, useEffect, useRef, useState } from 'react'

/*
  useColeccion: carga datos asíncronos (una llamada a la API) y expone su estado.
  Reemplaza a las lecturas síncronas de db.js de la Etapa 2.

    const { datos, cargando, error, recargar, setDatos } = useColeccion(() => productosApi.listar(), [])

  - `cargar` es una función que devuelve una Promesa.
  - `deps`: cuando cambian, se vuelve a cargar (p. ej. el código de la URL).
  - `recargar()` repite la llamada (botón "Reintentar" o después de eliminar algo).
  - Si el componente se desmonta o cambian las deps antes de que llegue la respuesta,
    esa respuesta vieja se descarta (evita mostrar datos de otra página).
*/
export function useColeccion(cargar, deps = [], { inicial = null } = {}) {
  const [estado, setEstado] = useState({ datos: inicial, cargando: true, error: null })
  const [version, setVersion] = useState(0)
  const cargarRef = useRef(cargar)
  cargarRef.current = cargar

  useEffect(() => {
    let vigente = true
    const cargarEsta = cargarRef.current // la función de ESTE render (no la de uno posterior)
    setEstado((e) => ({ ...e, cargando: true, error: null }))
    Promise.resolve()
      .then(() => cargarEsta())
      .then((datos) => {
        if (vigente) setEstado({ datos, cargando: false, error: null })
      })
      .catch((error) => {
        if (vigente) setEstado({ datos: inicial, cargando: false, error })
      })
    return () => {
      vigente = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, version])

  const recargar = useCallback(() => setVersion((v) => v + 1), [])
  const setDatos = useCallback((actualizar) => {
    setEstado((e) => ({ ...e, datos: typeof actualizar === 'function' ? actualizar(e.datos) : actualizar }))
  }, [])

  return { ...estado, recargar, setDatos }
}
