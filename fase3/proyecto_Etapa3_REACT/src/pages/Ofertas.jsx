import { productosApi } from '../api/productos'
import EstadoCarga from '../components/EstadoCarga'
import ProductGrid from '../components/ProductGrid'
import { useCart } from '../context/CartContext'
import { useColeccion } from '../hooks/useColeccion'

/* Ofertas: GET /productos?oferta=true (el filtro lo hace el backend). Reutiliza ProductGrid. */
export default function Ofertas() {
  const { datos, cargando, error, recargar } = useColeccion(() => productosApi.listar({ oferta: true }), [])
  const { agregar } = useCart()
  return (
    <>
      <h1 className="h3 mb-4">Ofertas</h1>
      <EstadoCarga cargando={cargando} error={error} onReintentar={recargar} />
      {datos && <ProductGrid productos={datos} onAgregar={agregar} mensajeVacio="No hay productos en oferta" />}
    </>
  )
}
