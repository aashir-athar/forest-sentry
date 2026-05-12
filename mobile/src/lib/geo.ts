// Pure geometry helpers — Haversine distance and point-in-polygon for zone alerts.
// Runs in JS thread; safe for use inside Reanimated worklets via runOnJS if needed.

export type LatLng = { lat: number; lng: number };
export type Polygon = LatLng[];

const EARTH_RADIUS_M = 6_371_000;

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

export function distanceMeters(a: LatLng, b: LatLng): number {
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.min(1, Math.sqrt(h)));
}

// Ray-casting algorithm. Treats longitude wrap reasonably for KP-scale polygons.
export function pointInPolygon(p: LatLng, polygon: Polygon): boolean {
  if (polygon.length < 3) return false;
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const pi = polygon[i];
    const pj = polygon[j];
    if (!pi || !pj) continue;
    const xi = pi.lng;
    const yi = pi.lat;
    const xj = pj.lng;
    const yj = pj.lat;
    const denom = yj - yi;
    if (denom === 0) continue;
    const intersect =
      yi > p.lat !== yj > p.lat && p.lng < ((xj - xi) * (p.lat - yi)) / denom + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

// Centroid of a polygon (used to anchor zone labels on the map).
export function polygonCentroid(poly: Polygon): LatLng {
  if (poly.length === 0) return { lat: 0, lng: 0 };
  let lat = 0;
  let lng = 0;
  for (const p of poly) {
    lat += p.lat;
    lng += p.lng;
  }
  return { lat: lat / poly.length, lng: lng / poly.length };
}

// Bounding box for fitting a map to a polygon.
export function polygonBounds(poly: Polygon): { sw: LatLng; ne: LatLng } | null {
  if (poly.length === 0) return null;
  let minLat = Infinity;
  let minLng = Infinity;
  let maxLat = -Infinity;
  let maxLng = -Infinity;
  for (const p of poly) {
    if (p.lat < minLat) minLat = p.lat;
    if (p.lng < minLng) minLng = p.lng;
    if (p.lat > maxLat) maxLat = p.lat;
    if (p.lng > maxLng) maxLng = p.lng;
  }
  return { sw: { lat: minLat, lng: minLng }, ne: { lat: maxLat, lng: maxLng } };
}
