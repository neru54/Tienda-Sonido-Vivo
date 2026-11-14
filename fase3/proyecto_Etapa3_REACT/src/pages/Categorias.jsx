import { useParams } from 'react-router-dom'
import { categoriasApi } from '../api/categorias'
import { productosApi } from '../api/productos'
import CategoryCard from '../components/CategoryCard'
import EstadoCarga from '../components/EstadoCarga'
import ProductGrid from '../components/ProductGrid'
import { useCart } from '../context/CartContext'
import { useColeccion } from '../hooks/useColeccion'

/*
  Categorias: tarjetas de categorías + productos de la seleccionada.
  La categoría seleccionada vive en la URL (/categorias/:id), no en un useState:
  así se puede compartir el enlace y funciona el botón "atrás".
  Las categorías se piden una vez; los productos de la elegida se piden a
  GET /productos?categoria=:id cada vez que cambia el id de la URL.
*/
export default function Categorias() {
  const { id } = useParams()
  const { agregar } = useCart()
  const cats = useColeccion(() => categoriasApi.listar(), [])
  const prods = useColeccion(() => (id ? productosApi.listar({ categoria: id }) : Promise.resolve([])), [id])

  const categorias = cats.datos ?? []
  const seleccionada = categorias.find((c) => c.id === id)

  return (
    <>
      <h1 className="h3 mb-4">Categorías</h1>
      <EstadoCarga cargando={cats.cargando} error={cats.error} onReintentar={cats.recargar} />
      {cats.datos && (
        <>
          <div className="row row-cols-2 row-cols-md-3 row-cols-lg-5 g-3 mb-5">
            {categorias.map((c) => (
              <div className="col" key={c.id}>
                <CategoryCard categoria={c} activa={c.id === id} cantidad={c.cantidadProductos} />
              </div>
            ))}
          </div>

          {seleccionada ? (
            <>
              <h2 className="h4 mb-3">{seleccionada.nombre}</h2>
              <EstadoCarga cargando={prods.cargando} error={prods.error} onReintentar={prods.recargar} />
              {prods.datos && !prods.cargando && <ProductGrid productos={prods.datos} onAgregar={agregar} />}
            </>
          ) : (
            <p className="text-muted">{id ? 'La categoría solicitada no existe.' : 'Elige una categoría para ver sus productos.'}</p>
          )}
        </>
      )}
    </>
  )
}
