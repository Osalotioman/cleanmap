"use client"

import "leaflet/dist/leaflet.css"
import "leaflet-geosearch/dist/geosearch.css"

import type { ReactElement } from "react"
import { useEffect, useMemo, useState } from "react"

interface MapPickerProps {
  location: [number, number] | null
  setLocation: (coords: [number, number]) => void
  readOnly?: boolean
}

type MapImplProps = MapPickerProps

export default function MapPicker({ location, setLocation, readOnly = false }: MapPickerProps) {
  const [mounted, setMounted] = useState(false)
  const [Impl, setImpl] = useState<null | ((props: MapImplProps) => ReactElement)>(null)

  const fallbackLocation = useMemo<[number, number]>(
    () => location ?? [51.505, -0.09],
    [location]
  )

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    let cancelled = false

    ;(async () => {
      // Import client-only libs after mount.
      const React = await import("react")
      const leafletModule = await import("leaflet")
      const L = leafletModule.default

      // Fix default marker icon in Leaflet
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (L.Icon.Default.prototype as any)._getIconUrl
      L.Icon.Default.mergeOptions({
        iconRetinaUrl:
          "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl:
          "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      })

      const { MapContainer, TileLayer, Marker, useMap, useMapEvents } = await import(
        "react-leaflet"
      )

      const { OpenStreetMapProvider, GeoSearchControl } = await import("leaflet-geosearch")

      const Component = function MapPickerImpl({
        location,
        setLocation,
        readOnly = false,
      }: MapImplProps) {
        const [markerPos, setMarkerPos] = React.useState<[number, number] | null>(location)

        React.useEffect(() => {
          if (location) setMarkerPos(location)
        }, [location])

        function LocationMarkerInner() {
          useMapEvents({
            click: (e: unknown) => {
              if (readOnly) return
              const evt = e as { latlng: { lat: number; lng: number } }
              const coords: [number, number] = [evt.latlng.lat, evt.latlng.lng]
              setMarkerPos(coords)
              setLocation(coords)
            },
          })

          return markerPos ? <Marker position={markerPos} /> : null
        }

        function SearchControlInner() {
          const map = useMap()

          React.useEffect(() => {
            const provider = new OpenStreetMapProvider()
            const searchControl = new GeoSearchControl({
              provider,
              style: "bar",
              showMarker: false,
            })

            map.addControl(searchControl)

            map.on("geosearch/showlocation", (e: unknown) => {
              const ev = e as { location: { x: number; y: number } }
              const coords: [number, number] = [ev.location.y, ev.location.x]
              setMarkerPos(coords)
              setLocation(coords)
              map.setView(coords, 16)
            })

            return () => {
              map.removeControl(searchControl)
            }
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
            <LocationMarkerInner />
            {!readOnly && <SearchControlInner />}
          </MapContainer>
        )
      }

      if (!cancelled) setImpl(() => Component)
    })()

    return () => {
      cancelled = true
    }
  }, [])

  if (!mounted || !Impl) {
    return <div className="h-full w-full bg-muted animate-pulse rounded-md" />
  }

  return (
    <Impl
      location={location ?? fallbackLocation}
      setLocation={setLocation}
      readOnly={readOnly}
    />
  )
}
