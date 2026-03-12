import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.VITE_FIREBASE_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);

export async function recognizeExpenseWithGemini(image) {
  if (!apiKey) {
    throw new Error("API Key cho Gemini bị thiếu! Vui lòng kiểm tra file .env");
  }

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-3.1-flash-lite-preview" });

    // Chuyển base64 sang định dạng Gemini cần
    const base64Data = image.split(",")[1];
    const mimeType = image.split(";")[0].split(":")[1];

    const prompt = `Phân tích hình ảnh hóa đơn này và trích xuất thông tin JSON:
    - "name": Tên cửa hàng hoặc loại chi tiêu chính (ngắn gọn).
    - "price": Tổng số tiền thanh toán CUỐI CÙNG (Chỉ lấy số, không bao gồm dấu phân cách nghìn hay ký hiệu tiền tệ).
    - "date": Ngày hóa đơn (YYYY-MM-DD).
    - "currency": Đơn vị tiền tệ (VND, USD...).
    Trả về DUY NHẤT một object JSON sạch, không thêm markdown hay giải thích.`;

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: base64Data,
          mimeType: mimeType,
        },
      },
    ]);

    const response = await result.response;
    let text = response.text();
    
    // Làm sạch JSON
    text = text.replace(/```json\s?|```/g, "").trim();
    
    return JSON.parse(text);
  } catch (error) {
    console.error("Gemini OCR Error:", error);
    throw error;
  }
}

export async function generateTripWithGemini(messages) {
  if (!apiKey) {
    throw new Error("API Key cho Gemini bị thiếu! Vui lòng kiểm tra file .env");
  }

  try {
    const model = genAI.getGenerativeModel({ 
      model: "gemini-3.1-flash-lite-preview",
      // Đảm bảo output là JSON
      generationConfig: {
        responseMimeType: "application/json",
      }
    });

    // Chuyển đổi định dạng messages của OpenAI/Groq sang định dạng Gemini
    // messages: [{ role: "system", content: "..." }, { role: "user", content: "..." }]
    
    // Kết hợp system prompt vào user prompt đầu tiên hoặc dùng chat
    const systemMessage = messages.find(m => m.role === "system")?.content || "";
    const userMessage = messages.find(m => m.role === "user")?.content || "";
    
    const combinedPrompt = `${systemMessage}\n\nUser Request: ${userMessage}`;

    const result = await model.generateContent(combinedPrompt);
    const response = await result.response;
    let text = response.text();
    
    // Làm sạch JSON nếu cần
    text = text.replace(/```json\s?|```/g, "").trim();
    
    return text; // Trả về text JSON để component tự parse (giống groqChat)
  } catch (error) {
    console.error("Gemini Generation Error:", error);
    return null;
  }
}
