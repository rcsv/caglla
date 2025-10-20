// Minimal ambient Google Maps typings used in the app

declare namespace google {
  namespace maps {
    interface LatLngLiteral { lat: number; lng: number }
    class LatLng { lat(): number; lng(): number }
    class Map {
      constructor(el: HTMLElement, opts?: any)
      getCenter(): LatLng | null
      getZoom(): number
      setCenter(latLng: LatLngLiteral): void
      setZoom(zoom: number): void
      panTo(latLng: LatLngLiteral): void
      addListener(eventName: string, handler: (...args: any[]) => void): any
      get(key: string): any
      fitBounds(bounds: LatLngBounds): void
    }
    const MapTypeId: { ROADMAP: string }
    class Marker {
      constructor(opts?: any)
      setMap(map: Map | null): void
      addListener(event: string, handler: () => void): void
    }
    namespace marker {
      class AdvancedMarkerElement {
        constructor(opts?: any)
        setMap(map: Map | null): void
        addListener(event: string, handler: () => void): void
      }
    }
    class Size { constructor(width: number, height: number) }
    class DirectionsService {}
    class DirectionsRenderer {
      constructor(opts?: any)
      setMap(map: Map | null): void
      setDirections(result: any): void
    }
    class LatLngBounds { extend(latLng: LatLngLiteral): void }
    const ControlPosition: any
    const TravelMode: { DRIVING: any }
    class InfoWindow { constructor(opts?: any); open(map: Map, anchor?: any): void }
    const event: { addListenerOnce(map: Map, eventName: string, handler: () => void): void }
    interface MapMouseEvent { latLng: LatLng }
  }
}

interface Window { google: typeof google }


