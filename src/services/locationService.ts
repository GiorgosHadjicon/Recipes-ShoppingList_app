import * as Location from 'expo-location';

export interface Coords {
  latitude: number;
  longitude: number;
}

export async function getCurrentPosition(): Promise<Coords | null> {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') return null;
    const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
    return { latitude: position.coords.latitude, longitude: position.coords.longitude };
  } catch {
    // Location services off at the OS level, GPS timeout, etc. — treat as "unavailable".
    return null;
  }
}

// Haversine distance in km between two lat/lng points.
export function distanceKm(a: Coords, b: Coords): number {
  const R = 6371;
  const dLat = toRad(b.latitude - a.latitude);
  const dLon = toRad(b.longitude - a.longitude);
  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

export function findNearestSupermarket(
  current: Coords,
  savedLocations: Record<string, Coords>,
): { supermarketId: string; distanceKm: number } | null {
  const entries = Object.entries(savedLocations);
  if (entries.length === 0) return null;
  let nearest = entries[0];
  let nearestDistance = distanceKm(current, entries[0][1]);
  for (const entry of entries.slice(1)) {
    const d = distanceKm(current, entry[1]);
    if (d < nearestDistance) {
      nearest = entry;
      nearestDistance = d;
    }
  }
  return { supermarketId: nearest[0], distanceKm: nearestDistance };
}
