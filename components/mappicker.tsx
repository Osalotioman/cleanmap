"use client"

import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet"
import "leaflet/dist/leaflet.css"
import { useState, useEffect } from "react"
import L from "leaflet"
import { OpenStreetMapProvider, GeoSearchControl } from "leaflet-geosearch"
import "leaflet-geosearch/dist/geosearch.css"

// Fix default marker icon in Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
})

interface MapPickerProps {
  location: [number, number] | null
  setLocation: (coords: [number, number]) => void
}

export default function MapPicker({ location, setLocation }: MapPickerProps) {
  const [markerPos, setMarkerPos] = useState<[number, number] | null>(location)

  // Update marker if parent updates location
  useEffect(() => {
    if (location) setMarkerPos(location)
  }, [location])

  function LocationMarker() {
    useMapEvents({
      click(e) {
        const coords: [number, number] = [e.latlng.lat, e.latlng.lng]
        setMarkerPos(coords)
        setLocation(coords)
      },
    })
    return markerPos ? <Marker position={markerPos} /> : null
  }

  function SearchControl() {
    const map = useMapEvents({})
    useEffect(() => {
      const provider = new OpenStreetMapProvider()
      const searchControl = new GeoSearchControl({
        provider,
        style: "bar",
        showMarker: false, // we handle our own marker
      })
      map.addControl(searchControl)
      map.on("geosearch/showlocation", (e: any) => {
        const coords: [number, number] = [e.location.y, e.location.x]
        setMarkerPos(coords)
        setLocation(coords)
        map.setView(coords, 16)
      })
      return () => map.removeControl(searchControl)
    }, [map])
    return null
  }

  return (
    <MapContainer
      center={markerPos || [51.505, -0.09]}
      zoom={markerPos ? 16 : 13}
      style={{ height: "300px", width: "100%" }}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution="&copy; OpenStreetMap contributors"
      />
      <LocationMarker />
      <SearchControl />
    </MapContainer>
  )
}