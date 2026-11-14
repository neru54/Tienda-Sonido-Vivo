import { useState } from 'react'
import { Link } from 'react-router-dom'
import { mensajeDeError } from '../../api/cliente'
import { usuariosApi } from '../../api/usuarios'
import AlertMessage from '../../components/AlertMessage'
import ConfirmButton from '../../components/ConfirmButton'
import EstadoCarga from '../../components/EstadoCarga'
import { useColeccion } from '../../hooks/useColeccion'

/*
  UsuariosAdmin (solo Administrador): GET /usuarios. Eliminar = DELETE /usuarios/:run.
  El backend impide eliminar a quien tiene la sesión (409) y conserva las boletas del eliminado.
*/
export default function UsuariosAdmin() {
  const { datos: usuarios, cargando, error: errorCarga, recargar, setDatos } = useColeccion(() => usuariosApi.listar(), [])
  const [error, setError] = useState('')

  const borrar = async (u) => {
    setError('')
    try {
      await usuariosApi.eliminar(u.run)
      setDatos((lista) => lista.filter((x) => x.run !== u.run))
    } catch (e) {
      setError(mensajeDeError(e, 'No se pudo eliminar el usuario.'))
    }
  }

  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h1 className="h3 mb-0">Usuarios</h1>
        <Link to="/admin/usuarios/nuevo" className="btn btn-primary">Nuevo usuario</Link>
      </div>
      <AlertMessage tipo="danger" mensaje={error} />
      <EstadoCarga cargando={cargando} error={errorCarga} onReintentar={recargar} />
      {usuarios && (
        <div className="table-responsive">
          <table className="table table-hover align-middle">
            <thead><tr><th>RUN</th><th>Nombre</th><th>Correo</th><th>Tipo</th><th /></tr></thead>
            <tbody>
              {usuarios.map((u) => (
                <tr key={u.run}>
                  <td>{u.run}</td>
                  <td>{u.nombre} {u.apellidos}</td>
                  <td>{u.correo}</td>
                  <td><span className="badge text-bg-secondary">{u.tipoUsuario}</span></td>
                  <td className="text-end text-nowrap">
                    <Link to={`/admin/usuarios/${u.run}/historial`} className="btn btn-sm btn-outline-secondary me-1">Historial</Link>
                    <Link to={`/admin/usuarios/${u.run}/editar`} className="btn btn-sm btn-outline-primary me-1">Editar</Link>
                    <ConfirmButton mensaje="¿Eliminar?" onConfirm={() => borrar(u)} />
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
