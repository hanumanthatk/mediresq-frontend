import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { Toaster } from 'react-hot-toast'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 4000,
        style: {
          background: '#1f2937',
          color: '#f9fafb',
          border: '1px solid #374151',
          borderRadius: '12px',
          fontFamily: 'DM Sans, sans-serif',
          fontSize: '14px',
        },
        success: { iconTheme: { primary: '#10b981', secondary: '#1f2937' } },
        error:   { iconTheme: { primary: '#ef4444', secondary: '#1f2937' } },
      }}
    />
  </React.StrictMode>,
)
