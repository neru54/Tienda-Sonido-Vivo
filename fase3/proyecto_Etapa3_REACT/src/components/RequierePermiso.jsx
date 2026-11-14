import { Link, Navigate } from 'react-router-dom'
import AlertMessage from './AlertMessage'
import { useSession } from '../context/SessionContext'
import { inicioDelPanel, puede } from '../utils/roles'

/*
  RequierePermiso: protege una ruta del panel. Si el rol no tiene el permiso:
  - en la portada del panel (/admin), redirige a la primera página que sí puede ver;
  - en cualquier otra ruta, muestra "sin permisos" (pasa si alguien escribe la URL a mano).
*/
export default function RequierePermiso({ permiso, redirigir = false, children }) {
  const { usuario } = useSession()
  if (puede(usuario, permiso)) return children
  if (redirigir) return <Navigate to={inicioDelPanel(usuario)} replace />
  return (
    <>
      <AlertMessage tipo="warning" mensaje="No tienes permisos para ver esta sección." />
      <Link to={inicioDelPanel(usuario)} className="btn btn-outline-primary">Volver al panel</Link>
    </>
  )
}
