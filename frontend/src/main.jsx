import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'sonner'
import './index.css'
import App from './App.jsx'
import { initConsoleLogger } from './lib/console-logger.js'

import { registerSW } from 'virtual:pwa-register'

if (typeof window !== 'undefined' && 'caches' in window) {
  caches.keys().then((names) => {
    names.forEach((name) => {
      if (name.startsWith('alkhaleej-static-') || name.startsWith('alkhaleej-i18n-')) {
        caches.delete(name)
      }
    })
  }).catch(() => {})
}

initConsoleLogger()

registerSW({
  immediate: true,
})

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <App />
      <Toaster
        position="top-right"
        richColors
        closeButton
        duration={3500}
        toastOptions={{
          style: { fontSize: '12px', borderRadius: '10px' },
        }}
      />
    </BrowserRouter>
  </StrictMode>,
)
