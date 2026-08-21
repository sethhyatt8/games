import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import type { MapStyle } from '../game/protocol'

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
  mapStyle?: MapStyle
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
const LAND_URL =
  'https://cdn.jsdelivr.net/gh/johan/world.geo.json@master/countries.geo.json'

let landCache: GeoJSON.FeatureCollection | null = null
let landLoad: Promise<GeoJSON.FeatureCollection | null> | null = null

function loadLand() {
  if (landCache) return Promise.resolve(landCache)
  if (landLoad) return landLoad
  landLoad = fetch(LAND_URL)
    .then((response) => (response.ok ? response.json() : null))
    .then((data: GeoJSON.FeatureCollection | null) => {
      landCache = data
      return data
    })
    .catch(() => null)
  return landLoad
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

export function GuessMap({
  pins,
  interactive,
  mapStyle = 'plain',
  showBorders = false,
  onDrop,
}: GuessMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<L.Map | null>(null)
  const pinsRef = useRef<L.LayerGroup | null>(null)
  const tilesRef = useRef<L.TileLayer | null>(null)
  const landRef = useRef<L.GeoJSON | null>(null)
  const onDropRef = useRef(onDrop)
  const interactiveRef = useRef(interactive)
  const mapStyleRef = useRef(mapStyle)
  const showBordersRef = useRef(showBorders)
  onDropRef.current = onDrop
  interactiveRef.current = interactive
  mapStyleRef.current = mapStyle
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

    pinsRef.current = L.layerGroup().addTo(map)
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
      pinsRef.current = null
      tilesRef.current = null
      landRef.current = null
    }
  }, [])

  useEffect(() => {
    const map = mapRef.current
    if (map) map.dragging[interactive ? 'enable' : 'disable']()
  }, [interactive])

  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    tilesRef.current?.remove()
    tilesRef.current = null
    landRef.current?.remove()
    landRef.current = null

    if (mapStyle === 'satellite') {
      tilesRef.current = L.tileLayer(IMAGERY_URL, {
        attribution: 'Tiles &copy; Esri',
      }).addTo(map)
      if (!showBorders) return
      void loadLand().then((data) => {
        if (!data || !mapRef.current || mapStyleRef.current !== 'satellite' || !showBordersRef.current) {
          return
        }
        landRef.current = L.geoJSON(data, {
          style: {
            color: '#f4e6d3',
            weight: 1,
            opacity: 0.8,
            fillOpacity: 0,
          },
        }).addTo(mapRef.current)
        if (pinsRef.current) {
          pinsRef.current.remove()
          pinsRef.current.addTo(mapRef.current)
        }
      })
      return
    }

    void loadLand().then((data) => {
      if (!data || !mapRef.current || mapStyleRef.current !== 'plain') return
      landRef.current = L.geoJSON(data, {
        style: {
          color: showBordersRef.current ? '#8b929a' : '#ffffff',
          weight: showBordersRef.current ? 1 : 0.6,
          fillColor: '#ffffff',
          fillOpacity: 1,
        },
      }).addTo(mapRef.current)
      if (pinsRef.current) {
        pinsRef.current.remove()
        pinsRef.current.addTo(mapRef.current)
      }
    })
  }, [mapStyle, showBorders])

  useEffect(() => {
    const map = mapRef.current
    const layer = pinsRef.current
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
