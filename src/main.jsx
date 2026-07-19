import React from 'react'
import { createRoot } from 'react-dom/client'
import { StoreProvider } from './store.jsx'
import App from './App.jsx'
import Login from './views/Login.jsx'
import './styles.css'

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <StoreProvider LoginScreen={Login}>
      <App />
    </StoreProvider>
  </React.StrictMode>
)
