import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
// Bootstrap: solo el CSS (el menú colapsable lo controla React en Navbar). Luego nuestro
// tema, que debe ir DESPUÉS para poder sobrescribir las variables de Bootstrap.
import 'bootstrap/dist/css/bootstrap.min.css'
import './styles/theme.css'
import App from './App.jsx'
import { CartProvider } from './context/CartContext.jsx'
import { SessionProvider } from './context/SessionContext.jsx'

// basename: en GitHub Pages la app vive en /Tienda-Sonido-Vivo/ (BASE_URL lo define Vite)
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <SessionProvider>
        <CartProvider>
          <App />
        </CartProvider>
      </SessionProvider>
    </BrowserRouter>
  </StrictMode>,
)
