import supermarketsData from '../data/supermarkets.json';
import type { Supermarket } from '../types';
import { distanceKm, type Coords } from './locationService';

const knownSupermarkets = supermarketsData as Supermarket[];
const OVERPASS_URL = 'https://overpass-api.de/api/interpreter';

export interface NearbyStore {
  id: string;
  name: string;
  distanceKm: number;
  coords: Coords;
  matchedSupermarketId: string | null;
}

interface OverpassElement {
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: { name?: string; brand?: string };
}

function matchKnownSupermarket(name: string, brand?: string): string | null {
  const haystack = `${name} ${brand ?? ''}`.toLowerCase();
  const match = knownSupermarkets.find((sm) => haystack.includes(sm.name.toLowerCase()));
  return match?.id ?? null;
}

// ponytail: public Overpass instance, no key/billing — best-effort, OSM coverage varies by area.
export async function searchNearbySupermarkets(current: Coords, radiusMeters = 5000): Promise<NearbyStore[]> {
  const query = `[out:json][timeout:15];node["shop"="supermarket"](around:${radiusMeters},${current.latitude},${current.longitude});out center;`;

  let elements: OverpassElement[];
  try {
    const response = await fetch(OVERPASS_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'RecipesShoppingListApp/1.0 (personal recipe app)',
      },
      body: `data=${encodeURIComponent(query)}`,
    });
    if (!response.ok) return [];
    const json = await response.json();
    elements = json.elements ?? [];
  } catch {
    return [];
  }

  return elements
    .map((el): NearbyStore | null => {
      const lat = el.lat ?? el.center?.lat;
      const lon = el.lon ?? el.center?.lon;
      const name = el.tags?.name;
      if (lat === undefined || lon === undefined || !name) return null;
      const coords = { latitude: lat, longitude: lon };
      return {
        id: `osm-${el.id}`,
        name,
        distanceKm: distanceKm(current, coords),
        coords,
        matchedSupermarketId: matchKnownSupermarket(name, el.tags?.brand),
      };
    })
    .filter((s): s is NearbyStore => s !== null)
    .sort((a, b) => a.distanceKm - b.distanceKm);
}
