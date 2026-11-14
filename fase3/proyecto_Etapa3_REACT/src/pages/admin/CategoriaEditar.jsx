import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { categoriasApi } from '../../api/categorias'
import { esNoEncontrado, mensajeDeError } from '../../api/cliente'
import AlertMessage from '../../components/AlertMessage'
import CategoriaForm from '../../components/CategoriaForm'
import EstadoCarga from '../../components/EstadoCarga'
import { useColeccion } from '../../hooks/useColeccion'

/*
  CategoriaEditar: PUT /categorias/:id. En la Etapa 2 había que renombrar a mano la categoría de cada
  producto; ahora los productos guardan la clave foránea (categoria_id), así que basta con cambiar el nombre.
  El backend no deja repetir el nombre de otra categoría (409).
*/
export default function CategoriaEditar() {
  const { id } = useParams()
  const navegar = useNavigate()
  const [error, setError] = useState('')
  const [guardando, setGuardando] = useState(false)
  const { datos: categoria, cargando, error: errorCarga, recargar } = useColeccion(() => categoriasApi.obtener(id), [id])

  if (esNoEncontrado(errorCarga)) {
    return (
      <>
        <AlertMessage tipo="warning" mensaje="No se encontró la categoría." />
        <Link to="/admin/categorias">Volver al listado</Link>
      </>
    )
  }
  if (cargando || errorCarga) return <EstadoCarga cargando={cargando} error={errorCarga} onReintentar={recargar} />

  const guardar = async ({ nombre, descripcion }) => {
    setError('')
    setGuardando(true)
    try {
      await categoriasApi.actualizar(id, { nombre: nombre.trim(), descripcion: descripcion.trim() })
      navegar('/admin/categorias')
    } catch (e) {
      setError(mensajeDeError(e, 'No se pudo guardar la categoría.'))
      setGuardando(false)
    }
  }

  return (
    <>
      <h1 className="h3 mb-4">Editar categoría</h1>
      <CategoriaForm
        inicial={{ nombre: categoria.nombre, descripcion: categoria.descripcion ?? '' }}
        modoEdicion
        onGuardar={guardar}
        errorGeneral={error}
        guardando={guardando}
      />
    </>
  )
}
