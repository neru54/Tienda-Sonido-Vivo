import { mensajeDeError } from '../api/cliente'

/*
  EstadoCarga: lo que se ve mientras llega una respuesta de la API o cuando falló.
  - cargando: spinner de Bootstrap con texto accesible ("Cargando...").
  - error: aviso rojo con el mensaje del backend y un botón "Reintentar".
  Si no hay ni carga ni error no dibuja nada.
*/
export default function EstadoCarga({ cargando, error, onReintentar, texto = 'Cargando…' }) {
  if (cargando) {
    return (
      <div className="d-flex align-items-center gap-2 text-muted py-4" role="status" aria-live="polite">
        <span className="spinner-border spinner-border-sm" aria-hidden="true" />
        <span>{texto}</span>
      </div>
    )
  }
  if (error) {
    return (
      <div className="alert alert-danger d-flex flex-wrap align-items-center justify-content-between gap-2" role="alert">
        <span>{mensajeDeError(error)}</span>
        {onReintentar && (
          <button type="button" className="btn btn-sm btn-outline-danger" onClick={onReintentar}>Reintentar</button>
        )}
      </div>
    )
  }
  return null
}
