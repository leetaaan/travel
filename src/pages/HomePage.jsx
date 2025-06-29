import React, { useState } from 'react';
import genAI from '../gemini.js';
import { fetchWikipediaImage } from '../utils/fetchWikipediaImage';
import { fetchDuckDuckGoImage } from '../utils/fetchDuckDuckGoImage';
import { fetchBookingHotelInfo } from '../utils/fetchBookingHotelInfo';

// Thêm hàm sleep
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

const HomePage = () => {
  const [location, setLocation] = useState('');
  const [budget, setBudget] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [itinerary, setItinerary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [locationImage, setLocationImage] = useState('');

  const handleGenerateItinerary = async () => {
    if (!location || !budget || !startDate || !endDate) {
      alert('Vui lòng điền đầy đủ tất cả các trường.');
      return;
    }
    setLoading(true);
    setItinerary(null);
    setLocationImage('');

    try {
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash"});

      const prompt = `
        Create a travel itinerary for a trip to ${location} from ${startDate} to ${endDate} with a total budget of ${budget} VND.

        Please provide the response in a valid JSON format. The JSON object should have two keys: "lodgingOptions" and "destinations".

        1.  "lodgingOptions": An array of 3 accommodation suggestions (hotels, homestays, or hostels) that fit within the budget. Each object in the array should have the following properties:
            *   "name": The name of the accommodation.
            *   "price": The estimated price per night in VND.
            *   "rating": The rating of the accommodation.
            *   "type": A single, URL-friendly word describing the accommodation type (e.g., "hotel", "homestay", "hostel").
            *   "link": A booking link. Use a placeholder like "https://www.traveloka.com" or "https://www.agoda.com".
            *   "image": A URL of the accommodation image.

        2.  "destinations": An array of suggested places to visit. Each object in the array should have:
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

      // Lấy ảnh Wikipedia cho từng lodging option, nếu không có thì lấy DuckDuckGo, cuối cùng mới Unsplash
      const lodgingOptionsWithImages = await Promise.all(
        parsedItinerary.lodgingOptions.map(async (lodge) => {
          let img = await fetchWikipediaImage(lodge.name);
          if (!img) {
            img = await fetchDuckDuckGoImage(lodge.name);
          }
          return {
            ...lodge,
            image: img || `https://source.unsplash.com/400x300/?${lodge.name}`,
          };
        })
      );
      setItinerary({
        ...parsedItinerary,
        lodgingOptions: lodgingOptionsWithImages,
      });
      setLocationImage(`https://source.unsplash.com/800x600/?${location}`);

    } catch (error) {
      console.error("Lỗi khi tạo lịch trình:", error);
      alert(`Không thể tạo lịch trình. Vui lòng kiểm tra console để biết thêm chi tiết. Lỗi: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center p-4">
      <div className="w-full max-w-2xl mx-auto bg-white shadow-md rounded-lg p-8 mt-10">
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
            type="number"
            value={budget}
            onChange={(e) => setBudget(e.target.value)}
            placeholder="Tổng ngân sách (ví dụ: 5,000,000 VNĐ)"
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
          <div className="mt-8 border-t pt-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Lịch trình đề xuất của bạn cho {location}</h2>

            {locationImage && (
              <img src={locationImage} alt={location} className="w-full h-64 object-cover rounded-lg mb-6" />
            )}
            
            <div className="mb-4">
              <h3 className="text-xl font-semibold text-gray-700">Lựa chọn chỗ ở (trong ngân sách)</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                {itinerary.lodgingOptions.map((lodge, index) => (
                  <a href={lodge.link} key={index} target="_blank" rel="noopener noreferrer" className="block border rounded-lg hover:shadow-lg transition-shadow duration-300">
                    <img src={lodge.image} alt={lodge.name} className="w-full h-40 object-cover rounded-t-lg" />
                    <div className="p-4">
                      <h4 className="font-bold text-lg">{lodge.name}</h4>
                      <p className="text-gray-600">{lodge.price}</p>
                      <p className="text-gray-600">Xếp hạng: {lodge.rating}</p>
                      <p className="text-gray-600">Loại: {lodge.type}</p>
                      <a href={`https://www.google.com/search?tbm=isch&q=${encodeURIComponent(lodge.name)}`} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline mt-2 inline-block">
                        Xem trên Google Hình ảnh
                      </a>
                    </div>
                  </a>
                ))}
              </div>
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
        )}
      </div>
    </div>
  );
};

export default HomePage;
