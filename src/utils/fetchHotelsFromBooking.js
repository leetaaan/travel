export async function fetchHotelsFromBooking(location, arrivalDate, departureDate, adults, childrenAge, roomQty) {
  // Lấy destination_id
  const destinationRes = await fetch(
    `https://booking-com21.p.rapidapi.com/api/v1/hotels/searchDestination?query=${encodeURIComponent(location)}`,
    {
      headers: {
        'x-rapidapi-host': 'booking-com21.p.rapidapi.com',
        'x-rapidapi-key': '07224df72emsh556f9d9e2f8c857p19f229jsnc14f9cb58b4c',
      },
    }
  );
  const destData = await destinationRes.json();
  if (!destData.data || !destData.data[0]) return [];

  const destinationId = destData.data[0].dest_id;
  const params = [
    `dest_id=${destinationId}`,
    `search_type=CITY`,
    `arrival_date=${arrivalDate}`,
    `departure_date=${departureDate}`,
    `adults=${adults}`,
    childrenAge ? `children_age=${childrenAge}` : '',
    `room_qty=${roomQty}`,
    `currency_code=VND`,
    `languagecode=vi`,
    `units=metric`,
    `temperature_unit=c`
  ].filter(Boolean).join('&');

  const hotelRes = await fetch(
    `https://booking-com21.p.rapidapi.com/api/v1/hotels/searchHotels?${params}`,
    {
      headers: {
        'x-rapidapi-host': 'booking-com21.p.rapidapi.com',
        'x-rapidapi-key': '07224df72emsh556f9d9e2f8c857p19f229jsnc14f9cb58b4c',
      },
    }
  );
  const hotelData = await hotelRes.json();
  if (!hotelData.data || !hotelData.data.hotels) return [];

  // Log raw data để kiểm tra tên trường thực tế
  console.log('RAW HOTELS:', hotelData.data.hotels);

  // Sắp xếp theo reviewScore giảm dần
  const sortedHotels = hotelData.data.hotels.slice().sort((a, b) => {
    const scoreA = a.property?.reviewScore || 0;
    const scoreB = b.property?.reviewScore || 0;
    return scoreB - scoreA;
  });

  // Trả về toàn bộ danh sách khách sạn, map đúng trường dữ liệu từ API Booking
  return sortedHotels.map(hotel => ({
    name: hotel.property?.name || hotel.accessibilityLabel || 'Không rõ tên',
    price: hotel.property?.priceBreakdown?.grossPrice?.value
      ?? hotel.property?.priceBreakdown?.strikeThroughPrice?.value
      ?? hotel.property?.minTotalPrice
      ?? hotel.property?.price
      ?? null,
    originalPrice: hotel.property?.priceBreakdown?.strikeThroughPrice?.value || null,
    rating: hotel.property?.reviewScore || hotel.property?.reviewScoreWord || 'N/A',
    reviewWord: hotel.property?.reviewScoreWord || '',
    reviewCount: hotel.property?.reviewCount || '',
    type: hotel.property?.propertyClass ? `Hạng ${hotel.property.propertyClass}` : 'hotel',
    link: hotel.hotel_id ? `https://www.booking.com/hotel/vn/${hotel.hotel_id}.vi.html` : `https://www.google.com/search?q=${encodeURIComponent(hotel.property?.name || '')}`,
    image: hotel.property?.photoUrls?.[0] || hotel.property?.mainPhotoUrl || `https://source.unsplash.com/400x300/?${encodeURIComponent(hotel.property?.name || 'hotel')}`,
    checkin: hotel.property?.checkin?.fromTime ? `${hotel.property.checkin.fromTime} - ${hotel.property.checkin.untilTime}` : '',
    checkout: hotel.property?.checkout?.fromTime ? `${hotel.property.checkout.fromTime} - ${hotel.property.checkout.untilTime}` : '',
    address: hotel.property?.wishListName || '',
    benefit: hotel.property?.priceBreakdown?.benefitBadges?.[0]?.text || '',
  }));
} 