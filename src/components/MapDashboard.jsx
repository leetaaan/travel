import React, { useState, useEffect } from "react";
import VietnamSVGMap from "./VietnamSVGMap";
import { db, auth } from "../firebase";
import { doc, getDoc, updateDoc, onSnapshot } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { toast } from "react-hot-toast";

const provinceNameMap = {
  "province-1": "Hà Nội",
  "province-2": "Hải Phòng",
  "province-3": "Đà Nẵng",
  "province-4": "TP. Hồ Chí Minh",
  "province-5": "Cần Thơ",
};

const MapDashboard = () => {
  const [selectedProvinces, setSelectedProvinces] = useState([]);
  const [provinceIds, setProvinceIds] = useState([]);
  const [user, setUser] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [initialLoaded, setInitialLoaded] = useState(false);

  useEffect(() => {
    // 1. Listen for Auth State
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });

    // 2. Fetch Province IDs from SVG
    fetch("/src/assets/map_with_ids.svg")
      .then((res) => res.text())
      .then((svgText) => {
        const parser = new DOMParser();
        const svgDoc = parser.parseFromString(svgText, "image/svg+xml");
        const paths = svgDoc.querySelectorAll("path[id]");
        const ids = Array.from(paths).map((path) => path.getAttribute("id"));
        setProvinceIds(ids);
      })
      .catch((err) => {
        console.error("Lỗi khi tải SVG:", err);
      });

    return () => unsubscribeAuth();
  }, []);

  // 3. Fetch user's visited provinces from Firebase
  useEffect(() => {
    if (!user) {
      setSelectedProvinces([]);
      setInitialLoaded(false);
      return;
    }

    const userRef = doc(db, "users", user.uid);
    const unsubscribe = onSnapshot(userRef, (docSnap) => {
      if (docSnap.exists() && !initialLoaded) {
        const data = docSnap.data();
        if (data.visitedProvinces) {
          setSelectedProvinces(data.visitedProvinces);
        }
        setInitialLoaded(true);
      }
    });

    return () => unsubscribe();
  }, [user, initialLoaded]);

  const saveToFirebase = async (provinces) => {
    if (!user) {
      toast.error("Bạn cần đăng nhập để lưu.");
      return;
    }

    setIsSaving(true);
    try {
      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, {
        visitedProvinces: provinces,
      });
      toast.success("Đã cập nhật bản đồ!");
    } catch (error) {
      console.error("Error updating provinces:", error);
      toast.error("Lỗi khi lưu dữ liệu.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleProvinceClick = (provinceId) => {
    const newSelection = selectedProvinces.includes(provinceId)
      ? selectedProvinces.filter((id) => id !== provinceId)
      : [...selectedProvinces, provinceId];

    setSelectedProvinces(newSelection);
    // Auto save
    saveToFirebase(newSelection);
  };

  const handleSelectChange = (event) => {
    const selected = Array.from(
      event.target.selectedOptions,
      (option) => option.value,
    );
    setSelectedProvinces(selected);
  };

  return (
    <div className="flex flex-col md:flex-row h-full bg-transparent overflow-hidden">
      {/* Bản đồ SVG */}
      <div className="w-full md:w-[70%] h-full flex flex-col p-2 min-h-0">
        <div className="bg-transparent flex-1 flex flex-col min-h-0">
          <div className="p-3 border-b border-border/20 flex-shrink-0">
            <h2 className="text-xl font-black text-slate-800 leading-none">
              Bản đồ Việt Nam
            </h2>
            <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mt-1.5">
              Click vào tỉnh để highlight
            </p>
          </div>
          <div className="flex-1 min-h-0 p-2 overflow-hidden flex items-center justify-center">
            <div className="w-full h-full max-h-full">
              <VietnamSVGMap
                selectedProvince={selectedProvinces}
                onProvinceClick={handleProvinceClick}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="w-full md:w-[30%] h-full p-2 flex flex-col min-h-0 border-l border-white/20">
        <div className="bg-transparent flex-1 flex flex-col min-h-0 overflow-hidden">
          <div className="p-3 flex-shrink-0">
            <h3 className="text-lg font-black text-slate-800 mb-4 drop-shadow-sm">
              Chọn tỉnh/thành phố
            </h3>

            <div className="space-y-4 overflow-y-auto no-scrollbar max-h-full">
              <div className="p-5 bg-white/40 backdrop-blur-md rounded-[24px] border border-white/60 shadow-xl shadow-black/5 flex-shrink-0">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">
                  Trạng thái highlight
                </label>

                {provinceIds.length > 0 && (
                  <div className="flex items-end space-x-2">
                    <span className="text-3xl font-black text-primary leading-none">
                      {selectedProvinces.length}
                    </span>
                    <span className="text-slate-400 font-bold mb-0.5 text-xs">
                      / {provinceIds.length} tỉnh thành
                    </span>
                  </div>
                )}

                <div className="mt-3 w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all duration-500 ease-out"
                    style={{
                      width: `${(selectedProvinces.length / (provinceIds.length || 1)) * 100}%`,
                    }}
                  />
                </div>
                <p className="text-[9px] text-slate-400 font-bold mt-2 uppercase tracking-widest">
                  {(
                    (selectedProvinces.length / (provinceIds.length || 1)) *
                    100
                  ).toFixed(1)}
                  % Hoàn thành
                </p>
              </div>

              {selectedProvinces.length > 0 && (
                <div className="p-5 bg-emerald-500/10 backdrop-blur-md rounded-[24px] border border-emerald-500/20 shadow-xl shadow-emerald-500/5 min-h-0 flex flex-col">
                  <p className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.2em] mb-3 flex-shrink-0">
                    Danh sách đang chọn
                  </p>
                  <div className="flex flex-wrap gap-1.5 overflow-y-auto no-scrollbar max-h-[30vh]">
                    {selectedProvinces.map((id) => (
                      <span
                        key={id}
                        className="bg-white px-2.5 py-1 rounded-full text-[10px] font-bold text-emerald-700 shadow-sm border border-emerald-100 animate-in fade-in zoom-in duration-300"
                      >
                        {provinceNameMap[id] || id}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MapDashboard;
