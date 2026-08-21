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
  showBorders?: boolean
  onDrop?: (lat: number, lng: number) => void
}

const COLORS = {
  self: '#e25b4a',
  other: '#7aa2f7',
  answer: '#e8c547',
}

const IMAGERY_URL =
  'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
const BORDERS_URL =
  'https://cdn.jsdelivr.net/gh/johan/world.geo.json@master/countries.geo.json'

let bordersCache: GeoJSON.FeatureCollection | null = null
let bordersLoad: Promise<GeoJSON.FeatureCollection | null> | null = null

function loadBorders() {
  if (bordersCache) return Promise.resolve(bordersCache)
  if (bordersLoad) return bordersLoad
  bordersLoad = fetch(BORDERS_URL)
    .then((response) => (response.ok ? response.json() : null))
    .then((data: GeoJSON.FeatureCollection | null) => {
      bordersCache = data
      return data
    })
    .catch(() => null)
  return bordersLoad
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

export function GuessMap({ pins, interactive, showBorders = false, onDrop }: GuessMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<L.Map | null>(null)
  const layerRef = useRef<L.LayerGroup | null>(null)
  const bordersRef = useRef<L.GeoJSON | null>(null)
  const onDropRef = useRef(onDrop)
  const interactiveRef = useRef(interactive)
  const showBordersRef = useRef(showBorders)
  onDropRef.current = onDrop
  interactiveRef.current = interactive
  showBordersRef.current = showBorders

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

    L.tileLayer(IMAGERY_URL, {
      attribution: 'Tiles &copy; Esri',
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
      bordersRef.current = null
    }
  }, [])

  useEffect(() => {
    const map = mapRef.current
    if (map) map.dragging[interactive ? 'enable' : 'disable']()
  }, [interactive])

  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    if (!showBorders) {
      bordersRef.current?.remove()
      bordersRef.current = null
      return
    }
    if (bordersRef.current) {
      bordersRef.current.addTo(map)
      return
    }
    void loadBorders().then((data) => {
      if (!data || !mapRef.current || bordersRef.current || !showBordersRef.current) return
      bordersRef.current = L.geoJSON(data, {
        style: {
          color: '#f4e6d3',
          weight: 1,
          opacity: 0.75,
          fillOpacity: 0,
        },
      }).addTo(mapRef.current)
    })
  }, [showBorders])

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
    }
    map.invalidateSize()
  }, [pins])

  return <div ref={containerRef} className="guess-map" />
}
