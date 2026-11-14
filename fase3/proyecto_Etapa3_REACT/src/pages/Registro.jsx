import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { authApi } from '../api/auth'
import { mensajeDeError } from '../api/cliente'
import AlertMessage from '../components/AlertMessage'
import FormField from '../components/FormField'
import RegionComunaFields from '../components/RegionComunaFields'
import { useSession } from '../context/SessionContext'
import { prepararFormulario } from '../utils/formularios'
import { ESQUEMA_REGISTRO } from '../utils/validaciones'

const INICIAL = {
  run: '', nombre: '', apellidos: '', correo: '', region: '', comuna: '', direccion: '', password: '', confirmacion: '',
}

/*
  Registro: POST /api/v1/auth/registro. El backend siempre crea un "Cliente", revisa que el
  RUN y el correo no existan (409) y devuelve el token, así la sesión queda iniciada.
  Región -> comuna son selects dependientes: al cambiar la región se limpia la comuna.
*/
export default function Registro() {
  const [valores, setValores] = useState(INICIAL)
  const [enviado, setEnviado] = useState(false)
  const { campo, hayErrores } = prepararFormulario(valores, setValores, ESQUEMA_REGISTRO, enviado)
  const [errorGeneral, setErrorGeneral] = useState('')
  const [enviando, setEnviando] = useState(false)
  const { iniciarSesion } = useSession()
  const navegar = useNavigate()

  const enviar = async (e) => {
    e.preventDefault()
    setEnviado(true)
    if (hayErrores) return
    setErrorGeneral('')
    setEnviando(true)
    try {
      const { confirmacion: _c, ...datos } = valores
      const respuesta = await authApi.registrar({
        ...datos,
        run: datos.run.trim().toUpperCase(),
        correo: datos.correo.trim(),
      })
      iniciarSesion(respuesta)
      navegar('/')
    } catch (error) {
      setErrorGeneral(mensajeDeError(error, 'No se pudo crear la cuenta.'))
      setEnviando(false)
    }
  }

  return (
    <div className="row justify-content-center">
      <div className="col-12 col-lg-8">
        <h1 className="h3 mb-4">Registro de usuario</h1>
        <form onSubmit={enviar} noValidate>
          <div className="row">
            <div className="col-md-6"><FormField {...campo('run')} label="RUN (ej: 12345678-5)" /></div>
            <div className="col-md-6"><FormField {...campo('correo')} label="Correo" type="email" /></div>
            <div className="col-md-6"><FormField {...campo('nombre')} label="Nombre" /></div>
            <div className="col-md-6"><FormField {...campo('apellidos')} label="Apellidos" /></div>
            <RegionComunaFields
              campo={campo}
              region={valores.region}
              onCambiarRegion={(region) => setValores({ ...valores, region, comuna: '' })}
            />
            <div className="col-12"><FormField {...campo('direccion')} label="Dirección" /></div>
            <div className="col-md-6"><FormField {...campo('password')} label="Contraseña (4 a 10 caracteres)" type="password" /></div>
            <div className="col-md-6"><FormField {...campo('confirmacion')} label="Confirmar contraseña" type="password" /></div>
          </div>
          <AlertMessage tipo="danger" mensaje={errorGeneral} />
          <button type="submit" className="btn btn-primary" disabled={enviando}>Crear cuenta</button>
        </form>
        <p className="mt-3 small">¿Ya tienes cuenta? <Link to="/login">Inicia sesión</Link></p>
      </div>
    </div>
  )
}
