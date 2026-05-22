import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Aplica el tema guardado antes del primer render para evitar flash
const saved = localStorage.getItem('theme')
if (saved === 'dark' || saved === 'light') {
  document.documentElement.setAttribute('data-theme', saved)
} else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
  document.documentElement.setAttribute('data-theme', 'dark')
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
