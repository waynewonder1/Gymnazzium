import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import MemberProvider from './context/MemberProvider.jsx'
import CartProvider from './context/CartProvider.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <MemberProvider>
        <CartProvider>
          <App />
        </CartProvider>
      </MemberProvider>
    </BrowserRouter>
  </StrictMode>,
)
