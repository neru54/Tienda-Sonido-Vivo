import { useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { boletasApi, nuevaClaveCompra } from '../api/boletas'
import { mensajeDeError } from '../api/cliente'
import AlertMessage from '../components/AlertMessage'
import FormField from '../components/FormField'
import OrderSummary from '../components/OrderSummary'
import RegionComunaFields from '../components/RegionComunaFields'
import { useCart } from '../context/CartContext'
import { useSession } from '../context/SessionContext'
import { prepararFormulario } from '../utils/formularios'
import { ESQUEMA_CHECKOUT } from '../utils/validaciones'

/*
  Checkout: datos del cliente + dirección de entrega -> POST /api/v1/boletas.
  - Se puede comprar SIN iniciar sesión. Si hay sesión, el formulario se autocompleta y el
    interceptor manda el token, así el backend asocia la boleta al usuario.
  - Solo se envían códigos y cantidades: el BACKEND valida el cupón (pedidos), revisa y descuenta
    el stock con los precios reales (catalogo, todo o nada) y guarda la boleta (pedidos). Si falta
    stock responde 409 y el mensaje se muestra aquí. El resumen de esta pantalla es solo una vista previa.
  - Idempotency-Key: una clave por visita al checkout. Si la red falla y se vuelve a pulsar "Pagar",
    se reenvía la MISMA clave y el backend (microservicio pedidos) no crea una segunda boleta.
  - La casilla "Simular error de pago" sigue siendo una demostración: no llama a la API.
*/
function valoresIniciales(usuario) {
  return {
    nombre: usuario?.nombre ?? '',
    apellidos: usuario?.apellidos ?? '',
    correo: usuario?.correo ?? '',
    calle: usuario?.direccion ?? '',
    departamento: '',
    region: usuario?.region ?? '',
    comuna: usuario?.comuna ?? '',
    indicaciones: '',
  }
}

export function armarPedido(valores, items, cupon) {
  return {
    cliente: { nombre: valores.nombre.trim(), apellidos: valores.apellidos.trim(), correo: valores.correo.trim() },
    direccion: {
      calle: valores.calle.trim(),
      departamento: valores.departamento.trim(),
      region: valores.region,
      comuna: valores.comuna,
      indicaciones: valores.indicaciones.trim(),
    },
    items: items.map((i) => ({ codigo: i.codigo, cantidad: i.cantidad })),
    cupon: cupon || null,
  }
}

export default function Checkout() {
  const { items, total, descuento, cupon, vaciar } = useCart()
  const { usuario } = useSession()
  const navegar = useNavigate()
  const [valores, setValores] = useState(() => valoresIniciales(usuario))
  const [enviado, setEnviado] = useState(false)
  const { campo, hayErrores } = prepararFormulario(valores, setValores, ESQUEMA_CHECKOUT, enviado)
  const [simularError, setSimularError] = useState(false)
  const [errorGeneral, setErrorGeneral] = useState('')
  const [enviando, setEnviando] = useState(false)
  const claveCompra = useRef(nuevaClaveCompra())

  if (items.length === 0) {
    return (
      <>
        <AlertMessage tipo="info" mensaje="Tu carrito está vacío, no hay nada que pagar." />
        <Link to="/productos" className="btn btn-primary">Ver productos</Link>
      </>
    )
  }

  const pagar = async (e) => {
    e.preventDefault()
    setErrorGeneral('')
    setEnviado(true)
    if (hayErrores) return

    if (simularError) {
      navegar('/pago-error')
      return
    }

    setEnviando(true)
    try {
      const boleta = await boletasApi.crear(armarPedido(valores, items, cupon), claveCompra.current)
      vaciar()
      navegar(`/pago-correcto?orden=${boleta.id}`, { state: { boleta } })
    } catch (error) {
      setErrorGeneral(mensajeDeError(error, 'No se pudo completar la compra.'))
      setEnviando(false)
    }
  }

  return (
    <>
      <h1 className="h3 mb-4">Checkout</h1>
      <form onSubmit={pagar} noValidate>
        <div className="row g-4">
          <div className="col-12 col-lg-8">
            <h2 className="h5">Datos del cliente</h2>
            {!usuario && (
              <p className="small text-muted">
                Puedes comprar sin cuenta. <Link to="/login" state={{ desde: '/checkout' }}>Inicia sesión</Link> para guardar la compra en tu historial.
              </p>
            )}
            <div className="row">
              <div className="col-md-6"><FormField {...campo('nombre')} label="Nombre" /></div>
              <div className="col-md-6"><FormField {...campo('apellidos')} label="Apellidos" /></div>
              <div className="col-12"><FormField {...campo('correo')} label="Correo" type="email" /></div>
            </div>
            <h2 className="h5 mt-3">Dirección de entrega</h2>
            <div className="row">
              <div className="col-md-8"><FormField {...campo('calle')} label="Calle y número" /></div>
              <div className="col-md-4"><FormField {...campo('departamento')} label="Departamento (opcional)" /></div>
              <RegionComunaFields
                campo={campo}
                region={valores.region}
                onCambiarRegion={(region) => setValores({ ...valores, region, comuna: '' })}
              />
              <div className="col-12"><FormField {...campo('indicaciones')} label="Indicaciones para la entrega (opcional)" as="textarea" /></div>
            </div>
          </div>
          <div className="col-12 col-lg-4">
            <OrderSummary items={items} total={total} descuento={descuento} cupon={cupon} />
            <div className="form-check my-3">
              <input id="simular-error" type="checkbox" className="form-check-input" checked={simularError} onChange={(e) => setSimularError(e.target.checked)} />
              <label htmlFor="simular-error" className="form-check-label small">Simular error de pago (solo demostración)</label>
            </div>
            <AlertMessage tipo="danger" mensaje={errorGeneral} />
            <button type="submit" className="btn btn-primary w-100" disabled={enviando}>
              {enviando ? 'Procesando pago…' : 'Pagar ahora'}
            </button>
          </div>
        </div>
      </form>
    </>
  )
}
