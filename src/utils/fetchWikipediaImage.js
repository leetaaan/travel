export async function fetchWikipediaImage(query) {
  // 1. Tìm trang Wikipedia
  const searchUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&format=json&origin=*`;
  const searchRes = await fetch(searchUrl);
  const searchData = await searchRes.json();
  if (!searchData.query.search.length) return null;
  const pageTitle = searchData.query.search[0].title;

  // 2. Lấy ảnh đại diện của trang (cả original và thumbnail)
  const imageUrl = `https://en.wikipedia.org/w/api.php?action=query&prop=pageimages&format=json&piprop=original|thumbnail&pithumbsize=400&titles=${encodeURIComponent(pageTitle)}&origin=*`;
  const imageRes = await fetch(imageUrl);
  const imageData = await imageRes.json();
  const pages = imageData.query.pages;
  const page = Object.values(pages)[0];
  if (page.original) return page.original.source;
  if (page.thumbnail) return page.thumbnail.source;
  return null;
} 