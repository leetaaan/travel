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
    <div className="min-h-screen bg-[#F4F5F7] dark:bg-dark-900 flex flex-col items-center p-6">
      <div className="w-full max-w-7xl mx-auto bg-white/80 backdrop-blur-md shadow-xl rounded-2xl p-8 mt-10 border border-white/20">
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
            Công cụ lập kế hoạch hành trình
          </h1>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            Tạo lịch trình du lịch hoàn hảo với sự hỗ trợ của AI và tìm kiếm khách sạn phù hợp với ngân sách
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Nhập điểm đến"
            className="p-4 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-white/70 backdrop-blur-sm shadow-sm hover:shadow-md transition-all duration-200"
          />
          <input
            type="text"
            value={budget ? formatNumber(budget) : ''}
            onChange={e => {
              const raw = e.target.value.replace(/[^0-9]/g, '');
              setBudget(raw);
            }}
            placeholder="Tổng ngân sách phòng (ví dụ: 5.000.000 VNĐ)"
            className="p-4 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-white/70 backdrop-blur-sm shadow-sm hover:shadow-md transition-all duration-200"
          />
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="p-4 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-white/70 backdrop-blur-sm shadow-sm hover:shadow-md transition-all duration-200"
            title="Ngày bắt đầu"
          />
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="p-4 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-white/70 backdrop-blur-sm shadow-sm hover:shadow-md transition-all duration-200"
            title="Ngày kết thúc"
          />
          <input
            type="number"
            value={adults}
            onChange={(e) => setAdults(e.target.value)}
            placeholder="Số người lớn"
            min={1}
            className="p-4 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-white/70 backdrop-blur-sm shadow-sm hover:shadow-md transition-all duration-200"
          />
          <input
            type="text"
            value={childrenAge}
            onChange={(e) => setChildrenAge(e.target.value)}
            placeholder="Tuổi trẻ em (vd: 5,10)"
            className="p-4 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-white/70 backdrop-blur-sm shadow-sm hover:shadow-md transition-all duration-200"
          />
          <input
            type="number"
            value={roomQty}
            onChange={(e) => setRoomQty(e.target.value)}
            placeholder="Số phòng"
            min={1}
            className="p-4 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-white/70 backdrop-blur-sm shadow-sm hover:shadow-md transition-all duration-200"
          />
        </div>

        <button
          onClick={handleGenerateItinerary}
          disabled={loading}
          className="w-full bg-primary-600 hover:bg-primary-700 disabled:bg-gray-400 text-white font-bold py-4 px-8 rounded-xl transition-all duration-300 disabled:cursor-not-allowed shadow-lg hover:shadow-xl flex items-center justify-center space-x-3"
        >
          {loading ? (
            <>
              <svg className="animate-spin w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
              </svg>
              <span>Đang tạo lịch trình...</span>
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path>
              </svg>
              <span>✨ Tạo bằng AI</span>
            </>
          )}
        </button>

        {loading && (
          <div className="text-center mt-8 p-6 bg-gray-50 dark:bg-dark-800 rounded-xl border border-gray-200 dark:border-dark-600">
            <div className="flex items-center justify-center space-x-3 mb-3">
              <div className="w-3 h-3 bg-primary-500 rounded-full animate-bounce"></div>
              <div className="w-3 h-3 bg-primary-600 rounded-full animate-bounce delay-100"></div>
              <div className="w-3 h-3 bg-primary-500 rounded-full animate-bounce delay-200"></div>
            </div>
            <p className="text-gray-700 dark:text-gray-200 font-medium">Đang tạo lịch trình cá nhân hóa của bạn...</p>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Vui lòng đợi trong giây lát</p>
          </div>
        )}

        {itinerary && (
          <>
            {console.log('itinerary:', itinerary)}
            <div className="mt-12 border-t border-gray-200 pt-8">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-gray-800 mb-2">
                  Lịch trình đề xuất cho <span className="text-primary-600">{location}</span>
                </h2>
                <p className="text-gray-600">Được tạo bởi AI dựa trên sở thích và ngân sách của bạn</p>
              </div>

              {locationImage && (
                <img src={locationImage} alt={location} className="w-full h-64 object-cover rounded-2xl mb-8 shadow-lg" />
              )}
              
              <div className="mb-12">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-800">Lựa chọn chỗ ở</h3>
                  <span className="bg-green-100 text-green-800 text-sm font-medium px-3 py-1 rounded-full">Trong ngân sách</span>
                </div>
                {itinerary.lodgingOptions.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 bg-gray-50 rounded-2xl">
                    <div className="mb-4" style={{ width: '200px', height: '200px' }}>
                      <DotLottieReact
                        src="https://lottie.host/7d7382e3-5932-404e-8cc2-903fad5cbd69/Y4ymdAvvAy.lottie"
                        loop
                        autoplay
                        style={{ width: '100%', height: '100%' }}
                      />
                    </div>
                    <p className="text-lg text-gray-500 font-medium">Không tìm thấy phòng phù hợp với ngân sách của bạn</p>
                  </div>
                ) : (
                  <div className="relative mt-6 px-8">
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
                          <Link to={"/"} className="block border border-gray-200 rounded-2xl hover:shadow-xl transition-all duration-300 h-full bg-white hover:scale-105 overflow-hidden">
                            <img src={lodge.image} alt={lodge.name} className="w-full h-48 object-cover" />
                            <div className="p-5 h-[300px] flex flex-col overflow-hidden">
                              <h4 className="font-bold text-lg text-gray-800 mb-2 line-clamp-2">{lodge.name}</h4>
                              {lodge.benefit && (
                                <span className="inline-block bg-green-100 text-green-800 text-xs font-medium px-2 py-1 rounded-full mb-2">{lodge.benefit}</span>
                              )}
                              <p className="text-primary-600 font-bold text-lg mb-1">{lodge.price ? formatVND(lodge.price) : 'N/A'}</p>
                              {lodge.originalPrice && (
                                <p className="text-gray-400 line-through text-sm mb-2">{formatVND(lodge.originalPrice)}</p>
                              )}
                              <div className="flex items-center mb-2">
                                <svg className="w-4 h-4 text-yellow-400 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                                </svg>
                                <span className="text-gray-600 text-sm">{lodge.rating}</span>
                              </div>
                              {lodge.reviewWord && (
                                <p className="text-gray-600 text-sm mb-1">Đánh giá: {lodge.reviewWord}</p>
                              )}
                              {lodge.reviewCount && (
                                <p className="text-gray-500 text-xs mb-2">{lodge.reviewCount} đánh giá</p>
                              )}
                              <span className="inline-block bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded-full mb-2">{lodge.type}</span>
                              {lodge.address && (
                                <p className="text-gray-500 text-xs mb-2 line-clamp-2">{lodge.address}</p>
                              )}
                              {lodge.checkin && (
                                <p className="text-gray-500 text-xs">Check-in: {lodge.checkin}</p>
                              )}
                              {lodge.checkout && (
                                <p className="text-gray-500 text-xs">Check-out: {lodge.checkout}</p>
                              )}
                            </div>
                          </Link>
                        </SwiperSlide>
                      ))}
                    </Swiper>
                  </div>
                )}
              </div>

              <div className="bg-gray-50 dark:bg-dark-800 rounded-2xl p-8">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-800">Điểm đến & Lịch trình</h3>
                </div>
                <div className="grid gap-4">
                  {itinerary.destinations.map((dest, index) => (
                    <div key={index} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                      <div className="flex items-start space-x-4">
                        <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-800 text-lg">{dest.name}</h4>
                          <p className="text-gray-600 text-sm mt-1">{dest.time}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default PlanningPage;