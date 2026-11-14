import { useState } from 'react'
import { Link } from 'react-router-dom'
import { categoriasApi } from '../../api/categorias'
import { mensajeDeError } from '../../api/cliente'
import AlertMessage from '../../components/AlertMessage'
import ConfirmButton from '../../components/ConfirmButton'
import EstadoCarga from '../../components/EstadoCarga'
import { useColeccion } from '../../hooks/useColeccion'

/*
  CategoriasAdmin: listado (GET /categorias trae cuántos productos tiene cada una).
  Regla de negocio, ahora en el backend: no se puede borrar una categoría con productos;
  la API responde 409 y aquí se muestra su mensaje.
*/
export default function CategoriasAdmin() {
  const { datos: categorias, cargando, error: errorCarga, recargar, setDatos } = useColeccion(() => categoriasApi.listar(), [])
  const [error, setError] = useState('')

  const borrar = async (c) => {
    setError('')
    try {
      await categoriasApi.eliminar(c.id)
      setDatos((lista) => lista.filter((x) => x.id !== c.id))
    } catch (e) {
      setError(mensajeDeError(e, 'No se pudo eliminar la categoría.'))
    }
  }

  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h1 className="h3 mb-0">Categorías</h1>
        <Link to="/admin/categorias/nueva" className="btn btn-primary">Nueva categoría</Link>
      </div>
      <AlertMessage tipo="danger" mensaje={error} />
      <EstadoCarga cargando={cargando} error={errorCarga} onReintentar={recargar} />
      {categorias && (
        <div className="table-responsive">
          <table className="table table-hover align-middle">
            <thead><tr><th>Nombre</th><th>Descripción</th><th className="text-end">Productos</th><th /></tr></thead>
            <tbody>
              {categorias.map((c) => (
                <tr key={c.id}>
                  <td>{c.nombre}</td>
                  <td className="small text-muted">{c.descripcion}</td>
                  <td className="text-end">{c.cantidadProductos}</td>
                  <td className="text-end text-nowrap">
                    <Link to={`/admin/categorias/${c.id}/editar`} className="btn btn-sm btn-outline-primary me-1">Editar</Link>
                    <ConfirmButton mensaje="¿Eliminar?" onConfirm={() => borrar(c)} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  )
}
