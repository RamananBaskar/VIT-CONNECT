/**
 * Exact GPS <-> 3D Scene coordinate conversion calibrated to VIT Chennai vit_map.glb
 * Preserved from original bundle constants.
 */
const EARTH_RADIUS = 6371000;
const DEG_TO_RAD = Math.PI / 180;

export const CAMPUS_ORIGIN = {
  lat: 12.84252,
  lng: 80.15427,
};

export const CAMPUS_BOUNDS = {
  minX: -850,
  maxX: 760,
  minZ: -500,
  maxZ: 800,
};

export const OUT_OF_BOUNDS_FALLBACK = {
  x: -73.353,
  y: 0.337,
  z: 340.876,
};

export function isWithinCampusBounds(x, z) {
  return (
    Number.isFinite(x) &&
    Number.isFinite(z) &&
    x >= CAMPUS_BOUNDS.minX &&
    x <= CAMPUS_BOUNDS.maxX &&
    z >= CAMPUS_BOUNDS.minZ &&
    z <= CAMPUS_BOUNDS.maxZ
  );
}

const AFFINE = {
  a: 1.00129327,
  b: 869e-8,
  c: -849e-8,
  d: -0.99491965,
  tx: -0.206382,
  tz: 0.205974,
};

export function latLngToLocalMeters(lat, lng) {
  const dLat = (lat - CAMPUS_ORIGIN.lat) * DEG_TO_RAD;
  const dLng = (lng - CAMPUS_ORIGIN.lng) * DEG_TO_RAD;
  return {
    x: dLng * Math.cos(CAMPUS_ORIGIN.lat * DEG_TO_RAD) * EARTH_RADIUS,
    z: dLat * EARTH_RADIUS,
  };
}

export function latLngToScene(lat, lng) {
  const { x: mx, z: mz } = latLngToLocalMeters(lat, lng);
  return {
    x: Number((AFFINE.a * mx + AFFINE.b * mz + AFFINE.tx).toFixed(3)),
    y: 0,
    z: Number((AFFINE.c * mx + AFFINE.d * mz + AFFINE.tz).toFixed(3)),
  };
}

export function sceneToLatLng(x, z) {
  const dx = x - AFFINE.tx;
  const dz = z - AFFINE.tz;
  const det = AFFINE.a * AFFINE.d - AFFINE.b * AFFINE.c;
  const mx = (AFFINE.d * dx - AFFINE.b * dz) / det;
  const mz = (-AFFINE.c * dx + AFFINE.a * dz) / det;

  const lat = CAMPUS_ORIGIN.lat + (mz / EARTH_RADIUS) / DEG_TO_RAD;
  const lng =
    CAMPUS_ORIGIN.lng +
    (mx / (EARTH_RADIUS * Math.cos(CAMPUS_ORIGIN.lat * DEG_TO_RAD))) / DEG_TO_RAD;

  return {
    lat: Number(lat.toFixed(6)),
    lng: Number(lng.toFixed(6)),
  };
}

export function haversineKm(a, b) {
  const lat1 = a.lat * DEG_TO_RAD;
  const lat2 = b.lat * DEG_TO_RAD;
  const dLat = (b.lat - a.lat) * DEG_TO_RAD;
  const dLon = ((b.lon ?? b.lng) - (a.lon ?? a.lng)) * DEG_TO_RAD;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}
