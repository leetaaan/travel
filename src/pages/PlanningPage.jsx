import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { generateTripWithGemini } from "../utils/geminiService";
import { fetchHotelsFromBooking } from "../utils/fetchHotelsFromBooking";
import TripMap from "../components/TripMap";
import { fetchAllPlaceImages } from "../utils/fetchPlaceImage";
import { formatVND, formatNumber } from "../utils/formatVND";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import { auth, db } from "../firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination, Autoplay } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import TopMenu from "../components/TopMenu";
import {
  MapPin,
  Wallet,
  Calendar,
  Users,
  BedDouble,
  Sparkles,
  ChevronRight,
  TrendingUp,
  Hotel,
  Navigation,
  Clock,
  Star,
  Map as MapIcon,
  Trash2,
  UtensilsCrossed,
  Ticket,
  Landmark,
  Coffee,
  IceCreamCone,
  Code2,
} from "lucide-react";

const dayColors = [
  "#10b981", // Day 1 - Emerald
  "#3b82f6", // Day 2 - Blue
  "#f59e0b", // Day 3 - Amber
  "#ef4444", // Day 4 - Red
  "#8b5cf6", // Day 5 - Purple
  "#ec4899", // Day 6 - Pink
  "#06b6d4", // Day 7 - Cyan
];

