import groqChat from "./groqService";

export async function fetchHotelsFromBooking(
  location,
  arrivalDate,
  departureDate,
  adults,
  childrenAge,
  roomQty,
) {
  // Dùng Groq để làm sạch tên địa điểm (chỉ lấy tên thành phố/tỉnh)
  let searchLocation = location;
  try {
    const messages = [
      {
        role: "system",
        content:
          "You are a helpful assistant. Extract ONLY the specific city or province name from the text. Return JSON with key 'location'.",
      },
      {
        role: "user",
        content: `Trích xuất tên địa danh du lịch từ chuỗi sau: "${location}"`,
      },
    ];
    const groqResponse = await groqChat(messages);
    if (groqResponse) {
      const parsed = JSON.parse(groqResponse);
      if (parsed.location) searchLocation = parsed.location;
    }
  } catch (e) {
    console.warn("Groq failed to clean location, using original:", location);
  }

  // Lấy destination_id
  const destinationRes = await fetch(
    `https://booking-com15.p.rapidapi.com/api/v1/hotels/searchDestination?query=${encodeURIComponent(searchLocation)}`,
    {
      headers: {
        "x-rapidapi-host": "booking-com15.p.rapidapi.com",
        "x-rapidapi-key": "07224df72emsh556f9d9e2f8c857p19f229jsnc14f9cb58b4c",
      },
    },
  );
  if (!destinationRes.ok) {
    throw new Error(
      `Booking API lỗi: ${destinationRes.status} ${destinationRes.statusText}`,
    );
  }
  const destData = await destinationRes.json();
  if (!destData.data || !destData.data[0]) return [];

  const destinationId = destData.data[0].dest_id;
  const params = [
    `dest_id=${destinationId}`,
    `search_type=CITY`,
    `arrival_date=${arrivalDate}`,
    `departure_date=${departureDate}`,
    `adults=${adults}`,
    childrenAge ? `children_age=${childrenAge}` : "",
    `room_qty=${roomQty}`,
    `currency_code=VND`,
    `units=metric`,
  ]
    .filter(Boolean)
    .join("&");

  const hotelRes = await fetch(
    `https://booking-com15.p.rapidapi.com/api/v1/hotels/searchHotels?${params}`,
    {
      headers: {
        "x-rapidapi-host": "booking-com15.p.rapidapi.com",
        "x-rapidapi-key": "07224df72emsh556f9d9e2f8c857p19f229jsnc14f9cb58b4c",
      },
    },
  );
  if (!hotelRes.ok) {
    throw new Error(
      `Booking Hotels API lỗi: ${hotelRes.status} ${hotelRes.statusText}`,
    );
  }
  const hotelData = await hotelRes.json();
  
  // Robust check for hotel list in different possible paths (booking-com15 vs others)
  const hotelList = hotelData?.data?.hotels || hotelData?.data?.result || hotelData?.data || [];
  if (!Array.isArray(hotelList) || hotelList.length === 0) {
    console.warn("No hotels found in API response path:", hotelData);
    return [];
  }

  // Sắp xếp theo reviewScore giảm dần
  const sortedHotels = hotelList.slice().sort((a, b) => {
    const scoreA = (a.property?.reviewScore || a.review_score || 0);
    const scoreB = (b.property?.reviewScore || b.review_score || 0);
    return scoreB - scoreA;
  });

  // Trả về toàn bộ danh sách khách sạn, map đúng trường dữ liệu từ API Booking
  return sortedHotels.map((hotel) => {
    const p = hotel.property || hotel; // Handle cases where data is nested in 'property' or flat
    
    return {
      name: p.name || hotel.hotel_name || hotel.accessibilityLabel || "Không rõ tên",
      price:
        p.priceBreakdown?.grossPrice?.value ??
        p.priceBreakdown?.strikeThroughPrice?.value ??
        p.minTotalPrice ??
        p.price ??
        hotel.min_total_price ??
        null,
      originalPrice:
        p.priceBreakdown?.strikeThroughPrice?.value || hotel.strike_through_price || null,
      rating:
        p.reviewScore || p.reviewScoreWord || hotel.review_score || "N/A",
      reviewWord: p.reviewScoreWord || hotel.review_score_word || "",
      reviewCount: p.reviewCount || hotel.review_nr || "",
      type: p.propertyClass
        ? `Hạng ${p.propertyClass}`
        : "hotel",
      link: hotel.hotel_id
        ? `https://www.booking.com/hotel/vn/${hotel.hotel_id}.vi.html`
        : `https://www.google.com/search?q=${encodeURIComponent(p.name || hotel.hotel_name || "")}`,
      image:
        p.photoUrls?.[0] ||
        p.mainPhotoUrl ||
        hotel.max_photo_url ||
        `https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?q=80&w=400&auto=format&fit=crop`,
      checkin: p.checkin?.fromTime
        ? `${p.checkin.fromTime} - ${p.checkin.untilTime}`
        : "",
      checkout: p.checkout?.fromTime
        ? `${p.checkout.fromTime} - ${p.checkout.untilTime}`
        : "",
      address: p.wishListName || hotel.address || hotel.address_trans || "",
      benefit: p.priceBreakdown?.benefitBadges?.[0]?.text || "",
    };
  });
}
