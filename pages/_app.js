import '@/styles/globals.css'
import { useEffect } from 'react'
import AOS from 'aos'
import 'leaflet/dist/leaflet.css'
import 'aos/dist/aos.css'

export default function App ({ Component, pageProps }) {
  useEffect(() => {
    AOS.init({
      offset: 50
    })
  }, [])
  return <Component {...pageProps} />
}
