import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Code2,
  ChevronLeft,
  Database,
  Sparkles,
  Copy,
  Check,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import TopMenu from "../components/TopMenu";

const AIDebugPage = () => {
  const navigate = useNavigate();
  const [lastItinerary, setLastItinerary] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // Try to get from localStorage if we saved it in PlanningPage
    const saved = localStorage.getItem("last_ai_itinerary");
    if (saved) {
      try {
        setLastItinerary(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse itinerary", e);
      }
    }
  }, []);

  const handleCopy = () => {
    if (lastItinerary) {
      navigator.clipboard.writeText(JSON.stringify(lastItinerary, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex flex-col font-sans">
      <TopMenu />

      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-12 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <button
              onClick={() => navigate(-1)}
              className="group flex items-center gap-2 text-slate-400 hover:text-emerald-600 transition-colors text-xs font-black uppercase tracking-widest mb-4"
            >
              <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              Quay lại
            </button>
            <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase italic flex items-center gap-4">
              <Database className="w-10 h-10 text-emerald-600" />
              AI Data Intelligence
            </h1>
            <p className="text-slate-500 font-medium">
              Xem và phân tích dữ liệu thô được trả về từ AI Engine.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleCopy}
              className="h-12 border-2 border-slate-200 text-slate-600 rounded-full px-6 font-black uppercase tracking-widest flex items-center gap-2 hover:border-emerald-500 hover:text-emerald-600 transition-all active:scale-95 bg-white"
            >
              {copied ? (
                <Check className="w-4 h-4" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
              {copied ? "Đã sao chép" : "Sao chép JSON"}
            </button>
          </div>
        </div>

        {/* Content Area */}
        {lastItinerary ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-8"
          >
            {/* Left: Summary Chips */}
            <div className="lg:col-span-1 space-y-6">
              <div className="bg-white rounded-[32px] p-8 shadow-xl shadow-emerald-900/5 border border-slate-100 space-y-6">
                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">
                  Metadata Tổng quan
                </h3>

                <div className="space-y-4">
                  <div className="flex items-center justify-between py-3 border-b border-slate-50">
                    <span className="text-sm font-bold text-slate-500">
                      Địa điểm:
                    </span>
                    <span className="text-sm font-black text-emerald-600 uppercase italic bg-emerald-50 px-3 py-1 rounded-lg">
                      {lastItinerary.location || "N/A"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-3 border-b border-slate-50">
                    <span className="text-sm font-bold text-slate-500">
                      Số ngày:
                    </span>
                    <span className="text-sm font-black text-slate-800">
                      {lastItinerary.days?.length || 0} Ngày
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-3 border-b border-slate-50">
                    <span className="text-sm font-bold text-slate-500">
                      Số điểm đến:
                    </span>
                    <span className="text-sm font-black text-slate-800">
                      {lastItinerary.destinations?.length || 0} Điểm
                    </span>
                  </div>
                </div>

                <div className="pt-4">
                  <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 p-4 rounded-2xl border border-emerald-100">
                    <Sparkles className="w-5 h-5 shrink-0" />
                    <span className="text-[10px] font-black uppercase tracking-widest leading-normal">
                      Dữ liệu này được tối ưu hóa bởi Gemini Engine để đảm bảo
                      tính logic cao nhất.
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-slate-900 rounded-[32px] p-8 text-white space-y-4">
                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">
                  Cấu trúc Schema
                </h3>
                <p className="text-[11px] text-slate-400 font-medium leading-relaxed italic">
                  Dữ liệu được trả về dưới định dạng JSON có cấu trúc phân cấp,
                  bao gồm mảng 'days' và mảng 'destinations' để đồng bộ hóa tọa
                  độ trên bản đồ.
                </p>
              </div>
            </div>

            {/* Right: Syntax Highlighter-like View */}
            <div className="lg:col-span-2">
              <div className="bg-[#0d1117] rounded-[32px] overflow-hidden border border-white/10 shadow-2xl flex flex-col h-[700px]">
                <div className="h-14 bg-white/5 border-b border-white/5 flex items-center px-8 shrink-0">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-400" />
                    <div className="w-3 h-3 rounded-full bg-amber-400" />
                    <div className="w-3 h-3 rounded-full bg-emerald-400" />
                  </div>
                  <span className="ml-6 text-[10px] font-black uppercase tracking-[0.2em] text-white/30">
                    itinerary_data.json
                  </span>
                </div>
                <div className="flex-1 overflow-auto p-8 custom-scrollbar">
                  <pre className="text-emerald-400 font-mono text-sm leading-relaxed">
                    {JSON.stringify(lastItinerary, null, 2)}
                  </pre>
                </div>
              </div>
            </div>
          </motion.div>
        ) : (
          <div className="h-[500px] flex flex-col items-center justify-center space-y-6 bg-white rounded-[40px] border-2 border-dashed border-slate-200">
            <div className="w-20 h-20 rounded-full bg-slate-50 flex items-center justify-center">
              <Code2 className="w-10 h-10 text-slate-300" />
            </div>
            <div className="text-center">
              <h3 className="text-xl font-black text-slate-800 uppercase italic tracking-tighter">
                Chưa có dữ liệu nào
              </h3>
              <p className="text-slate-400 text-sm font-medium">
                Hãy thử tạo một lịch trình mới để xem dữ liệu ở đây.
              </p>
            </div>
            <button
              onClick={() => navigate("/planning")}
              className="h-12 bg-emerald-600 text-white rounded-full px-8 font-black uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-500/30"
            >
              Quay lại lập kế hoạch
            </button>
          </div>
        )}
      </main>
    </div>
  );
};

export default AIDebugPage;
