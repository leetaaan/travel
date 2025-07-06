import React, { useState } from 'react';
import VietnamSVGMap from './VietnamSVGMap';

const MapDashboard = () => {
  const [selectedProvince, setSelectedProvince] = useState(null);

  // Dữ liệu thông tin các tỉnh
  const provinceData = {
    hanoi: {
      name: 'Hà Nội',
      region: 'Miền Bắc',
      population: '8.4 triệu',
      area: '3,359 km²',
      attractions: ['Văn Miếu - Quốc Tử Giám', 'Hồ Hoàn Kiếm', 'Phố cổ Hà Nội', 'Lăng Chủ tịch Hồ Chí Minh'],
      cuisine: ['Phở', 'Bún chả', 'Chả cá Lã Vọng', 'Bánh cuốn'],
      bestTime: 'Tháng 10-12, 3-4',
      transport: ['Máy bay', 'Tàu hỏa', 'Xe khách', 'Xe máy']
    },
    haiphong: {
      name: 'Hải Phòng',
      region: 'Miền Bắc',
      population: '2.1 triệu',
      area: '1,527 km²',
      attractions: ['Đảo Cát Bà', 'Bãi biển Đồ Sơn', 'Chùa Dư Hàng', 'Nhà hát lớn Hải Phòng'],
      cuisine: ['Bánh đa cua', 'Bánh mì cay', 'Bún cá', 'Chả mực'],
      bestTime: 'Tháng 4-10',
      transport: ['Máy bay', 'Tàu hỏa', 'Xe khách', 'Phà']
    },
    danang: {
      name: 'Đà Nẵng',
      region: 'Miền Trung',
      population: '1.2 triệu',
      area: '1,285 km²',
      attractions: ['Bãi biển Mỹ Khê', 'Bán đảo Sơn Trà', 'Bảo tàng Chăm', 'Ngũ Hành Sơn'],
      cuisine: ['Mì Quảng', 'Bánh tráng cuốn thịt heo', 'Bún mắm', 'Cao lầu'],
      bestTime: 'Tháng 2-5',
      transport: ['Máy bay', 'Tàu hỏa', 'Xe khách', 'Xe máy']
    },
    hcm: {
      name: 'TP. Hồ Chí Minh',
      region: 'Miền Nam',
      population: '9.3 triệu',
      area: '2,095 km²',
      attractions: ['Bitexco Financial Tower', 'Bảo tàng Chứng tích Chiến tranh', 'Địa đạo Củ Chi', 'Chợ Bến Thành'],
      cuisine: ['Cơm tấm', 'Bánh mì', 'Phở', 'Bún bò Huế'],
      bestTime: 'Tháng 12-4',
      transport: ['Máy bay', 'Xe khách', 'Xe buýt', 'Grab']
    },
    cantho: {
      name: 'Cần Thơ',
      region: 'Miền Nam',
      population: '1.2 triệu',
      area: '1,409 km²',
      attractions: ['Chợ nổi Cái Răng', 'Chợ nổi Phong Điền', 'Nhà cổ Bình Thủy', 'Vườn cò Bằng Lăng'],
      cuisine: ['Bún nước lèo', 'Bánh tét', 'Cá lóc nướng trui', 'Bánh xèo'],
      bestTime: 'Tháng 8-11',
      transport: ['Máy bay', 'Xe khách', 'Tàu thủy', 'Xe máy']
    }
  };

  // Hàm xử lý click vào tỉnh
  const handleProvinceClick = (provinceId) => {
    setSelectedProvince(provinceId);
  };

  // Hàm xử lý thay đổi select
  const handleSelectChange = (event) => {
    const value = event.target.value;
    setSelectedProvince(value === '' ? null : value);
  };

  return (
    <div className="flex flex-col md:flex-row h-screen bg-gray-50">
      {/* Bản đồ */}
      <div className="w-full md:w-2/3 h-1/2 md:h-full p-4">
        <div className="bg-white rounded-lg shadow-lg h-full">
          <div className="p-4 border-b">
            <h2 className="text-xl font-bold text-gray-800">Bản đồ Việt Nam</h2>
            <p className="text-gray-600 text-sm">Click vào tỉnh để highlight hoặc chọn từ dropdown</p>
          </div>
          <div className="h-full p-4">
            <VietnamSVGMap 
              selectedProvince={selectedProvince}
              onProvinceClick={handleProvinceClick}
            />
          </div>
        </div>
      </div>

      {/* Panel chọn tỉnh */}
      <div className="w-full md:w-1/3 h-1/2 md:h-full p-4">
        <div className="bg-white rounded-lg shadow-lg h-full">
          <div className="p-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Chọn tỉnh/thành phố</h3>
            
            {/* Select dropdown */}
            <div>
              <label htmlFor="province-select" className="block text-sm font-medium text-gray-700 mb-2">
                Chọn tỉnh/thành phố để highlight trên bản đồ:
              </label>
              <select
                id="province-select"
                value={selectedProvince || ''}
                onChange={handleSelectChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">-- Chọn tỉnh/thành phố --</option>
                {Object.entries(provinceData).map(([key, province]) => (
                  <option key={key} value={key}>
                    {province.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Hiển thị tên tỉnh được chọn */}
            {selectedProvince && (
              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-gray-600">Tỉnh/thành phố đang được highlight:</p>
                <p className="text-lg font-semibold text-blue-800">
                  {provinceData[selectedProvince].name}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MapDashboard;
