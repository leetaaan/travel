/**
 * Fetches real images of places/landmarks from Vietnamese Wikipedia.
 * Falls back to English Wikipedia if not found.
 * Food/cafe/snack categories use icon placeholders (no reliable free API for venue photos).
 */

const imageCache = new Map();

/**
 * Try to get image from a specific Wikipedia language version.
 */
async function fetchFromWikipedia(placeName, size, lang) {
  const titleUrl = `https://${lang}.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(placeName)}&prop=pageimages&format=json&pithumbsize=${size}&origin=*`;

  const response = await fetch(titleUrl);
  const data = await response.json();
  const pages = data.query.pages;
  const pageId = Object.keys(pages)[0];

  if (pageId !== "-1" && pages[pageId].thumbnail) {
    const source = pages[pageId].thumbnail.source;
    if (!source.toLowerCase().includes("flag") && !source.toLowerCase().includes("icon") && !source.toLowerCase().includes("logo")) {
      return source;
    }
  }

  // Fallback: search instead of exact title
  const searchUrl = `https://${lang}.wikipedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(placeName)}&gsrlimit=1&prop=pageimages&format=json&pithumbsize=${size}&origin=*`;

  const searchResponse = await fetch(searchUrl);
  const searchData = await searchResponse.json();

  if (searchData.query && searchData.query.pages) {
    const searchPages = searchData.query.pages;
    const searchPageId = Object.keys(searchPages)[0];
    const source = searchPages[searchPageId].thumbnail?.source;
    if (source && !source.toLowerCase().includes("flag") && !source.toLowerCase().includes("icon") && !source.toLowerCase().includes("logo")) {
      return source;
    }
  }

  return "";
}

/**
 * Fetch image from Wikipedia (vi first, then en fallback).
 */
export async function fetchPlaceImage(placeName, size = 400) {
  if (!placeName) return "";

  const cacheKey = `wiki_${placeName}_${size}`;
  if (imageCache.has(cacheKey)) {
    return imageCache.get(cacheKey);
  }

  try {
    let imageUrl = await fetchFromWikipedia(placeName, size, "vi");
    if (!imageUrl) {
      imageUrl = await fetchFromWikipedia(placeName, size, "en");
    }
    imageCache.set(cacheKey, imageUrl);
    return imageUrl;
  } catch (error) {
    console.error(`Wikipedia image error for "${placeName}":`, error);
    return "";
  }
}

/**
 * Batch fetch images for multiple destinations.
 * Wikipedia primary, with broader search logic.
 */
export async function fetchAllPlaceImages(
  destinations,
  cityName = "",
  size = 500,
) {
  const results = new Map();

  const promises = destinations.map(async (dest, index) => {
    // 1. Try exact name on Wikipedia
    let imageUrl = await fetchPlaceImage(dest.name, size);

    // 2. Try with city name context
    if (!imageUrl && cityName) {
      imageUrl = await fetchPlaceImage(`${dest.name} ${cityName}`, size);
    }

    // 3. Try with image_keyword if provided
    if (!imageUrl && dest.image_keyword) {
      imageUrl = await fetchPlaceImage(dest.image_keyword, size);
    }

    // 4. Final Fallback: High-quality travel images from Unsplash
    if (!imageUrl) {
      const keyword = (dest.image_keyword || dest.name || "").toLowerCase();
      const isFood = keyword.includes("bánh") || keyword.includes("lẩu") || keyword.includes("phở") || keyword.includes("bún") || keyword.includes("ăn") || keyword.includes("uống") || keyword.includes("mì");
      
      // Use a set of high-quality verified Vietnam travel photos to avoid "generic flag" errors
      const vnTravelPhotos = [
        "https://images.unsplash.com/photo-1528127269322-539801943592", // Rice fields
        "https://images.unsplash.com/photo-1555921015-5532091f6026", // Hanoi
        "https://images.unsplash.com/photo-1509030450996-dd1a26dda07a", // Halong Bay
        "https://images.unsplash.com/photo-1559592413-7cea837818e0", // Da Nang
        "https://images.unsplash.com/photo-1563492065599-3520f775eeed", // Hoi An
      ];
      
      const vnFoodPhotos = [
        "https://images.unsplash.com/photo-1555126634-323283e090fa", // Pho
        "https://images.unsplash.com/photo-1534352592543-bc899933517c", // Spring rolls
        "https://images.unsplash.com/photo-1503764654157-72061299979c", // Banh Mi
        "https://images.unsplash.com/photo-1617418933453-61b4020a67e2", // Vietnamese food setup
      ];

      const pool = isFood ? vnFoodPhotos : vnTravelPhotos;
      const randomPhoto = pool[Math.floor(Math.random() * pool.length)];
      
      imageUrl = `https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?q=80&w=${size}&auto=format&fit=crop`;
    }

    results.set(index, imageUrl);
  });

  await Promise.all(promises);
  return results;
}
