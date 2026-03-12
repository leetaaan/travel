import React, { useEffect, useRef, useState } from "react";
import * as maptilersdk from "@maptiler/sdk";
import "@maptiler/sdk/dist/maptiler-sdk.css";
import { ExternalLink, MapPin, Star, X } from "lucide-react";
import ReactDOM from "react-dom/client";

const MAPTILER_API_KEY = import.meta.env.VITE_MAPTILER_API_KEY || "YOUR_MAPTILER_API_KEY";

const dayColors = [
  "#10b981", // Day 1 - Emerald
  "#3b82f6", // Day 2 - Blue
  "#f59e0b", // Day 3 - Amber
  "#ef4444", // Day 4 - Red
  "#8b5cf6", // Day 5 - Purple
  "#ec4899", // Day 6 - Pink
  "#06b6d4", // Day 7 - Cyan
];

const categoryLabels = {
  food: "🍜 Ăn uống",
  cafe: "☕ Cà phê",
  snack: "🍡 Ăn vặt",
  sightseeing: "🏛️ Tham quan",
  entertainment: "🎭 Vui chơi",
  hotel: "🏨 Khách sạn",
};

export default function TripMap(props) {
  const {
    days,
    coordinates,
    selectedDay = null,
    destinationImages = new Map(),
    itineraryDestinations = [],
    cityName = "",
    lodgingOptions = []
  } = props;

  const mapContainer = useRef(null);
  const map = useRef(null);
  const markersRef = useRef([]);

  // Initialize Map
  useEffect(() => {
    if (map.current || !mapContainer.current) return;

    maptilersdk.config.apiKey = MAPTILER_API_KEY;
    map.current = new maptilersdk.Map({
      container: mapContainer.current,
      style: maptilersdk.MapStyle.STREETS,
      center: [106.6297, 10.8231], // HCM Default
      zoom: 12,
      geolocate: true,
      navigationControl: false
    });
  }, []);

  // Update Markers and Bounds
  useEffect(() => {
    if (!map.current) return;

    // Clear existing markers
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    const newMarkersData = [];

    // Helper: Get Clean Coordinates (MapTiler expects [lng, lat])
    const getSafeLngLat = (item) => {
      // 1. Ưu tiên tọa độ TRỰC TIẾP từ vật thể (đã được enrich hoặc AI trả về)
      let lat = item.lat;
      let lng = item.lng;

      // 2. Nếu không có, mới tìm trong bản đồ coordinates (fallback)
      if (!lat || !lng) {
        const cached = coordinates?.get(item.name);
        if (cached) {
          lat = cached.lat;
          lng = cached.lng;
        }
      }

      if (!lat || !lng) {
        console.warn(`⚠️ Bỏ qua địa điểm "${item.name}" do thiếu tọa độ.`);
        return null;
      }

      // 2. Fix potential swaps (Gemini sometimes swaps them)
      // Vietnam Lat: 8-24, Lng: 102-110
      const nLat = Number(lat);
      const nLng = Number(lng);

      if (nLat > 90 || nLat > nLng) { // High probability of being swapped
        return [nLat, nLng];
      }
      return [nLng, nLat];
    };

    // Collect Data
    (days || []).forEach((day, dayIndex) => {
      if (selectedDay !== null && selectedDay !== "hotels" && dayIndex !== selectedDay) return;
      if (selectedDay !== "hotels") {
        (day.places || []).forEach((place, placeIndex) => {
          const lngLat = getSafeLngLat(place);
          if (lngLat) {
            const flatIdx = itineraryDestinations.findIndex((d) => d.name === place.name);
            newMarkersData.push({
              lngLat,
              name: place.name,
              description: place.description || "",
              time: place.time || "",
              category: place.category || "",
              dayIndex,
              placeIndex,
              estimatedCost: place.estimated_cost || "",
              address: place.address || "",
              image: destinationImages.get(flatIdx),
            });
          }
        });
      }
    });

    if (selectedDay === "hotels" && lodgingOptions) {
      lodgingOptions.forEach((hotel, hIdx) => {
        const lngLat = getSafeLngLat(hotel);
        if (lngLat) {
          newMarkersData.push({
            lngLat,
            name: hotel.name,
            description: hotel.benefit || "Gợi ý khách sạn",
            time: "Khách sạn",
            category: "hotel",
            dayIndex: -1,
            placeIndex: hIdx,
            estimatedCost: `${formatVND(hotel.price)}`,
            address: hotel.address || "",
            image: hotel.image,
          });
        }
      });
    }

    if (newMarkersData.length === 0) return;

    // Create MapTiler Markers
    const bounds = new maptilersdk.LngLatBounds();
    
    newMarkersData.forEach((data) => {
      const el = document.createElement('div');
      el.className = 'custom-marker';
      
      const color = data.dayIndex === -1 ? '#f59e0b' : dayColors[data.dayIndex % dayColors.length];
      const iconHtml = data.dayIndex === -1 
        ? `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21h18M3 7v1a3 3 0 0 0 6 0V7m0 1a3 3 0 0 0 6 0V7m0 1a3 3 0 0 0 6 0V7M4 21V4a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v17"></path></svg>`
        : `<span style="font-weight:900; font-size:12px;">${data.placeIndex + 1}</span>`;

      el.innerHTML = `
        <div style="
          background: ${color};
          color: white;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          border: 3px solid white;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 10px 20px ${color}40;
          cursor: pointer;
          transition: all 0.2s ease;
        " class="marker-inner">
          ${iconHtml}
        </div>
      `;

      const m = new maptilersdk.Marker({ element: el })
        .setLngLat(data.lngLat)
        .addTo(map.current);

      // Popup logic remains same...
      el.addEventListener('click', () => {
        const popupContent = document.createElement('div');
        popupContent.className = 'p-2 min-w-[240px] font-sans';
        
        popupContent.innerHTML = `
          <div class="mb-4 rounded-xl overflow-hidden shadow-sm h-36 border border-slate-100">
            <img src="${data.image || 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=400'}" class="w-full h-full object-cover">
          </div>
          <div class="space-y-3">
            <div class="flex items-center justify-between">
              <span class="text-[9px] font-black text-emerald-600 uppercase bg-emerald-50 px-2.5 py-1 rounded-full">${data.time}</span>
              <span class="text-[9px] font-bold text-slate-400 uppercase tracking-widest">${categoryLabels[data.category] || data.category}</span>
            </div>
            <h3 class="text-base font-black text-slate-900 tracking-tight leading-tight">${data.name}</h3>
            ${data.address ? `
              <div class="flex items-start gap-1.5 text-[10px] text-slate-500 font-medium leading-tight">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                ${data.address}
              </div>
            ` : ''}
            <p class="text-[11px] text-slate-500 italic border-l-2 border-slate-200 pl-3 leading-relaxed">"${data.description}"</p>
            <div class="flex items-center justify-between pt-2">
              <div class="flex items-center gap-1.5 text-[10px] font-black text-emerald-600 uppercase">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="#f59e0b" stroke="#f59e0b" stroke-width="1"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
                ${data.estimatedCost}
              </div>
              <a href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(data.name + ' ' + (data.address || cityName))}" target="_blank" class="text-[9px] font-black text-blue-600 hover:text-blue-800 uppercase tracking-widest">
                 Google Maps
              </a>
            </div>
          </div>
        `;

        new maptilersdk.Popup({ closeButton: false, offset: 30 })
          .setLngLat(data.lngLat)
          .setDOMContent(popupContent)
          .addTo(map.current);
      });

      markersRef.current.push(m);
      bounds.extend(data.lngLat);
    });

    // Auto-fit with padding
    map.current.fitBounds(bounds, { padding: 80, maxZoom: 15 });

  }, [days, coordinates, selectedDay, destinationImages, lodgingOptions, cityName]);

  if (MAPTILER_API_KEY === "YOUR_MAPTILER_API_KEY") {
    return (
      <div className="w-full h-full bg-slate-50 flex flex-col items-center justify-center p-8 text-center space-y-4">
        <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center">
           <MapPin className="text-amber-600 w-8 h-8" />
        </div>
        <div>
          <h3 className="text-slate-800 font-black uppercase text-sm tracking-widest">Thiếu MapTiler API Key</h3>
          <p className="text-slate-400 text-xs font-medium mt-2 leading-relaxed">Vui lòng thêm VITE_MAPTILER_API_KEY vào file .env</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full relative group overflow-hidden bg-slate-50">
      <div ref={mapContainer} className="w-full h-full" />
      
      {/* Custom Styles for MapTiler Popups */}
      <style>{`
        .maplibregl-popup-content {
          border-radius: 24px !important;
          padding: 10px !important;
          box-shadow: 0 30px 60px -12px rgba(0, 0, 0, 0.2) !important;
          border: 1px solid rgba(255,255,255,0.9);
          backdrop-filter: blur(12px);
        }
        .maplibregl-popup-tip { display: none !important; }
        .marker-inner:hover {
          transform: scale(1.3) translateY(-10px);
          z-index: 200;
        }
      `}</style>

      {/* Day Legend */}
      <div className="absolute bottom-6 right-6 z-10 flex flex-wrap gap-2 pointer-events-none justify-end max-w-xs">
        {(days || []).map((day, idx) => {
          if (selectedDay !== null && selectedDay !== "hotels" && idx !== selectedDay) return null;
          if (selectedDay === "hotels") return null;
          return (
            <div key={idx} className="flex items-center gap-2.5 px-4 py-2 bg-white/95 backdrop-blur-xl rounded-2xl shadow-xl text-[9px] font-black uppercase tracking-widest border border-white">
              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: dayColors[idx % dayColors.length] }} />
              Ngày {day.day || idx + 1}
            </div>
          );
        })}
        {selectedDay === "hotels" && (
          <div className="flex items-center gap-2.5 px-4 py-2 bg-white/95 backdrop-blur-xl rounded-2xl shadow-xl text-[9px] font-black uppercase tracking-widest border border-white">
            <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            Khách sạn
          </div>
        )}
      </div>
    </div>
  );
}
