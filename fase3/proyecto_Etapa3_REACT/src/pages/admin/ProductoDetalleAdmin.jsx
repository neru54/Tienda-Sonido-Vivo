import { Link, useParams } from 'react-router-dom'
import { esNoEncontrado } from '../../api/cliente'
import { productosApi } from '../../api/productos'
import AlertMessage from '../../components/AlertMessage'
import CriticalBadge from '../../components/CriticalBadge'
import EstadoCarga from '../../components/EstadoCarga'
import { useSession } from '../../context/SessionContext'
import { useColeccion } from '../../hooks/useColeccion'
import { formatearCLP } from '../../utils/formato'
import { puede } from '../../utils/roles'

/* ProductoDetalleAdmin: ficha de solo lectura (Administrador y Vendedor). El botón Editar solo aparece al Administrador. */
export default function ProductoDetalleAdmin() {
  const { codigo } = useParams()
  const { usuario } = useSession()
  const { datos: p, cargando, error, recargar } = useColeccion(() => productosApi.obtener(codigo), [codigo])

  if (esNoEncontrado(error)) {
    return (
      <>
        <AlertMessage tipo="warning" mensaje="No se encontró el producto solicitado." />
        <Link to="/admin/productos">Volver al listado</Link>
      </>
    )
  }
  if (cargando || error) return <EstadoCarga cargando={cargando} error={error} onReintentar={recargar} />

  const filas = [
    ['Código', p.codigo],
    ['Categoría', p.categoria],
    ['Marca / modelo', [p.marca, p.modelo].filter(Boolean).join(' ') || '—'],
    ['Precio', formatearCLP(p.precio)],
    ['Oferta', p.oferta ? `Sí · ${formatearCLP(p.precioOferta)}` : 'No'],
    ['Stock', <>{p.stock} <CriticalBadge producto={p} /></>],
    ['Stock crítico', p.stockCritico],
  ]

  return (
    <div style={{ maxWidth: 820 }}>
      <h1 className="h3 mb-3">{p.nombre}</h1>
      <div className="row g-4">
        <div className="col-12 col-md-4">
          {p.imagen && <img src={p.imagen} alt={p.nombre} className="img-fluid rounded bg-white p-2 border" />}
        </div>
        <div className="col-12 col-md-8">
          <table className="table table-sm">
            <tbody>
              {filas.map(([k, v]) => <tr key={k}><th scope="row" className="w-25">{k}</th><td>{v}</td></tr>)}
            </tbody>
          </table>
          {p.descripcion && <p className="text-muted">{p.descripcion}</p>}
          <div className="d-flex gap-2">
            {puede(usuario, 'productos.editar') && <Link to={`/admin/productos/${p.codigo}/editar`} className="btn btn-primary">Editar</Link>}
            <Link to="/admin/productos" className="btn btn-outline-secondary">← Volver al listado</Link>
          </div>
        </div>
      </div>
    </div>
  )
}
