import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Coords } from './locationService';

const STORAGE_KEY = 'supermarket-locations';

export async function getSupermarketLocations(): Promise<Record<string, Coords>> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  return raw ? (JSON.parse(raw) as Record<string, Coords>) : {};
}

export async function setSupermarketLocation(supermarketId: string, coords: Coords): Promise<void> {
  const existing = await getSupermarketLocations();
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ ...existing, [supermarketId]: coords }));
}

export async function clearSupermarketLocation(supermarketId: string): Promise<void> {
  const existing = await getSupermarketLocations();
  delete existing[supermarketId];
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
}
