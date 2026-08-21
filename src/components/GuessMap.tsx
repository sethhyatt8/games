import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

export type MapPin = {
  id: string
  name: string
  lat: number
  lng: number
  kind: 'self' | 'other' | 'answer'
}

type GuessMapProps = {
  pins: MapPin[]
  interactive: boolean
  onDrop?: (lat: number, lng: number) => void
}

const COLORS = {
  self: '#e25b4a',
  other: '#7aa2f7',
  answer: '#e8c547',
}

function iconFor(pin: MapPin) {
  const color = COLORS[pin.kind]
  const label = pin.kind === 'answer' ? '★' : ''
  return L.divIcon({
    className: 'guess-pin',
    html: `<div class="guess-pin-dot ${pin.kind}" style="background:${color}">${label}</div>
      <div class="guess-pin-label">${escapeHtml(pin.name)}</div>`,
    iconSize: [22, 22],
    iconAnchor: [11, 11],
  })
}

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}

export function GuessMap({ pins, interactive, onDrop }: GuessMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<L.Map | null>(null)
  const layerRef = useRef<L.LayerGroup | null>(null)
  const onDropRef = useRef(onDrop)
  const interactiveRef = useRef(interactive)
  onDropRef.current = onDrop
  interactiveRef.current = interactive

  useEffect(() => {
    const node = containerRef.current
    if (!node || mapRef.current) return

    const map = L.map(node, {
      worldCopyJump: true,
      minZoom: 1,
      maxZoom: 12,
      zoomControl: true,
      attributionControl: true,
    }).setView([20, 0], 2)

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap',
    }).addTo(map)

    layerRef.current = L.layerGroup().addTo(map)
    mapRef.current = map

    function onClick(event: L.LeafletMouseEvent) {
      if (!interactiveRef.current || !onDropRef.current) return
      onDropRef.current(event.latlng.lat, event.latlng.lng)
    }
    map.on('click', onClick)

    const resize = window.setTimeout(() => map.invalidateSize(), 50)
    return () => {
      window.clearTimeout(resize)
      map.off('click', onClick)
      map.remove()
      mapRef.current = null
      layerRef.current = null
    }
  }, [])

  useEffect(() => {
    const map = mapRef.current
    if (map) map.dragging[interactive ? 'enable' : 'disable']()
  }, [interactive])

  useEffect(() => {
    const map = mapRef.current
    const layer = layerRef.current
    if (!map || !layer) return
    layer.clearLayers()
    const latLngs: L.LatLngExpression[] = []
    for (const pin of pins) {
      const marker = L.marker([pin.lat, pin.lng], { icon: iconFor(pin), interactive: false })
      marker.addTo(layer)
      latLngs.push([pin.lat, pin.lng])
    }
    if (latLngs.length > 1) {
      map.fitBounds(L.latLngBounds(latLngs).pad(0.35), { maxZoom: 5, animate: true })
    } else if (latLngs.length === 1 && pins[0]?.kind === 'self') {
      // Keep the world view while dropping a single guess.
    }
    map.invalidateSize()
  }, [pins])

  return <div ref={containerRef} className="guess-map" />
}
