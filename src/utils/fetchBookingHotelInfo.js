const RAPIDAPI_KEY = '07224df72emsh556f9d9e2f8c857p19f229jsnc14f9cb58b4c';
const RAPIDAPI_HOST = 'booking-com15.p.rapidapi.com';

export async function fetchBookingHotelInfo(query) {
  // 1. Tìm hotel_id từ auto-complete
  const searchUrl = `https://${RAPIDAPI_HOST}/v1/hotels/auto-complete?text=${encodeURIComponent(query)}&languagecode=en-us`;
  try {
    const searchRes = await fetch(searchUrl, {
      headers: {
        'X-RapidAPI-Key': RAPIDAPI_KEY,
        'X-RapidAPI-Host': RAPIDAPI_HOST,
      }
    });
    const searchData = await searchRes.json();
    if (!searchData || !searchData.length) return null;
    const hotel = searchData.find(item => item.hotel_id);
    if (!hotel) return null;

    // 2. Lấy chi tiết khách sạn
    const detailsUrl = `https://${RAPIDAPI_HOST}/v1/hotels/details?hotel_id=${hotel.hotel_id}&languagecode=en-us`;
    const detailsRes = await fetch(detailsUrl, {
      headers: {
        'X-RapidAPI-Key': RAPIDAPI_KEY,
        'X-RapidAPI-Host': RAPIDAPI_HOST,
      }
    });
    const details = await detailsRes.json();

    return {
      name: details.hotel_name || hotel.label,
      image: details.main_photo_url,
      price: details.price_breakdown?.gross_price || details.min_total_price,
      link: details.url || `https://www.booking.com/hotel/${hotel.hotel_id}.html`,
      rating: details.review_score,
      type: details.accommodation_type_name,
    };
  } catch (e) {
    return null;
  }
} 