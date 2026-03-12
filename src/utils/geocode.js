const geocodeCache = new Map();

// Geocoding simplified: No external calls, just uses AI provided coordinates
export async function geocodePlace(
  placeName,
  city = "",
  address = "",
) {
  const cacheKey = `${placeName}-${city}-${address}`;
  if (geocodeCache.has(cacheKey)) return geocodeCache.get(cacheKey);
  
  // Since we use Gemini to provide coordinates in the initial prompt, 
  // this fallback is usually not needed or handled in the component.
  return null;
}

// Batch geocode multiple places
export async function geocodePlaces(places, city = "") {
  const results = new Map();
  
  for (const place of places) {
    const key = place.name || place;
    const existingLat = typeof place === "object" ? place.lat : null;
    const existingLng = typeof place === "object" ? place.lng : null;

    if (results.has(key)) continue;

    if (existingLat && existingLng) {
      results.set(key, { lat: existingLat, lng: existingLng });
    }
  }
  return results;
}
