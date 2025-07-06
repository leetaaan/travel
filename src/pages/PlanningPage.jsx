import React, { useState } from 'react';
import genAI from '../gemini.js';
import { fetchHotelsFromBooking } from '../utils/fetchHotelsFromBooking';
import { formatVND, formatNumber } from '../utils/formatVND';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/pagination';
import { Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';

const PlanningPage = () => {
  const [location, setLocation] = useState('');
  const [budget, setBudget] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [itinerary, setItinerary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [locationImage, setLocationImage] = useState('');
  const [adults, setAdults] = useState(2);
  const [childrenAge, setChildrenAge] = useState('');
  const [roomQty, setRoomQty] = useState(1);

  const handleGenerateItinerary = async () => {
    if (!location || !budget || !startDate || !endDate) {
      toast.error('Vui lòng điền đầy đủ tất cả các trường.');
      return;
    }
    setLoading(true);
    setItinerary(null);
    setLocationImage('');

    // Làm sạch location query
    const cleanedLocation = location.trim();
    if (cleanedLocation.length < 3) {
      toast.error('Vui lòng nhập tên địa điểm rõ ràng (tối thiểu 3 ký tự).');
      setLoading(false);
      return;
    }

    try {
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash"});

      const prompt = `
        Create a travel itinerary for a trip to ${location} from ${startDate} to ${endDate} with a total budget of ${budget} VND.

        Please provide the response in a valid JSON format. The JSON object should have one key: "destinations".

        1.  "destinations": An array of suggested places to visit. Each object in the array should have:
            *   "name": The name of the destination.
            *   "time": A suggested day and time to visit (e.g., "Day 1, 9:00 AM").
      `;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      // Chỉ lấy phần JSON đầu tiên, tránh lỗi khi có ký tự thừa
      let jsonString = text.replace(/```json/g, '').replace(/```/g, '').trim();
      const lastBrace = jsonString.lastIndexOf('}');
      if (lastBrace !== -1) {
        jsonString = jsonString.substring(0, lastBrace + 1);
      }
      const parsedItinerary = JSON.parse(jsonString);

      // Lấy danh sách khách sạn từ Booking API
      const hotels = await fetchHotelsFromBooking(cleanedLocation, startDate, endDate, adults, childrenAge, roomQty);
      const budgetNumber = Number(budget);
      const filteredHotels = hotels.filter(hotel =>
        hotel.price !== null && !isNaN(hotel.price) && Number(hotel.price) <= budgetNumber
      );
      console.log('lodgingOptions:', filteredHotels);
      setItinerary({
        lodgingOptions: filteredHotels,
        destinations: parsedItinerary.destinations || [],
      });

    } catch (error) {
      console.error("Lỗi khi tạo lịch trình:", error);
      toast.error(`Không thể tạo lịch trình. Vui lòng kiểm tra console để biết thêm chi tiết. Lỗi: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center p-4">
      <div className="w-full max-w-7xl mx-auto bg-white shadow-md rounded-lg p-8 mt-10">
        <h1 className="text-3xl font-bold text-center text-gray-800 mb-6">Công cụ lập kế hoạch hành trình</h1> 
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Nhập điểm đến"
            className="p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="text"
            value={budget ? formatNumber(budget) : ''}
            onChange={e => {
              const raw = e.target.value.replace(/[^0-9]/g, '');
              setBudget(raw);
            }}
            placeholder="Tổng ngân sách phòng (ví dụ: 5.000.000 VNĐ)"
            className="p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            title="Ngày bắt đầu"
          />
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            title="Ngày kết thúc"
          />
          <input
            type="number"
            value={adults}
            onChange={(e) => setAdults(e.target.value)}
            placeholder="Số người lớn"
            min={1}
            className="p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="text"
            value={childrenAge}
            onChange={(e) => setChildrenAge(e.target.value)}
            placeholder="Tuổi trẻ em (vd: 5,10)"
            className="p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="number"
            value={roomQty}
            onChange={(e) => setRoomQty(e.target.value)}
            placeholder="Số phòng"
            min={1}
            className="p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <button
          onClick={handleGenerateItinerary}
          disabled={loading}
          className="w-full bg-blue-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-blue-700 transition duration-300 disabled:bg-blue-300"
        >
          {loading ? 'Đang tạo...' : '✨ Tạo bằng AI'}
        </button>

        {loading && (
          <div className="text-center mt-6">
            <p>Đang tạo lịch trình cá nhân hóa của bạn...</p>
          </div>
        )}

        {itinerary && (
          <>
            {console.log('itinerary:', itinerary)}
            <div className="mt-8 border-t pt-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Lịch trình đề xuất của bạn cho {location}</h2>

              {locationImage && (
                <img src={locationImage} alt={location} className="w-full h-64 object-cover rounded-lg mb-6" />
              )}
              
              <div className="mb-4">
                <h3 className="text-xl font-semibold text-gray-700">Lựa chọn chỗ ở (trong ngân sách)</h3>
                {itinerary.lodgingOptions.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8">
                    <div className="mb-4" style={{ width: '200px', height: '200px' }}>
                      <DotLottieReact
                        src="https://lottie.host/7d7382e3-5932-404e-8cc2-903fad5cbd69/Y4ymdAvvAy.lottie"
                        loop
                        autoplay
                        style={{ width: '100%', height: '100%' }}
                      />
                    </div>
                    <p className="text-lg text-gray-500">Không tìm thấy phòng phù hợp với ngân sách của bạn.</p>
                  </div>
                ) : (
                  <div className="relative mt-4 px-8">
                    <Swiper
                      spaceBetween={20}
                      slidesPerView={4}
                      loop={true}
                      pagination={{ clickable: true }}
                      style={{ padding: '0 10px' }}
                      breakpoints={{
                        320: { slidesPerView: 1 },
                        640: { slidesPerView: 2 },
                        1024: { slidesPerView: 4 },
                      }}
                      modules={[Pagination]}
                    >
                      {itinerary.lodgingOptions.map((lodge, index) => (
                        <SwiperSlide key={index}>
                          <Link to={"/"} className="block border rounded-lg hover:shadow-lg transition-shadow duration-300 h-full">
                            <img src={lodge.image} alt={lodge.name} className="w-full h-40 object-cover rounded-t-lg" />
                            <div className="p-4 h-[280px] flex flex-col overflow-hidden">
                              <h4 className="font-bold text-lg">{lodge.name}</h4>
                              {lodge.benefit && (
                                <p className="text-green-600 font-semibold">{lodge.benefit}</p>
                              )}
                              <p className="text-gray-600">{lodge.price ? formatVND(lodge.price) : 'N/A'}</p>
                              {lodge.originalPrice && (
                                <p className="text-gray-400 line-through">{formatVND(lodge.originalPrice)}</p>
                              )}
                              <p className="text-gray-600">Xếp hạng: {lodge.rating}</p>
                              {lodge.reviewWord && (
                                <p className="text-gray-600">Đánh giá: {lodge.reviewWord}</p>
                              )}
                              {lodge.reviewCount && (
                                <p className="text-gray-600">Số lượng đánh giá: {lodge.reviewCount}</p>
                              )}
                              <p className="text-gray-600">Loại: {lodge.type}</p>
                              {lodge.address && (
                                <p className="text-gray-600">Địa chỉ: {lodge.address}</p>
                              )}
                              {lodge.checkin && (
                                <p className="text-gray-600">Check-in: {lodge.checkin}</p>
                              )}
                              {lodge.checkout && (
                                <p className="text-gray-600">Check-out: {lodge.checkout}</p>
                              )}
                            </div>
                          </Link>
                        </SwiperSlide>
                      ))}
                    </Swiper>
                  </div>
                )}
              </div>

              <div>
                <h3 className="text-xl font-semibold text-gray-700">Điểm đến & Lịch trình</h3>
                <ul className="list-disc list-inside mt-2 space-y-2">
                  {itinerary.destinations.map((dest, index) => (
                    <li key={index} className="text-gray-600">
                      <span className="font-semibold">{dest.name}</span> - {dest.time}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default PlanningPage;
