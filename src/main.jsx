import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ClerkProvider } from '@clerk/react'
import { Provider } from 'react-redux'
import { store } from './store/index.js'
import './index.css'
import App from './App.jsx'
import { ToastProvider } from './components/ui/Toast.jsx'

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

if (!PUBLISHABLE_KEY) {
  throw new Error('Missing VITE_CLERK_PUBLISHABLE_KEY in .env')
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Provider store={store}>
      <ClerkProvider publishableKey={PUBLISHABLE_KEY}>
        <ToastProvider>
          <App />
        </ToastProvider>
      </ClerkProvider>
    </Provider>
  </StrictMode>,
)
