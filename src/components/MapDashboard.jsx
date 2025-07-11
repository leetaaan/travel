import React, { useState, useEffect } from 'react';
import VietnamSVGMap from './VietnamSVGMap';

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

  useEffect(() => {
    fetch('/src/assets/map_with_ids.svg')
      .then(res => res.text())
      .then(svgText => {
        const parser = new DOMParser();
        const svgDoc = parser.parseFromString(svgText, 'image/svg+xml');
        const paths = svgDoc.querySelectorAll('path[id]');
        const ids = Array.from(paths).map(path => path.getAttribute('id'));
        setProvinceIds(ids);
      })
      .catch(err => {
        console.error("Lỗi khi tải SVG:", err);
      });
  }, []);

  const handleProvinceClick = (provinceId) => {
    setSelectedProvinces(prev =>
      prev.includes(provinceId)
        ? prev.filter(id => id !== provinceId)
        : [...prev, provinceId]
    );
  };

  const handleSelectChange = (event) => {
    const selected = Array.from(event.target.selectedOptions, option => option.value);
    setSelectedProvinces(selected);
  };

  return (
    <div className="flex flex-col md:flex-row h-screen bg-gray-50">
      {/* Bản đồ SVG */}
      <div className="w-full md:w-2/3 h-1/2 md:h-full p-4">
        <div className="bg-white rounded-lg shadow-lg h-full">
          <div className="p-4 border-b">
            <h2 className="text-xl font-bold text-gray-800">Bản đồ Việt Nam</h2>
            <p className="text-gray-600 text-sm">Click vào tỉnh để highlight</p>
          </div>
          <div className="h-full p-4">
            <VietnamSVGMap 
              selectedProvince={selectedProvinces}
              onProvinceClick={handleProvinceClick}
            />
          </div>
        </div>
      </div>

      <div className="w-full md:w-1/3 h-1/2 md:h-full p-4">
        <div className="bg-white rounded-lg shadow-lg h-full">
          <div className="p-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Chọn tỉnh/thành phố</h3>
            <label htmlFor="province-select" className="block text-sm font-medium text-gray-700 mb-2">
              Chọn để highlight trên bản đồ (có thể chọn nhiều):
            </label>
            {selectedProvinces.length > 0 && (
              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-gray-600">Các tỉnh/thành phố đang được highlight:</p>
                <ul className="text-lg font-semibold text-blue-800 list-disc list-inside">
                  {selectedProvinces.map(id => (
                    <li key={id}>{provinceNameMap[id] || id}</li>
                  ))}
                </ul>
              </div>
            )}

            {provinceIds.length > 0 && (
              <div className="mb-4">
                <span className="text-sm text-gray-700 font-medium">
                  Đã highlight: {selectedProvinces.length} / {provinceIds.length} tỉnh/thành phố (
                  {((selectedProvinces.length / provinceIds.length) * 100).toFixed(1)}%)
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MapDashboard;