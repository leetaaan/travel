export async function fetchDuckDuckGoImage(query) {
  const url = `https://duckduckgo.com/i.js?l=us-en&o=json&q=${encodeURIComponent(query)}`;
  try {
    const res = await fetch(url);
    const data = await res.json();
    if (data.results && data.results.length > 0) {
      return data.results[0].image;
    }
    return null;
  } catch (e) {
    return null;
  }
} 