// components/Map/Leaflet.js
import { useEffect, useRef } from 'react'

const DEFAULT_CENTER = [28.6139, 77.209] // fallback, e.g. New Delhi — pick whatever makes sense
const DEFAULT_ZOOM = 5

export default function LeafletMap ({ lat, lng, zoom = 15, routePoints = [] }) {
  const mapContainerRef = useRef(null)
  const mapRef = useRef(null)
  const markerRef = useRef(null)
  const routeLayerRef = useRef(null)

  // Initialize map once — always with valid coordinates
  useEffect(() => {
    if (typeof window === 'undefined' || mapRef.current) return

    import('leaflet').then(L => {
      if (mapRef.current) return

      const hasValidStart =
        lat != null && lng != null && !isNaN(lat) && !isNaN(lng)

      const startCenter = hasValidStart ? [lat, lng] : DEFAULT_CENTER
      const startZoom = hasValidStart ? zoom : DEFAULT_ZOOM

      const map = L.map(mapContainerRef.current).setView(startCenter, startZoom)

      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution:
          '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      }).addTo(map)

      // Only add the live marker if we actually have a starting point
      if (hasValidStart) {
        const dot = L.circleMarker([lat, lng], {
          radius: 55,
          color: '#ffffff',
          weight: 15,
          fillColor: '#2563eb',
          fillOpacity: 10
        }).addTo(map)
        markerRef.current = dot
      }

      mapRef.current = map
    })

    return () => {
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
        markerRef.current = null
        routeLayerRef.current = null
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Update / create live position marker once lat/lng become valid
  useEffect(() => {
    if (
      !mapRef.current ||
      lat == null ||
      lng == null ||
      isNaN(lat) ||
      isNaN(lng)
    ) {
      return
    }

    import('leaflet').then(L => {
      if (!mapRef.current) return

      if (!markerRef.current) {
        markerRef.current = L.circleMarker([lat, lng], {
          radius: 8,
          color: '#ffffff',
          weight: 2,
          fillColor: '#2563eb',
          fillOpacity: 1
        }).addTo(mapRef.current)
      } else {
        markerRef.current.setLatLng([lat, lng])
      }

      mapRef.current.setView([lat, lng])
    })
  }, [lat, lng])

  // Draw route dots whenever routePoints changes
  useEffect(() => {
    if (!mapRef.current || routePoints.length === 0) return

    import('leaflet').then(L => {
      const map = mapRef.current
      if (!map) return

      if (routeLayerRef.current) {
        map.removeLayer(routeLayerRef.current)
      }

      const layerGroup = L.layerGroup()
      const latLngs = []

      routePoints.forEach(p => {
        if (p.latitude == null || p.longitude == null) return
        const coord = [p.latitude, p.longitude]
        latLngs.push(coord)

        L.circleMarker(coord, {
          radius: 3,
          color: '#1d4ed8',
          weight: 1,
          fillColor: '#3b82f6',
          fillOpacity: 0.8
        }).addTo(layerGroup)
      })

      if (latLngs.length === 0) return

      L.polyline(latLngs, {
        color: '#3b82f6',
        weight: 2,
        opacity: 0.6
      }).addTo(layerGroup)

      layerGroup.addTo(map)
      routeLayerRef.current = layerGroup

      map.fitBounds(latLngs, { padding: [30, 30] })
    })
  }, [routePoints])

  return (
    <div ref={mapContainerRef} style={{ height: '600px', width: '100%' }} />
  )
}
