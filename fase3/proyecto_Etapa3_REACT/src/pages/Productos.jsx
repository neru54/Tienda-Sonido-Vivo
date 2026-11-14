import { useState } from 'react'
import { categoriasApi } from '../api/categorias'
import { productosApi } from '../api/productos'
import EstadoCarga from '../components/EstadoCarga'
import ProductGrid from '../components/ProductGrid'
import SearchBar from '../components/SearchBar'
import { useCart } from '../context/CartContext'
import { useColeccion } from '../hooks/useColeccion'
import { filtrarProductos } from '../utils/productos'

/*
  Productos: catálogo con búsqueda y filtro por categoría.
  Los datos llegan UNA vez desde la API (useColeccion); el filtrado es local y en vivo
  mientras se escribe, así no se hace una petición por cada tecla.
  Estado local (useState): `texto` y `categoria` (lo que el usuario eligió).
*/
export default function Productos() {
  const { datos, cargando, error, recargar } = useColeccion(
    () => Promise.all([productosApi.listar(), categoriasApi.listar()]).then(([productos, categorias]) => ({ productos, categorias })),
    [],
  )
  const { agregar } = useCart()
  const [texto, setTexto] = useState('')
  const [categoria, setCategoria] = useState('')

  const visibles = filtrarProductos(datos?.productos ?? [], { texto, categoria })

  return (
    <>
      <h1 className="h3 mb-4">Productos</h1>
      <div className="row g-2 mb-4">
        <div className="col-12 col-md-8">
          <SearchBar value={texto} onCambio={setTexto} />
        </div>
        <div className="col-12 col-md-4">
          <select className="form-select" aria-label="Filtrar por categoría" value={categoria} onChange={(e) => setCategoria(e.target.value)}>
            <option value="">Todas las categorías</option>
            {(datos?.categorias ?? []).map((c) => (
              <option key={c.id} value={c.nombre}>{c.nombre}</option>
            ))}
          </select>
        </div>
      </div>
      <EstadoCarga cargando={cargando} error={error} onReintentar={recargar} />
      {datos && (
        <>
          <p className="text-muted small" aria-live="polite">{visibles.length} producto(s)</p>
          <ProductGrid productos={visibles} onAgregar={agregar} />
        </>
      )}
    </>
  )
}