const PlanningPage = () => {
  const navigate = useNavigate();
  const [location, setLocation] = useState("");
  const [budget, setBudget] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [adults, setAdults] = useState(2);
  const [roomQty, setRoomQty] = useState(1);
  const [destinationImages, setDestinationImages] = useState(new Map());
  const [user] = useState(auth.currentUser);
  const [saving, setSaving] = useState(false);
  const [savedId, setSavedId] = useState(null);

  // New UI states
  const [activePopup, setActivePopup] = useState(null); // 'dates', 'details', 'interests'
  const [interests, setInterests] = useState([]);
  const [tempBudget, setTempBudget] = useState("");
  const [tempAdults, setTempAdults] = useState(2);
  const [tempRooms, setTempRooms] = useState(1);

  const interestOptions = [
    { label: "Ăn thuần chay", icon: <UtensilsCrossed className="w-4 h-4" /> },
    { label: "Pizza & Đồ Ý", icon: <UtensilsCrossed className="w-4 h-4" /> },
    { label: "Bảo tàng", icon: <Star className="w-4 h-4" /> },
    { label: "Công viên", icon: <Star className="w-4 h-4" /> },
    { label: "Chợ địa phương", icon: <Star className="w-4 h-4" /> },
    { label: "Di tích lịch sử", icon: <Star className="w-4 h-4" /> },
    { label: "Bảo tàng nghệ thuật", icon: <Star className="w-4 h-4" /> },
    { label: "Tượng đài", icon: <Star className="w-4 h-4" /> },
  ];

  const handleInterestToggle = (label) => {
    setInterests((prev) =>
      prev.includes(label) ? prev.filter((i) => i !== label) : [...prev, label],
    );
  };

  const isPast = (d, m, y) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const current = new Date(y, m - 1, d);
    return current < today;
  };

  const handleDaySelect = (d, m, y) => {
    if (isPast(d, m, y)) return;

    const formattedMonth = m < 10 ? `0${m}` : m;
    const formattedDay = d < 10 ? `0${d}` : d;
    const dateStr = `${y}-${formattedMonth}-${formattedDay}`;

    if (!startDate || (startDate && endDate)) {
      setStartDate(dateStr);
      setEndDate("");
    } else {
      const start = new Date(startDate);
      const end = new Date(dateStr);
      if (end < start) {
        setStartDate(dateStr);
        setEndDate("");
      } else {
        setEndDate(dateStr);
      }
    }
  };

  const isSelected = (d, m, y) => {
    const formattedMonth = m < 10 ? `0${m}` : m;
    const formattedDay = d < 10 ? `0${d}` : d;
    const dateStr = `${y}-${formattedMonth}-${formattedDay}`;
    return dateStr === startDate || dateStr === endDate;
  };

  const isInRange = (d, m, y) => {
    if (!startDate || !endDate) return false;
    const formattedMonth = m < 10 ? `0${m}` : m;
    const formattedDay = d < 10 ? `0${d}` : d;
    const dateStr = `${y}-${formattedMonth}-${formattedDay}`;
    const current = new Date(dateStr);
    return current > new Date(startDate) && current < new Date(endDate);
  };

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      // setUser(currentUser); // Removed setUser as user is initialized with auth.currentUser
    });

    const handleClickOutside = (e) => {
      // If activePopup is set and the click is outside any popup-trigger or popup itself
      if (activePopup) {
        // e.target.closest logic to find if it's part of a pill or its popup
        if (!e.target.closest(".search-pill-container")) {
          setActivePopup(null);
        }
      }
    };
    window.addEventListener("mousedown", handleClickOutside);

    return () => {
      unsubscribe();
      window.removeEventListener("mousedown", handleClickOutside);
    };
  }, [activePopup]);

  const handleGenerateItinerary = async () => {
    if (!location || !budget || !startDate || !endDate) {
      toast.error("Vui lòng điền đầy đủ tất cả các trường.");
      return;
    }
    setLoading(true);
    // setItinerary(null); // Removed as itinerary is no longer state
    // setCoordinates(new Map()); // Removed as coordinates is no longer state
    // setSelectedDay(null); // Removed as selectedDay is no longer state

    const cleanedLocation = location.trim();
    if (cleanedLocation.length < 3) {
      toast.error("Vui lòng nhập tên địa điểm rõ ràng (tối thiểu 3 ký tự).");
      setLoading(false);
      return;
    }

    // Calculate number of days
    const start = new Date(startDate);
    const end = new Date(endDate);
    const numDays = Math.max(
      1,
      Math.ceil((end - start) / (1000 * 60 * 60 * 24)),
    );

    try {
      const prompt = `
          Tạo một lịch trình du lịch TỐI ƯU VỀ DI CHUYỂN trong ${numDays} ngày tại "${cleanedLocation}" với ngân sách ${budget} VND.

          ⚠️ YÊU CẦU QUAN TRỌNG VỀ LỘ TRÌNH:
          1. TỐI ƯU HÓA DI CHUYỂN: Các địa điểm trong cùng 1 ngày PHẢI nằm gần nhau hoặc trên cùng một cung đường. Tránh việc di chuyển chéo qua lại thành phố.
          2. CỤM ĐỊA ĐIỂM (CLUSTERING): Mỗi ngày tập trung vào 1 khu vực cụ thể (ví dụ: Day 1 - Trung tâm, Day 2 - Phía Đông, Day 3 - Khu vực ngoại ô).
          3. THỨ TỰ LOGIC: Sắp xếp các điểm theo trình tự thời gian từ sáng đến tối sao cho quãng đường nối tiếp nhau là ngắn nhất.

          ⚠️ YÊU CẦU VỀ NỘI DUNG:
          - Mỗi ngày PHẢI bao gồm: Ăn sáng, Tham quan sáng, Ăn trưa, Tham quan chiều, Cà phê và Ăn tối.
          - TÊN ĐỊA ĐIỂM: Phải là tên CHÍNH THỨC, đang hoạt động.
          - ĐỊA CHỈ: Chi tiết (Số nhà, đường, phường, quận).
          - TỌA ĐỘ: lat/lng chuẩn xác theo địa chỉ.

        JSON MẪU:
        {
          "days": [
            {
              "day": 1,
              "area": "Khu vực trung tâm & Hồ Xuân Hương",
              "places": [
                {
                  "name": "Bánh căn Lệ",
                  "description": "Thưởng thức bữa sáng đặc sản nổi tiếng.",
                  "category": "food",
                  "time": "7:30 AM",
                  "estimated_duration": "1 giờ",
                  "estimated_cost": "50,000 VND",
                  "address": "27/44 Yersin, Phường 10, Đà Lạt",
                  "lat": 11.9397,
                  "lng": 108.4492
                }
              ]
            }
          ]
        }
        Chỉ trả về JSON.
      `;

      const messages = [
        {
          role: "system",
          content: `You are a professional Travel Logistics Expert for "${cleanedLocation}", Vietnam. 
          Your priority is creating itineraries that are LOGISTICALLY SOUND. 
          - Group nearby attractions together in the same day.
          - Minimize travel time between points.
          - Ensure addresses are precise (Street, Ward, District).
          - Use REAL, verified coordinates.`,
        },
        { role: "user", content: prompt },
      ];

      const text = await generateTripWithGemini(messages);
      if (!text) {
        throw new Error("AI không trả về kết quả. Vui lòng thử lại.");
      }
      let parsedItinerary = JSON.parse(text);

      // ENRICHMENT STEP: Use Foursquare to get REAL addresses
      try {
        const { enrichItinerary } = await import("../utils/foursquareService");
        const enriched = await enrichItinerary(parsedItinerary, cleanedLocation);
        parsedItinerary = enriched;
      } catch (enrichError) {
        console.warn("Could not enrich with Foursquare:", enrichError);
      }

      localStorage.setItem(
        "last_ai_itinerary",
        JSON.stringify(parsedItinerary, null, 2),
      );
      const days = parsedItinerary.days || [];

      // Convert days format back to flat destinations for backward compatibility
      const destinations = [];
      days.forEach((day) => {
        (day.places || []).forEach((place) => {
          destinations.push({
            name: place.name,
            category: place.category,
            time: `Day ${day.day}, ${place.time}`,
            address: place.address || "",
            lat: place.lat || null,
            lng: place.lng || null,
            ticket_price: place.estimated_cost || "",
            image_keyword: place.name,
            description: place.description || "",
            estimated_duration: place.estimated_duration || "",
          });
        });
      });

      // Fetch hotels
      let filteredHotels = [];
      let hotelsFetched = false;
      try {
        const hotels = await fetchHotelsFromBooking(
          cleanedLocation,
          startDate,
          endDate,
          adults,
          "",
          roomQty,
        );
        const budgetNumber = Number(budget);
        filteredHotels = hotels.filter(
          (hotel) =>
            hotel.price !== null &&
            !isNaN(hotel.price) &&
            Number(hotel.price) <= budgetNumber,
        );
        hotelsFetched = true;
      } catch (bookingError) {
        console.warn("Booking API lỗi, dùng AI gợi ý khách sạn:", bookingError);
        try {
          const hotelPrompt = `Gợi ý 6 khách sạn/homestay CÓ THẬT tại "${cleanedLocation}" dưới ${formatVND(Number(budget))}/đêm.
          Khách sạn PHẢI NẰM TRONG "${cleanedLocation}". Tên ĐÚNG như trên Booking.com/Agoda. 
          ĐỊA CHỈ PHẢI CHI TIẾT (Số nhà, tên đường, phường, quận).
          JSON key "hotels": [{"name":"","price":0,"rating":0,"address":"Số nhà, Tên đường, Phường, Quận","benefit":"","lat":0.0,"lng":0.0}]
          Chỉ JSON.`;
          const hotelMessages = [
            {
              role: "system",
              content: `Hotel expert. Only REAL hotels on Booking.com/Agoda in "${cleanedLocation}". Valid JSON only.`,
            },
            { role: "user", content: hotelPrompt },
          ];
          const hotelText = await generateTripWithGemini(hotelMessages);
          if (hotelText) {
            const parsedHotels = JSON.parse(hotelText);
            const rawHotels = parsedHotels.hotels || [];
            
            // Xác thực tọa độ khách sạn AI bằng Foursquare/Nominatim
            const { searchPlace, searchPlaceNominatim } = await import("../utils/foursquareService");
            const verifiedHotels = [];
            
            for (const h of rawHotels) {
              console.log(`🏨 Đang xác thực khách sạn: ${h.name}...`);
              let v = await searchPlace(h.name, cleanedLocation, h.address);
              if (!v) v = await searchPlaceNominatim(h.name, cleanedLocation, h.address);
              
              const bookingParams = new URLSearchParams({
                ss: h.name + " " + cleanedLocation,
              });
              
              verifiedHotels.push({
                ...h,
                image: `https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?q=80&w=400&auto=format&fit=crop`,
                link: `https://www.booking.com/searchresults.vi.html?${bookingParams.toString()}`,
                lat: v?.lat || h.lat || null,
                lng: v?.lng || h.lng || null,
                address: v?.address || h.address || ""
              });
            }
            filteredHotels = verifiedHotels;
          }
        } catch (aiError) {
          console.error("AI hotel fallback cũng lỗi:", aiError);
        }
      }

      const fullItinerary = {
        lodgingOptions: filteredHotels,
        destinations,
        days,
      };

      const metadata = {
        location: cleanedLocation,
        budget: Number(budget),
        startDate,
        endDate,
        adults: Number(adults),
        roomQty: Number(roomQty),
      };

      // Auto-save to Firebase and Navigate
      if (user) {
        try {
          const docRef = await addDoc(
            collection(db, "users", user.uid, "itineraries"),
            {
              ...metadata,
              days,
              destinations,
              lodgingOptions: filteredHotels,
              hotelsFetched,
              createdAt: serverTimestamp(),
            },
          );
          toast.success("Lịch trình đã được tạo!");
          navigate(`/trip-result/${docRef.id}`, {
            state: { itinerary: fullItinerary, metadata },
          });
        } catch (saveError) {
          console.error("Lỗi lưu lịch trình:", saveError);
          navigate("/trip-result", {
            state: { itinerary: fullItinerary, metadata },
          });
        }
      } else {
        navigate("/trip-result", {
          state: { itinerary: fullItinerary, metadata },
        });
      }
    } catch (error) {
      console.error("Lỗi khi tạo lịch trình:", error);
      toast.error("Không thể tạo lịch trình. Vui lòng thử lại sau.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen bg-white flex flex-col overflow-hidden font-sans">
      <TopMenu />

      <div className="flex flex-1 overflow-hidden">
        {/* MAIN COLUMN */}
        <div className="flex-1 overflow-y-auto w-full flex flex-col items-center bg-[#F0EEE9] relative">
          <div className="w-full h-full flex flex-col items-center justify-start pt-32 px-4 space-y-12 bg-gradient-to-br from-[#F0EEE9] via-[#E8F5E9] to-[#F0EEE9]">
            <div className="text-center space-y-4 max-w-2xl">
              <p className="text-slate-600 text-xl font-medium tracking-tight">
                Tạo lịch trình du lịch cá nhân hóa của riêng bạn chỉ trong vài
                giây!
              </p>
            </div>

            {/* SEARCH BAR PILLS - SPLIT 2-2 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-4xl">
              {/* Location Pill */}
              <div className="relative w-full">
                <div className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-600">
                  <MapPin />
                </div>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Bạn muốn đi du lịch ở đâu?"
                  className="w-full h-[72px] bg-white rounded-full pl-16 pr-8 font-bold text-slate-800 outline-none shadow-xl shadow-emerald-900/5 text-lg border border-white focus:ring-2 ring-emerald-500/20 transition-all"
                />
              </div>

              {/* Dates Pill */}
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  setActivePopup(activePopup === "dates" ? null : "dates");
                }}
                className="search-pill-container h-[72px] bg-white rounded-full px-8 flex items-center gap-4 shadow-xl shadow-emerald-900/5 group relative w-full border border-white cursor-pointer hover:bg-slate-50 transition-all"
                role="button"
                tabIndex={0}
              >
                <Calendar className="w-6 h-6 text-emerald-600" />
                <span className="font-bold text-slate-800 text-lg overflow-hidden text-ellipsis whitespace-nowrap">
                  {startDate && endDate
                    ? `${startDate} - ${endDate}`
                    : "Ngày đi & về"}
                </span>

                <AnimatePresence>
                  {activePopup === "dates" && (
                    <motion.div
                      initial={{ opacity: 0, y: 20, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 20, scale: 0.95 }}
                      className="absolute top-[84px] left-0 md:left-auto md:right-0 bg-white rounded-[32px] shadow-2xl p-8 z-[100] min-w-[650px] border border-slate-100"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex gap-12">
                        {/* Calendar View */}
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-6">
                            <button className="p-2 hover:bg-slate-50 rounded-full transition-colors">
                              <ChevronRight className="w-5 h-5 rotate-180 text-slate-400" />
                            </button>
                            <span className="font-black text-slate-800">
                              Mar 2026
                            </span>
                            <div />
                          </div>
                          <div className="grid grid-cols-7 gap-y-4 text-center">
                            {["T2", "T3", "T4", "T5", "T6", "T7", "CN"].map(
                              (d) => (
                                <div
                                  key={d}
                                  className="text-[10px] font-black text-slate-400 uppercase"
                                >
                                  {d}
                                </div>
                              ),
                            )}
                            <div className="h-px bg-slate-100 col-span-7 mb-2" />
                            {Array.from({ length: 31 }, (_, i) => i + 1).map(
                              (d) => {
                                const selected = isSelected(d, 3, 2026);
                                const inRange = isInRange(d, 3, 2026);
                                const past = isPast(d, 3, 2026);
                                return (
                                  <div
                                    key={d}
                                    onClick={() => handleDaySelect(d, 3, 2026)}
                                    className={`text-sm font-bold flex items-center justify-center h-10 w-10 mx-auto rounded-full transition-all ${
                                      past
                                        ? "text-slate-200 cursor-not-allowed"
                                        : selected
                                          ? "bg-emerald-600 text-white shadow-lg shadow-emerald-500/30 cursor-pointer"
                                          : inRange
                                            ? "bg-emerald-50 text-emerald-700 cursor-pointer"
                                            : "text-slate-600 hover:bg-slate-50 cursor-pointer"
                                    }`}
                                  >
                                    {d}
                                  </div>
                                );
                              },
                            )}
                          </div>
                        </div>

                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-6">
                            <div />
                            <span className="font-black text-slate-800">
                              Apr 2026
                            </span>
                            <button className="p-2 hover:bg-slate-50 rounded-full transition-colors">
                              <ChevronRight className="w-5 h-5 text-slate-400" />
                            </button>
                          </div>
                          <div className="grid grid-cols-7 gap-y-4 text-center">
                            {["T2", "T3", "T4", "T5", "T6", "T7", "CN"].map(
                              (d) => (
                                <div
                                  key={d}
                                  className="text-[10px] font-black text-slate-400 uppercase"
                                >
                                  {d}
                                </div>
                              ),
                            )}
                            <div className="h-px bg-slate-100 col-span-7 mb-2" />
                            {Array.from({ length: 30 }, (_, i) => i + 1).map(
                              (d) => {
                                const selected = isSelected(d, 4, 2026);
                                const inRange = isInRange(d, 4, 2026);
                                const past = isPast(d, 4, 2026);
                                return (
                                  <div
                                    key={d}
                                    onClick={() => handleDaySelect(d, 4, 2026)}
                                    className={`text-sm font-bold flex items-center justify-center h-10 w-10 mx-auto rounded-full transition-all ${
                                      past
                                        ? "text-slate-200 cursor-not-allowed"
                                        : selected
                                          ? "bg-emerald-600 text-white shadow-lg shadow-emerald-500/30 cursor-pointer"
                                          : inRange
                                            ? "bg-emerald-50 text-emerald-700 cursor-pointer"
                                            : "text-slate-600 hover:bg-slate-50 cursor-pointer"
                                    }`}
                                  >
                                    {d}
                                  </div>
                                );
                              },
                            )}
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => setActivePopup(null)}
                        className="w-full mt-8 h-14 bg-emerald-600 text-white rounded-full font-black uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-500/30"
                      >
                        Xác nhận
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Details Pill */}
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  setActivePopup(activePopup === "details" ? null : "details");
                }}
                className="search-pill-container h-[72px] bg-white rounded-full px-8 flex items-center gap-4 shadow-xl shadow-emerald-900/5 w-full relative border border-white cursor-pointer hover:bg-slate-50 transition-all"
                role="button"
                tabIndex={0}
              >
                <Users className="w-6 h-6 text-emerald-600" />
                <span className="font-bold text-slate-800 text-lg overflow-hidden text-ellipsis whitespace-nowrap">
                  {adults} Khách, {budget ? formatNumber(budget) : "Chưa đặt"}{" "}
                  VND
                </span>

                <AnimatePresence>
                  {activePopup === "details" && (
                    <motion.div
                      initial={{ opacity: 0, y: 20, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 20, scale: 0.95 }}
                      className="absolute top-[84px] left-0 md:left-1/2 md:-translate-x-1/2 bg-white rounded-[32px] shadow-2xl p-8 z-[100] min-w-[400px] border border-slate-100 space-y-6"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="space-y-2 text-left">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">
                          Ngân sách (VND)
                        </label>
                        <input
                          type="text"
                          value={budget ? formatNumber(budget) : ""}
                          onChange={(e) =>
                            setBudget(e.target.value.replace(/[^0-9]/g, ""))
                          }
                          placeholder="Nhập ngân sách..."
                          className="w-full h-14 bg-slate-50 rounded-2xl px-6 font-bold text-slate-800 outline-none focus:ring-2 ring-emerald-500/20"
                        />
                      </div>
                      <div className="flex gap-4 text-left">
                        <div className="flex-1 space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">
                            Số người
                          </label>
                          <input
                            type="number"
                            min="1"
                            value={adults}
                            onChange={(e) =>
                              setAdults(
                                Math.max(1, parseInt(e.target.value) || 1),
                              )
                            }
                            className="w-full h-14 bg-slate-50 rounded-2xl px-6 font-bold text-slate-800 outline-none"
                          />
                        </div>
                        <div className="flex-1 space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">
                            Số phòng
                          </label>
                          <input
                            type="number"
                            min="1"
                            value={roomQty}
                            onChange={(e) =>
                              setRoomQty(
                                Math.max(1, parseInt(e.target.value) || 1),
                              )
                            }
                            className="w-full h-14 bg-slate-50 rounded-2xl px-6 font-bold text-slate-800 outline-none"
                          />
                        </div>
                      </div>
                      <button
                        onClick={() => setActivePopup(null)}
                        className="w-full h-14 bg-emerald-600 text-white rounded-full font-black uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-500/30"
                      >
                        Xác nhận
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Interests Pill */}
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  setActivePopup(
                    activePopup === "interests" ? null : "interests",
                  );
                }}
                className="search-pill-container h-[72px] bg-white rounded-full px-8 flex items-center gap-4 shadow-xl shadow-emerald-900/5 w-full relative border border-white cursor-pointer hover:bg-slate-50 transition-all"
                role="button"
                tabIndex={0}
              >
                <Star className="w-6 h-6 text-emerald-600" />
                <span className="font-bold text-slate-800 text-lg overflow-hidden text-ellipsis whitespace-nowrap">
                  {interests.length > 0
                    ? `${interests.length} Sở thích`
                    : "Sở thích"}
                </span>

                <AnimatePresence>
                  {activePopup === "interests" && (
                    <motion.div
                      initial={{ opacity: 0, y: 20, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 20, scale: 0.95 }}
                      className="absolute top-[84px] left-0 md:left-auto md:right-0 bg-white rounded-[32px] shadow-2xl p-6 z-[100] min-w-[320px] border border-slate-100"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="max-h-[300px] overflow-y-auto no-scrollbar space-y-1">
                        {interestOptions.map((opt) => (
                          <button
                            key={opt.label}
                            onClick={() => handleInterestToggle(opt.label)}
                            className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all ${
                              interests.includes(opt.label)
                                ? "bg-emerald-50 text-emerald-600"
                                : "text-slate-600 hover:bg-slate-50"
                            }`}
                          >
                            <div
                              className={
                                interests.includes(opt.label)
                                  ? "text-emerald-600"
                                  : "text-slate-400"
                              }
                            >
                              {opt.icon}
                            </div>
                            <span className="font-bold text-sm tracking-tight text-left">
                              {opt.label}
                            </span>
                          </button>
                        ))}
                      </div>
                      <button
                        onClick={() => setActivePopup(null)}
                        className="w-full mt-6 h-14 bg-emerald-600 text-white rounded-full font-black uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-500/30"
                      >
                        Xác nhận
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Generate Button Center Below */}
            <button
              onClick={handleGenerateItinerary}
              disabled={loading}
              className="h-[72px] bg-emerald-600 text-white rounded-full px-16 font-black uppercase tracking-widest flex items-center gap-3 shadow-2xl shadow-emerald-900/30 hover:bg-emerald-700 transition-all active:scale-95 disabled:opacity-70 disabled:pointer-events-none z-10"
            >
              {loading ? (
                <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Sparkles className="w-5 h-5 text-emerald-300" />
              )}
              {loading ? "Đang tạo..." : "Bắt đầu tạo"}
            </button>

            {/* Decorative Text */}
            <div className="pt-20 opacity-10 hover:opacity-100 transition-opacity duration-1000">
              <div className="flex gap-12 text-emerald-900 font-black italic text-8xl uppercase tracking-tighter select-none pointer-events-none">
                <span>Khám phá</span>
                <Sparkles className="w-20 h-20 self-center text-emerald-600" />
                <span>Hành trình</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlanningPage;
