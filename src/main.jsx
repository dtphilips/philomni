import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App.jsx'
import '@/index.css'

// Load Google Maps (Places) script once at app boot
const GMAPS_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY
if (GMAPS_KEY) {
  const script = document.createElement('script')
  script.src = `https://maps.googleapis.com/maps/api/js?key=${GMAPS_KEY}&libraries=places`
  script.async = true
  script.defer = true
  document.head.appendChild(script)
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <App />
)
