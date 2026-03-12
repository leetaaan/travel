import React, { useState, useEffect } from "react";
import { useLocation, useNavigate, useParams, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { auth, db } from "../firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import TripMap from "../components/TripMap";
import { fetchAllPlaceImages, fetchPlaceImage } from "../utils/fetchPlaceImage";
import { fetchHotelsFromBooking } from "../utils/fetchHotelsFromBooking";
import { formatVND, formatNumber } from "../utils/formatVND";
import TopMenu from "../components/TopMenu";
import {
  MapPin,
  Wallet,
  Calendar,
  Users,
  Sparkles,
  ChevronRight,
  TrendingUp,
  Navigation,
  Clock,
  Map as MapIcon,
  UtensilsCrossed,
  Landmark,
  Coffee,
  Code2,
  ChevronLeft,
  Hotel,
  BedDouble,
  Star,
  RefreshCw,
} from "lucide-react";
import { toast } from "react-hot-toast";

const dayColors = [
  "#10b981",
  "#3b82f6",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#ec4899",
  "#06b6d4",
];

const categoryLabels = {
  food: "Ẩm thực",
  cafe: "Cà phê",
  snack: "Ăn vặt",
  sightseeing: "Tham quan",
  entertainment: "Giải trí",
};

const validateImageUrl = (url, fallback = "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?q=80&w=800&auto=format&fit=crop") => {
  if (!url || typeof url !== 'string' || url === "" || url.includes("undefined") || url.includes("null")) return fallback;
  if (url.includes("source.unsplash.com")) return fallback;
  const lowerUrl = url.toLowerCase();
  if (lowerUrl.includes("flag") || lowerUrl.includes("logo") || lowerUrl.includes("icon") || lowerUrl.includes("banner") || lowerUrl.includes("map") || lowerUrl.includes("symbol")) return fallback;
  return url;
};

const TripResultPage = () => {
  const { state } = useLocation();
  const { id } = useParams();
  const navigate = useNavigate();

  const [tripData, setTripData] = useState(state?.itinerary || null);
  const [metadata, setMetadata] = useState(state?.metadata || null);
  const [destinationImages, setDestinationImages] = useState(new Map());
  const [coordinates, setCoordinates] = useState(new Map());
  const [selectedDay, setSelectedDay] = useState(null);
  const [cityImage, setCityImage] = useState("");
  const [hotelLoading, setHotelLoading] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        if (!tripData && id) {
          loadTripFromFirebase(id, user);
        } else if (tripData) {
          initData(tripData.destinations, metadata?.location);
        }
      } else if (!state?.itinerary && !id) {
        navigate("/login");
      }
    });
    return () => unsubscribe();
  }, [id, tripData, navigate, state]);

  const loadTripFromFirebase = async (tripId, user) => {
    setLoading(true);
    try {
      const docRef = doc(db, "users", user.uid, "itineraries", tripId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        const itinerary = {
          lodgingOptions: data.lodgingOptions || [],
          destinations: data.destinations || [],
          days: data.days || [],
          hotelsFetched: data.hotelsFetched || false,
        };
        const meta = {
          location: data.location,
          startDate: data.startDate,
          endDate: data.endDate,
          budget: data.budget,
          adults: data.adults,
          roomQty: data.roomQty,
        };
        setTripData(itinerary);
        setMetadata(meta);
        initData(itinerary.destinations, data.location, itinerary.lodgingOptions);
      } else {
        toast.error("Không tìm thấy lịch trình!");
        navigate("/planning");
      }
    } catch (error) {
      console.error("Error loading trip:", error);
      toast.error("Lỗi tải lịch trình");
    } finally {
      setLoading(false);
    }
  };

  const [cityCenter, setCityCenter] = useState(null);

  const initData = (destinations, location, hotels = []) => {
    // Images
    fetchAllPlaceImages(destinations, location).then(setDestinationImages);
    if (location) {
      fetchPlaceImage(location, 1200).then(setCityImage);
    }
    // Coordinates (Geocode places + hotels)
    import("../utils/geocode").then(({ geocodePlaces, geocodePlace }) => {
      const allToGeocode = [...destinations, ...hotels];
      geocodePlaces(allToGeocode, location).then(setCoordinates);
      
      // Get City Center for Map Initial Center
      if (location) {
        // We reuse the Nominatim logic through any geocode service if needed
        // For simplicity, let's just use geocodePlace normally if it were implemented
        // But since we want real results, we'll rely on TripMap's bounds for now.
      }
    });
  };

  const handleRefreshHotels = async () => {
    if (!metadata || hotelLoading) return;
    setHotelLoading(true);
    try {
      const hotels = await fetchHotelsFromBooking(
        metadata.location,
        metadata.startDate,
        metadata.endDate,
        metadata.adults,
        "",
        metadata.roomQty || 1
      );
      if (hotels && hotels.length > 0) {
        setTripData(prev => ({ ...prev, lodgingOptions: hotels }));
        
        // Save to Firebase so it's permanent
        if (auth.currentUser && id) {
          try {
            const docRef = doc(db, "users", auth.currentUser.uid, "itineraries", id);
            await updateDoc(docRef, { 
              lodgingOptions: hotels,
              hotelsFetched: true
            });
            setTripData(prev => ({ ...prev, hotelsFetched: true }));
            toast.success("Đã cập nhật dữ liệu khách sạn thực tế!");
          } catch (dbErr) {
            console.error("Firebase update error:", dbErr);
          }
        }
      } else {
        toast.info("Không tìm thấy khách sạn nào khác trong khu vực này.");
      }
    } catch (error) {
      console.error("Refresh hotels error:", error);
      toast.error("Không thể kết nối với Booking API");
    } finally {
      setHotelLoading(false);
    }
  };

  if (loading || !tripData) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="w-12 h-12 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-slate-600 font-bold animate-pulse">
          Đang tải lịch trình của bạn...
        </p>
      </div>
    );
  }

  return (
    <div className="h-screen bg-white flex flex-col font-sans selection:bg-emerald-100 selection:text-emerald-900 overflow-hidden">
      {/* HEADER SECTION */}
      <div className="bg-white border-b border-slate-100 px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-4 z-50 shadow-sm shrink-0">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate("/planning")}
            className="p-2 hover:bg-slate-50 rounded-xl transition-colors text-slate-400"
          >
            <ChevronLeft />
          </button>
          <div className="h-8 w-px bg-slate-100" />
          <div className="flex flex-col">
            <h1 className="text-lg font-black text-slate-800 tracking-tight flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-500" />
              Chuyến đi {metadata?.location}
            </h1>
            <div className="text-[10px] text-slate-400 font-black uppercase tracking-widest flex items-center gap-2">
              <span>
                {metadata?.startDate} - {metadata?.endDate}
              </span>
              <span className="w-1 h-1 bg-slate-200 rounded-full" />
              <span>{metadata?.adults} Khách</span>
              <span className="w-1 h-1 bg-slate-200 rounded-full" />
              <span>{formatNumber(metadata?.budget)} VND</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
          <button
            onClick={() => setSelectedDay(null)}
            className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-wider transition-all shrink-0 ${
              selectedDay === null
                ? "bg-emerald-600 text-white shadow-lg shadow-emerald-500/20"
                : "bg-slate-50 text-slate-400 hover:text-slate-600"
            }`}
          >
            Tổng quan
          </button>
          {tripData.days.map((day, idx) => (
            <button
              key={idx}
              onClick={() => setSelectedDay(idx)}
              className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-wider transition-all shrink-0 ${
                selectedDay === idx
                  ? "bg-emerald-600 text-white shadow-lg shadow-emerald-500/20"
                  : "bg-slate-50 text-slate-400 hover:text-slate-600"
              }`}
            >
              Ngày {day.day}
            </button>
          ))}
          <button
            onClick={() => {
              setSelectedDay("hotels");
              // Auto-refresh ONLY if we haven't successfully fetched from Booking yet
              if (!tripData?.hotelsFetched) {
                 handleRefreshHotels();
              }
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
              selectedDay === "hotels"
                ? "bg-amber-500 text-white shadow-lg shadow-amber-200"
                : "bg-white text-slate-400 hover:bg-slate-50"
            }`}
          >
            <Hotel className="w-3 h-3" />
            Khách sạn
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* LEFT COLUMN: ITINERARY / HOTELS */}
        <div className={`flex-1 h-full overflow-y-auto bg-slate-50/30 custom-scrollbar ${selectedDay === 'hotels' ? 'w-full' : 'lg:max-w-2xl border-r border-slate-100'}`}>
          <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-10">
            {selectedDay !== "hotels" ? (
              <>
                {/* HERO SUMMARY */}
                {selectedDay === null && (
                  <div className="relative rounded-[32px] overflow-hidden bg-emerald-600 text-white shadow-2xl shadow-emerald-900/10 mb-12">
                    <div className="h-64 relative">
                      <img
                        src={validateImageUrl(cityImage || destinationImages.get(0))}
                        className="w-full h-full object-cover mix-blend-overlay opacity-60"
                        alt={metadata?.location}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-emerald-700 via-emerald-600/40 to-transparent" />
                      <div className="absolute inset-0 p-8 flex flex-col justify-end">
                        <h2 className="text-4xl font-black italic tracking-tighter uppercase leading-none mb-4">
                          {tripData.days.length} Ngày Tại {metadata?.location}
                        </h2>
                        <p className="text-sm text-emerald-100/80 font-medium leading-relaxed max-w-lg italic">
                          Hành trình trải nghiệm độc đáo, khám phá những góc
                          khuất đầy mê hoặc và tinh túy ẩm thực của{" "}
                          {metadata?.location}.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* TIMELINE */}
                <div className="space-y-16 pb-20">
                  {tripData.days.map((day, dIdx) => {
                    if (selectedDay !== null && dIdx !== selectedDay)
                      return null;
                    return (
                      <motion.div
                        key={dIdx}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="space-y-8"
                      >
                        <div className="flex items-center gap-4">
                          <div className="text-2xl font-black text-slate-800 italic shrink-0">
                            Ngày {day.day}
                          </div>
                          <div className="h-px flex-1 bg-slate-200/50" />
                          <div className="text-slate-400 text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shrink-0 bg-white px-4 py-1.5 rounded-full border border-slate-100 shadow-sm">
                            <MapPin className="w-3.5 h-3.5 text-emerald-500" />
                            {day.area}
                          </div>
                        </div>

                        <div className="space-y-10 relative ml-4 pl-10 border-l-2 border-slate-100">
                          {day.places.map((place, pIdx) => {
                            const flatIdx = tripData.destinations.findIndex(
                              (d) => d.name === place.name,
                            );
                            return (
                              <div key={pIdx} className="relative group">
                                <div className="absolute left-[-52px] top-6 w-10 h-10 bg-white border-2 border-slate-100 rounded-full flex items-center justify-center z-10 shadow-sm transition-all group-hover:border-emerald-600 group-hover:bg-emerald-600">
                                  <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-emerald-500 transition-colors text-slate-400 group-hover:text-white">
                                    {place.category === "food" ? (
                                      <UtensilsCrossed className="w-4 h-4" />
                                    ) : place.category === "cafe" ? (
                                      <Coffee className="w-4 h-4" />
                                    ) : (
                                      <Landmark className="w-4 h-4" />
                                    )}
                                  </div>
                                </div>

                                <div className="bg-white p-6 rounded-[28px] border border-slate-50 shadow-[0_4px_20px_rgba(0,0,0,0.02)] hover:shadow-[0_10px_30px_rgba(0,0,0,0.06)] transition-all">
                                  <div className="flex-1 space-y-3">
                                    <div className="flex items-center justify-between">
                                      <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest bg-emerald-50 px-3 py-1 rounded-full">
                                        {place.time}
                                      </span>
                                      <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">
                                        {categoryLabels[place.category] ||
                                          place.category}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                      <h4 className="text-xl font-black text-slate-800 tracking-tight leading-none">
                                        {place.name}
                                      </h4>
                                      {place.is_verified && (
                                        <span className="flex items-center gap-1 bg-blue-50 text-blue-600 text-[8px] font-black uppercase tracking-tighter px-2 py-0.5 rounded-full border border-blue-100">
                                          <Sparkles className="w-2.5 h-2.5" />
                                          Đã xác thực
                                        </span>
                                      )}
                                    </div>
                                    {place.address && (
                                      <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-bold tracking-tight">
                                        <MapPin className="w-3.5 h-3.5 text-emerald-500/50" />
                                        {place.address}
                                      </div>
                                    )}
                                    <p className="text-xs text-slate-500 font-medium leading-relaxed italic opacity-80">
                                      "{place.description}"
                                    </p>
                                    <div className="flex items-center gap-6 pt-2">
                                      <div className="flex items-center gap-2 text-[10px] font-black uppercase text-slate-400 tracking-wider">
                                        <Clock className="w-4 h-4 text-slate-300" />
                                        {place.estimated_duration}
                                      </div>
                                      {place.estimated_cost && (
                                        <div className="flex items-center gap-2 text-[10px] font-black uppercase text-emerald-500 tracking-wider">
                                          <Wallet className="w-4 h-4 text-emerald-300" />
                                          {place.estimated_cost}
                                        </div>
                                      )}
                                      <a
                                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.name + " " + (place.address || metadata.location))}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="ml-auto text-[10px] font-black uppercase text-emerald-600 hover:text-emerald-800 transition-colors"
                                      >
                                        Google Maps
                                      </a>
                                    </div>
                                  </div>
                                </div>

                                {pIdx < day.places.length - 1 && (
                                  <div className="absolute left-[-41px] top-16 bottom-[-40px] w-0.5 border-l-2 border-dotted border-slate-200 pointer-events-none" />
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </>
            ) : (
              <div className="space-y-8 pb-20">
                  <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div className="flex flex-col gap-2">
                      <h2 className="text-2xl font-black text-slate-800 italic uppercase">
                        Khách sạn gợi ý
                      </h2>
                      <p className="text-sm text-slate-400 font-medium">
                        Bản danh sách được tối ưu theo ngân sách và vị trí di
                        chuyển.
                      </p>
                    </div>
                    <button
                      onClick={handleRefreshHotels}
                      disabled={hotelLoading}
                      className="group flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-emerald-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${hotelLoading ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'}`} />
                      {hotelLoading ? "Đang kết nối..." : "Tìm địa chỉ & Giá thực tế"}
                    </button>
                  </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {tripData.lodgingOptions.map((hotel, hIdx) => (
                    <motion.div
                      key={hIdx}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: hIdx * 0.05 }}
                      className="bg-white rounded-[32px] overflow-hidden border border-slate-100 shadow-sm hover:shadow-xl transition-all group"
                    >
                      <div className="h-48 overflow-hidden relative">
                        <img
                          src={validateImageUrl(hotel.image, "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?q=80&w=800&auto=format&fit=crop")}
                          className="w-full h-full object-cover transition-transform group-hover:scale-110 duration-500"
                          alt={hotel.name}
                        />
                        <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-sm text-[10px] font-black text-amber-500 flex items-center gap-1.5 border border-amber-100">
                          <Star className="w-3 h-3 fill-amber-500" />
                          {hotel.rating}
                        </div>
                      </div>
                      <div className="p-6 space-y-4">
                        <h3 className="text-lg font-black text-slate-800 leading-tight line-clamp-2">
                          {hotel.name}
                        </h3>
                        <div className="flex items-center gap-2">
                          <div className="text-xl font-black text-emerald-600">
                            {formatNumber(hotel.price)} VND
                          </div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase">
                            / Đêm
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                          <MapPin className="w-3.5 h-3.5 text-slate-300" />
                          {hotel.address || metadata?.location}
                        </div>
                        {hotel.benefit && (
                          <div className="flex items-center gap-2 text-[10px] font-bold text-emerald-500 bg-emerald-50/50 px-3 py-2 rounded-xl">
                            <Sparkles className="w-3.5 h-3.5" />
                            {hotel.benefit}
                          </div>
                        )}
                        <div className="grid grid-cols-2 gap-3 pt-2">
                          <a
                            href={hotel.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-blue-600 text-white h-11 flex items-center justify-center rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 transition-all font-sans"
                          >
                            Booking.com
                          </a>
                          <a
                            href={hotel.agodaLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-slate-800 text-white h-11 flex items-center justify-center rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all font-sans"
                          >
                            Agoda
                          </a>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                  {tripData.lodgingOptions.length === 0 && (
                    <div className="col-span-2 py-20 bg-slate-50 rounded-[32px] flex flex-col items-center justify-center text-center space-y-4 border-2 border-dashed border-slate-200">
                      <BedDouble className="w-12 h-12 text-slate-200" />
                      <p className="text-slate-400 font-bold">
                        Không tìm thấy khách sạn phù hợp trong tầm giá này.
                      </p>
                      <button
                        onClick={() => setSelectedDay(null)}
                        className="text-emerald-600 font-black uppercase text-[10px] tracking-widest"
                      >
                        Quay lại lịch trình
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: MAP */}
        <div className={`hidden ${selectedDay === 'hotels' ? 'lg:flex' : 'lg:block'} flex-1 bg-slate-100 relative overflow-hidden`}>
          <TripMap
            days={tripData.days}
            coordinates={coordinates}
            selectedDay={selectedDay}
            destinationImages={destinationImages}
            itineraryDestinations={tripData.destinations}
            cityName={metadata?.location}
            lodgingOptions={tripData.lodgingOptions}
          />
        </div>
      </div>
    </div>
  );
};

export default TripResultPage;
