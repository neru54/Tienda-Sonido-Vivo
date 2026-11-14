import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { authApi } from '../api/auth'
import { mensajeDeError } from '../api/cliente'
import AlertMessage from '../components/AlertMessage'
import FormField from '../components/FormField'
import { useSession } from '../context/SessionContext'
import { prepararFormulario } from '../utils/formularios'
import { inicioDelPanel, tieneAccesoAlPanel } from '../utils/roles'
import { ESQUEMA_LOGIN } from '../utils/validaciones'

/*
  Login: formulario con validación en vivo (prepararFormulario + reglas de utils).
  Al validar OK llama a POST /api/v1/auth/login; el backend responde { token, usuario }
  y se guardan en la sesión. Estado: `valores`, `enviado`, `enviando` y `falloLogin`.
*/
export default function Login() {
  const [valores, setValores] = useState({ correo: '', password: '' })
  const [enviado, setEnviado] = useState(false)
  const { campo, hayErrores } = prepararFormulario(valores, setValores, ESQUEMA_LOGIN, enviado)
  const [falloLogin, setFalloLogin] = useState('')
  const [enviando, setEnviando] = useState(false)
  const { iniciarSesion, expirada } = useSession()
  const navegar = useNavigate()
  const { state } = useLocation()

  const enviar = async (e) => {
    e.preventDefault()
    setEnviado(true)
    if (hayErrores) return
    setFalloLogin('')
    setEnviando(true)
    try {
      const respuesta = await authApi.login(valores.correo, valores.password)
      iniciarSesion(respuesta)
      const { usuario } = respuesta
      navegar(state?.desde || (tieneAccesoAlPanel(usuario) ? inicioDelPanel(usuario) : '/'))
    } catch (error) {
      setFalloLogin(mensajeDeError(error, 'No se pudo iniciar sesión.'))
      setEnviando(false)
    }
  }

  return (
    <div className="row justify-content-center">
      <div className="col-12 col-md-6 col-lg-4">
        <h1 className="h3 mb-4">Iniciar sesión</h1>
        <AlertMessage tipo="warning" mensaje={expirada ? 'Tu sesión expiró. Vuelve a iniciar sesión.' : ''} />
        <form onSubmit={enviar} noValidate>
          <FormField {...campo('correo')} label="Correo" type="email" autoComplete="email" />
          <FormField {...campo('password')} label="Contraseña" type="password" autoComplete="current-password" />
          <AlertMessage tipo="danger" mensaje={falloLogin} />
          <button type="submit" className="btn btn-primary w-100" disabled={enviando}>
            {enviando ? 'Ingresando…' : 'Ingresar'}
          </button>
        </form>
        <p className="mt-3 small">¿No tienes cuenta? <Link to="/registro">Regístrate</Link></p>
        <p className="small text-muted">
          Cuentas de prueba: <code>maria.perez@gmail.com</code> / <code>admin123</code> (administradora) ·{' '}
          <code>carlos.munoz@duoc.cl</code> / <code>vend123</code> (vendedor) ·{' '}
          <code>camila.rojas@gmail.com</code> / <code>cli123</code> (cliente).
        </p>
      </div>
    </div>
  )
}
