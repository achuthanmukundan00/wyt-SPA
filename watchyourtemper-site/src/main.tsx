import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { CartProvider } from './context/CartContext.tsx'
import { StorePreferencesProvider } from './context/StorePreferencesContext.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <StorePreferencesProvider>
      <CartProvider>
        <App />
      </CartProvider>
    </StorePreferencesProvider>
  </StrictMode>,
)
