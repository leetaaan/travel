import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { auth, db } from "../firebase";
import {
  collection,
  query,
  orderBy,
  getDocs,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { formatVND } from "../utils/formatVND";
import { toast } from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import TopMenu from "../components/TopMenu";
import {
  MapPin,
  Calendar,
  Users,
  Wallet,
  Clock,
  Trash2,
  ChevronDown,
  ChevronUp,
  Navigation,
  Sparkles,
  UtensilsCrossed,
  Coffee,
  IceCreamCone,
  Landmark,
  Ticket,
  BedDouble,
  Star,
  Hotel,
  ArrowLeft,
  Eye,
} from "lucide-react";

const PlanningHistoryPage = () => {
  const [user, setUser] = useState(null);
  const [itineraries, setItineraries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
      if (!currentUser) {
        navigate("/login");
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  useEffect(() => {
    if (!user) return;

    const fetchItineraries = async () => {
      setLoading(true);
      try {
        const q = query(
          collection(db, "users", user.uid, "itineraries"),
          orderBy("createdAt", "desc"),
        );
        const snapshot = await getDocs(q);
        const items = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setItineraries(items);
      } catch (error) {
        console.error("Lỗi tải lịch trình:", error);
        toast.error("Không thể tải lịch trình.");
      } finally {
        setLoading(false);
      }
    };

    fetchItineraries();
  }, [user]);

  const handleDelete = async (id) => {
    if (!user) return;
    if (!window.confirm("Bạn có chắc muốn xóa lịch trình này?")) return;

    try {
      await deleteDoc(doc(db, "users", user.uid, "itineraries", id));
      setItineraries((prev) => prev.filter((item) => item.id !== id));
      toast.success("Đã xóa lịch trình!");
    } catch (error) {
      console.error("Lỗi xóa:", error);
      toast.error("Không thể xóa lịch trình.");
    }
  };

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const getCategoryStyle = (category) => {
    switch (category) {
      case "food":
        return {
          bg: "bg-orange-500/10 text-orange-600 border-orange-200/50",
          gradient: "from-orange-400 to-red-400",
          icon: <UtensilsCrossed className="w-3 h-3" />,
          label: "Ăn uống",
        };
      case "cafe":
        return {
          bg: "bg-amber-500/10 text-amber-700 border-amber-200/50",
          gradient: "from-amber-500 to-yellow-600",
          icon: <Coffee className="w-3 h-3" />,
          label: "Cà phê",
        };
      case "snack":
        return {
          bg: "bg-pink-500/10 text-pink-600 border-pink-200/50",
          gradient: "from-pink-400 to-rose-400",
          icon: <IceCreamCone className="w-3 h-3" />,
          label: "Ăn vặt",
        };
      case "entertainment":
        return {
          bg: "bg-purple-500/10 text-purple-600 border-purple-200/50",
          gradient: "from-purple-400 to-indigo-400",
          icon: <Sparkles className="w-3 h-3" />,
          label: "Vui chơi",
        };
      default:
        return {
          bg: "bg-emerald-500/10 text-emerald-600 border-emerald-200/50",
          gradient: "from-emerald-400 to-teal-400",
          icon: <Landmark className="w-3 h-3" />,
          label: "Tham quan",
        };
    }
  };

  const validateImageUrl = (url, fallback = "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?q=80&w=400&auto=format&fit=crop") => {
    if (!url || typeof url !== 'string' || url === "" || url.includes("undefined") || url.includes("null")) return fallback;
    if (url.includes("source.unsplash.com")) return fallback;
    const lowerUrl = url.toLowerCase();
    if (lowerUrl.includes("flag") || lowerUrl.includes("logo") || lowerUrl.includes("icon") || lowerUrl.includes("banner") || lowerUrl.includes("map") || lowerUrl.includes("symbol")) return fallback;
    return url;
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    return d.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const getDayCount = (start, end) => {
    if (!start || !end) return 0;
    const s = new Date(start);
    const e = new Date(end);
    return Math.ceil((e - s) / (1000 * 60 * 60 * 24)) + 1;
  };

  return (
    <div className="min-h-screen bg-slate-50 relative overflow-hidden pb-20">
      {/* Background effect - same as PlanningPage */}
      <div className="absolute top-0 right-0 -mr-40 -mt-40 w-[600px] h-[600px] bg-emerald-400/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/2 left-0 -ml-40 w-[500px] h-[500px] bg-blue-400/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-purple-400/5 rounded-full blur-[100px] pointer-events-none" />

      <TopMenu />

      <div className="relative z-10 max-w-5xl mx-auto px-4 md:px-6 pt-8 md:pt-12">
        {/* Back button */}
        <motion.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => navigate("/planning")}
          className="flex items-center gap-2 text-sm font-bold text-slate-400 hover:text-primary transition-colors mb-8 group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Quay lại tạo lịch trình
        </motion.button>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary/5 rounded-full text-primary text-[10px] font-black uppercase tracking-[0.2em] mb-6 border border-primary/10 shadow-sm">
            <Navigation className="w-3.5 h-3.5" />
            Lịch sử lập kế hoạch
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-slate-800 tracking-tighter mb-4">
            Lịch trình{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-emerald-400">
              đã lưu
            </span>
          </h1>
          <p className="text-slate-400 text-lg max-w-xl mx-auto font-medium">
            Xem lại tất cả lịch trình du lịch bạn đã tạo trước đó
          </p>
        </motion.div>

        {/* Loading Skeleton */}
        {loading && (
          <div className="space-y-6">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="animate-pulse bg-white/60 backdrop-blur-xl rounded-[32px] border border-white/60 p-8"
              >
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-slate-200/50 rounded-2xl" />
                  <div className="flex-1">
                    <div className="h-6 bg-slate-200/50 rounded-xl w-40 mb-2" />
                    <div className="h-4 bg-slate-100/50 rounded-lg w-80" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && itineraries.length === 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white/60 backdrop-blur-xl p-16 rounded-[40px] border border-white/60 text-center shadow-sm"
          >
            <div className="w-28 h-28 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-full flex items-center justify-center mx-auto mb-8 border border-emerald-100/50">
              <Navigation className="w-12 h-12 text-emerald-300" />
            </div>
            <h3 className="text-2xl font-black text-slate-600 mb-3">
              Chưa có lịch trình nào
            </h3>
            <p className="text-slate-400 mb-10 max-w-sm mx-auto">
              Hãy tạo lịch trình đầu tiên để bắt đầu hành trình khám phá!
            </p>
            <button
              onClick={() => navigate("/planning")}
              className="btn-liquid px-10 py-3 h-auto group"
            >
              <div className="btn-liquid-shine" />
              <Sparkles className="w-5 h-5 relative z-10" />
              <span className="relative z-10 ml-2">Tạo lịch trình mới</span>
            </button>
          </motion.div>
        )}

        {/* Stats Bar */}
        {!loading && itineraries.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex flex-wrap items-center justify-between gap-4 mb-8 bg-white/50 backdrop-blur-xl rounded-2xl px-6 py-4 border border-white/60"
          >
            <p className="text-sm font-bold text-slate-500">
              Tổng cộng{" "}
              <span className="text-primary font-black text-lg">
                {itineraries.length}
              </span>{" "}
              lịch trình
            </p>
            <button
              onClick={() => navigate("/planning")}
              className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-full text-xs font-black hover:bg-primary/90 transition-all hover:shadow-lg hover:shadow-primary/20 hover:-translate-y-0.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Tạo mới
            </button>
          </motion.div>
        )}

        {/* Itinerary List */}
        <div className="space-y-6">
          <AnimatePresence>
            {itineraries.map((item, idx) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: idx * 0.06 }}
                className="bg-white/70 backdrop-blur-xl rounded-[32px] border border-white/60 shadow-sm hover:shadow-lg hover:shadow-slate-200/50 transition-all duration-300 overflow-hidden group"
              >
                {/* Card Header */}
                <div
                  className="p-6 md:p-8 cursor-pointer"
                  onClick={() => toggleExpand(item.id)}
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex-1">
                      {/* Location */}
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-primary to-emerald-400 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-transform">
                          <MapPin className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <h3 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight">
                            {item.location}
                          </h3>
                          <p className="text-xs text-slate-400 font-medium mt-0.5">
                            {getDayCount(item.startDate, item.endDate)} ngày ·{" "}
                            {item.destinations?.length || 0} địa điểm
                          </p>
                        </div>
                      </div>

                      {/* Info badges */}
                      <div className="flex flex-wrap items-center gap-2">
                        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/5 text-primary rounded-xl text-[10px] font-black uppercase tracking-widest border border-primary/10">
                          <Calendar className="w-3 h-3" />
                          {formatDate(item.startDate)} →{" "}
                          {formatDate(item.endDate)}
                        </div>
                        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-xl text-[10px] font-black tracking-wider border border-emerald-100">
                          <Wallet className="w-3 h-3" />
                          {formatVND(item.budget)}
                        </div>
                        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 text-slate-500 rounded-xl text-[10px] font-black tracking-wider border border-slate-100">
                          <Users className="w-3 h-3" />
                          {item.adults} người · {item.roomQty} phòng
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 md:flex-col">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(item.id);
                          }}
                          className="p-3 bg-red-50 hover:bg-red-100 text-red-400 hover:text-red-500 rounded-2xl transition-all hover:scale-105"
                          title="Xóa lịch trình"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/trip-result/${item.id}`);
                          }}
                          className="p-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 rounded-2xl transition-all hover:scale-105"
                          title="Xem bản đồ & chi tiết"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>
                      <div
                        className={`p-3 rounded-2xl transition-all ${
                          expandedId === item.id
                            ? "bg-primary/10 text-primary"
                            : "bg-slate-50 text-slate-300 hover:text-slate-500"
                        }`}
                      >
                        {expandedId === item.id ? (
                          <ChevronUp className="w-5 h-5" />
                        ) : (
                          <ChevronDown className="w-5 h-5" />
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Expanded Content */}
                <AnimatePresence>
                  {expandedId === item.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.35, ease: "easeInOut" }}
                      className="overflow-hidden"
                    >
                      <div className="px-6 md:px-8 pb-8">
                        <div className="border-t border-slate-100/80 pt-6" />

                        {/* Hotels Section */}
                        {item.lodgingOptions &&
                          item.lodgingOptions.length > 0 && (
                            <div className="mb-8">
                              <div className="flex items-center gap-2 mb-4">
                                <div className="w-7 h-7 bg-emerald-50 rounded-lg flex items-center justify-center">
                                  <Hotel className="w-3.5 h-3.5 text-emerald-500" />
                                </div>
                                <h4 className="text-xs font-black text-slate-500 uppercase tracking-[0.15em]">
                                  Chỗ ở đề xuất
                                </h4>
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                {item.lodgingOptions
                                  .slice(0, 3)
                                  .map((lodge, lIdx) => (
                                    <motion.div
                                      key={lIdx}
                                      initial={{ opacity: 0, y: 10 }}
                                      animate={{ opacity: 1, y: 0 }}
                                      transition={{ delay: lIdx * 0.05 }}
                                      className="bg-white/60 border border-white/60 rounded-2xl p-4 flex items-center gap-3 hover:bg-white/80 transition-colors"
                                    >
                                      <img
                                        src={validateImageUrl(lodge.image)}
                                        alt={lodge.name}
                                        className="w-16 h-16 rounded-xl object-cover flex-shrink-0 shadow-sm"
                                      />
                                      <div className="min-w-0 flex-1">
                                        <p className="text-sm font-bold text-slate-700 line-clamp-2 leading-tight">
                                          {lodge.name}
                                        </p>
                                        <div className="flex items-center gap-2 mt-1.5">
                                          <span className="text-base font-black text-primary">
                                            {formatVND(lodge.price)}
                                          </span>
                                          {lodge.rating && (
                                            <span className="flex items-center gap-0.5 px-1.5 py-0.5 bg-amber-50 rounded-md">
                                              <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                                              <span className="text-[10px] text-amber-600 font-black">
                                                {lodge.rating}
                                              </span>
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                    </motion.div>
                                  ))}
                              </div>
                            </div>
                          )}

                        {/* Destinations Timeline */}
                        <div className="flex items-center gap-2 mb-5">
                          <div className="w-7 h-7 bg-blue-50 rounded-lg flex items-center justify-center">
                            <Navigation className="w-3.5 h-3.5 text-blue-500" />
                          </div>
                          <h4 className="text-xs font-black text-slate-500 uppercase tracking-[0.15em]">
                            Lộ trình chi tiết
                          </h4>
                        </div>

                        <div className="relative pl-8 border-l-[3px] border-primary/15 space-y-3 ml-3">
                          {(item.destinations || []).map((dest, dIdx) => {
                            const cat = getCategoryStyle(dest.category);
                            return (
                              <motion.div
                                key={dIdx}
                                className="relative"
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: dIdx * 0.03 }}
                              >
                                {/* Timeline dot */}
                                <div className="absolute -left-[27.5px] top-3 w-6 h-6 bg-white border-[3px] border-primary/30 rounded-full flex items-center justify-center z-10 shadow-sm">
                                  <span className="text-[7px] font-black text-primary">
                                    {dIdx + 1}
                                  </span>
                                </div>

                                <div className="bg-white/50 backdrop-blur-sm p-4 md:p-5 rounded-2xl border border-white/60 hover:bg-white/80 transition-all hover:shadow-sm">
                                  {/* Name + badge */}
                                  <div className="flex flex-wrap items-center gap-2 mb-2">
                                    <h5 className="text-[15px] font-black text-slate-800 tracking-tight">
                                      {dest.name}
                                    </h5>
                                    <span
                                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider border ${cat.bg}`}
                                    >
                                      {cat.icon}
                                      {cat.label}
                                    </span>
                                  </div>

                                  {/* Info row */}
                                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
                                    {dest.time && (
                                      <div className="flex items-center gap-1 text-[11px] text-blue-500 font-bold">
                                        <Clock className="w-3 h-3" />
                                        {dest.time}
                                      </div>
                                    )}
                                    {dest.ticket_price && (
                                      <div className="flex items-center gap-1 text-[11px] text-amber-600 font-bold">
                                        <Ticket className="w-3 h-3" />
                                        {dest.ticket_price}
                                      </div>
                                    )}
                                    {dest.address && (
                                      <div className="flex items-center gap-1 text-[11px] text-slate-400 font-medium">
                                        <MapPin className="w-3 h-3 flex-shrink-0" />
                                        <span className="line-clamp-1">
                                          {dest.address}
                                        </span>
                                      </div>
                                    )}
                                    <a
                                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(dest.name + " " + (dest.address || item.location))}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center gap-1 text-[10px] font-black uppercase text-primary/60 hover:text-primary tracking-widest transition-colors ml-auto md:ml-0"
                                    >
                                      <Navigation className="w-2.5 h-2.5" />
                                      Bản đồ
                                    </a>
                                  </div>
                                </div>
                              </motion.div>
                            );
                          })}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default PlanningHistoryPage;
