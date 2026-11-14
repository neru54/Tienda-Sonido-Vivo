import { useState } from 'react'
import { Link, useLocation, useSearchParams } from 'react-router-dom'
import { boletasApi } from '../api/boletas'
import { estadoHttp } from '../api/cliente'
import AlertMessage from '../components/AlertMessage'
import EstadoCarga from '../components/EstadoCarga'
import OrderSummary from '../components/OrderSummary'
import { useColeccion } from '../hooks/useColeccion'
import { formatearFecha } from '../utils/formato'

/*
  PagoCorrecto: confirmación de compra.
  - Recién pagado, la boleta llega en el `state` de la navegación (la respuesta del POST),
    así un invitado ve su comprobante sin pedir nada más a la API.
  - Si se recarga la página, se pide GET /boletas/:id: funciona para el dueño (con sesión) o el
    personal; un invitado o un tercero recibe 401/403 y se muestra "no se encontró".
  "Imprimir boleta" usa window.print(); el CSS de impresión oculta navbar y botones (.no-print).
*/
const SIN_ACCESO = [401, 403, 404]

export default function PagoCorrecto() {
  const [params] = useSearchParams()
  const { state } = useLocation()
  const id = params.get('orden')
  const enNavegacion = state?.boleta && String(state.boleta.id) === String(id) ? state.boleta : null
  const [emailEnviado, setEmailEnviado] = useState(false)
  const { datos, cargando, error, recargar } = useColeccion(
    () => (enNavegacion ? Promise.resolve(enNavegacion) : id ? boletasApi.obtener(id) : Promise.reject({ response: { status: 404 } })),
    [id],
  )

  if (error && (SIN_ACCESO.includes(estadoHttp(error)) || !id)) {
    return (
      <>
        <AlertMessage tipo="warning" mensaje="No se encontró la orden indicada." />
        <Link to="/">Volver al inicio</Link>
      </>
    )
  }
  if (cargando || error) return <EstadoCarga cargando={cargando} error={error} onReintentar={recargar} />
  const orden = datos

  return (
    <div className="mx-auto" style={{ maxWidth: 720 }}>
      <div className="text-center mb-4">
        <h1 className="h3 text-success">Se ha realizado la compra nro #{orden.id}</h1>
        <p className="text-muted mb-0">{formatearFecha(orden.fecha)}</p>
      </div>

      <div className="card mb-3">
        <div className="card-body">
          <h2 className="h6">Datos de entrega</h2>
          <p className="mb-0 small">
            {orden.cliente.nombre} {orden.cliente.apellidos} · {orden.cliente.correo}<br />
            {orden.direccion.calle}{orden.direccion.departamento ? `, depto. ${orden.direccion.departamento}` : ''}, {orden.direccion.comuna}, {orden.direccion.region}
            {orden.direccion.indicaciones && <><br />Indicaciones: {orden.direccion.indicaciones}</>}
          </p>
        </div>
      </div>

      <OrderSummary items={orden.items} total={orden.total} descuento={orden.descuento} cupon={orden.cupon} />

      <div className="mt-3">
        <AlertMessage tipo="success" mensaje={emailEnviado ? `Boleta enviada a ${orden.cliente.correo} (simulado).` : ''} />
      </div>
      <div className="d-flex flex-wrap gap-2 justify-content-center no-print">
        <button type="button" className="btn btn-primary" onClick={() => window.print()}>Imprimir boleta</button>
        <button type="button" className="btn btn-outline-primary" onClick={() => setEmailEnviado(true)}>Enviar por email</button>
        <Link to="/productos" className="btn btn-outline-secondary">Seguir comprando</Link>
      </div>
    </div>
  )
}
