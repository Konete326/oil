import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'sonner'
import './index.css'
import App from './App.jsx'
import { initConsoleLogger } from './lib/console-logger.js'
import { registerSW } from 'virtual:pwa-register'

initConsoleLogger()

const updateSW = registerSW({
  immediate: true,
  onNeedRefresh() {
    updateSW(true)
  },
  onOfflineReady() {},
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
