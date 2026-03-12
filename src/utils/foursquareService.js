/**
 * Foursquare Places API Service
 */

const API_KEY = import.meta.env.VITE_FOURSQUARE_API_KEY;

export async function searchPlace(name, locationName, address = "") {
  if (!API_KEY) {
    console.warn("FOURSQUARE_API_KEY is missing!");
    return null;
  }

  try {
    // Kết hợp tên và địa chỉ để tìm kiếm chính xác hơn
    const query = address ? `${name} ${address}` : name;
    const params = new URLSearchParams({
      query: query,
      near: locationName,
      limit: 1,
      fields: 'name,location,geocodes,categories,description'
    });

    const response = await fetch(
      `https://api.foursquare.com/v3/places/search?${params.toString()}`,
      {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          Authorization: API_KEY,
        }
      }
    );

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    if (data.results && data.results.length > 0) {
      const result = data.results[0];
      const resultAddress = result.location.formatted_address || result.location.address || "";
      
      // KIỂM TRA QUAN TRỌNG: Nếu kết quả trả về không nằm trong thành phố yêu cầu, bỏ qua
      // Tránh trường hợp tìm quán A ở Bảo Lộc nhưng trả về quán A ở Sài Gòn
      const cleanLocation = locationName.toLowerCase();
      if (!resultAddress.toLowerCase().includes(cleanLocation) && 
          !result.location.locality?.toLowerCase().includes(cleanLocation)) {
        console.warn(`Foursquare result for "${name}" is outside ${locationName}, skipping...`);
        return null;
      }

      return {
        name: result.name,
        address: resultAddress,
        lat: result.geocodes.main.latitude,
        lng: result.geocodes.main.longitude,
        foursquareId: result.fsq_id
      };
    }
  } catch (error) {
    console.error("Foursquare search error:", error);
  }
  return null;
}

// Fallback search using Nominatim (OpenStreetMap)
export async function searchPlaceNominatim(name, locationName, address = "", retryCount = 0) {
  try {
    const query = address 
      ? `${address}, ${locationName}, Vietnam`
      : `${name}, ${locationName}, Vietnam`;

    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1&addressdetails=1&countrycodes=vn`,
      {
        headers: { "User-Agent": "TravelPlanner/1.1 (contact@yourdomain.com)" }
      }
    );

    if (response.status === 429) {
      if (retryCount < 2) {
        console.warn("Nominatim rate limit hit (429), retrying in 3s...");
        await new Promise(r => setTimeout(r, 3000));
        return searchPlaceNominatim(name, locationName, address, retryCount + 1);
      }
      return null;
    }

    const data = await response.json();
    if (data && data.length > 0) {
      const result = data[0];
      const cleanLocation = locationName.toLowerCase();
      if (!result.display_name.toLowerCase().includes(cleanLocation)) {
        if (address) return searchPlaceNominatim(name, locationName, "", retryCount);
        return null;
      }

      const addr = result.address;
      const formatted = [
        addr.house_number,
        addr.road,
        addr.suburb || addr.neighbourhood,
        addr.city || addr.town || addr.village
      ].filter(Boolean).join(", ");

      return {
        address: formatted || result.display_name,
        lat: parseFloat(result.lat),
        lng: parseFloat(result.lon),
        is_verified: true
      };
    }
  } catch (e) {
    console.error("Nominatim search error:", e);
  }
  return null;
}

// Helper: Calculate distance between two coordinates in km (Haversine)
function getDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

export async function enrichItinerary(itinerary, locationName) {
  const enrichedDays = [];
  
  // 1. Lấy tọa độ trung tâm thành phố làm mốc
  console.log(`🏠 Đang lấy tọa độ trung tâm: ${locationName}...`);
  const cityCenter = await searchPlaceNominatim("", locationName);
  
  for (const day of itinerary.days) {
    const enrichedPlaces = [];
    for (const place of day.places) {
      console.log(`🔍 Đang xử lý địa điểm: ${place.name}...`);
      
      let finalLat = place.lat;
      let finalLng = place.lng;
      let finalAddr = place.address;
      let isVerified = false;

      // Bước 1: Thử tìm dữ liệu thật từ Foursquare
      const fsq = await searchPlace(place.name, locationName, place.address);
      if (fsq) {
        finalLat = fsq.lat;
        finalLng = fsq.lng;
        finalAddr = fsq.address;
        isVerified = true;
      } else {
        // Bước 2: Nếu AI không có tọa độ hoặc Foursquare không thấy, thử tìm qua địa chỉ (Nominatim)
        if (!finalLat || !finalLng) {
           console.log(`📡 Đang tìm tọa độ qua địa chỉ cho: ${place.name}`);
           const nom = await searchPlaceNominatim(place.name, locationName, place.address);
           if (nom) {
             finalLat = nom.lat;
             finalLng = nom.lng;
             finalAddr = nom.address || finalAddr;
             isVerified = true;
           }
        }
      }

      // THÔNG MINH: Nếu vẫn tuyệt đối không có tọa độ nhưng có địa chỉ, dùng tọa độ trung tâm + lệch nhẹ
      // để marker không bị biến mất (user có thể thấy và click sang Google Maps)
      if ((!finalLat || !finalLng) && cityCenter) {
         console.warn(`⚠️ Không tìm được tọa độ cho "${place.name}", dùng tọa độ trung tâm dự phòng.`);
         finalLat = cityCenter.lat + (Math.random() - 0.5) * 0.01;
         finalLng = cityCenter.lng + (Math.random() - 0.5) * 0.01;
      }

      // Bước 3: Kiểm tra vùng an toàn (100km)
      if (cityCenter && finalLat && finalLng) {
        const dist = getDistance(cityCenter.lat, cityCenter.lng, finalLat, finalLng);
        if (dist > 100) {
          console.error(`🚨 Tọa độ lệch quá xa (${dist.toFixed(1)}km), reset về trung tâm.`);
          finalLat = cityCenter.lat;
          finalLng = cityCenter.lng;
        }
      }

      enrichedPlaces.push({
        ...place,
        address: finalAddr || place.address,
        lat: finalLat,
        lng: finalLng,
        is_verified: isVerified
      });
    }
    enrichedDays.push({ ...day, places: enrichedPlaces });
  }

  return { ...itinerary, days: enrichedDays };
}
