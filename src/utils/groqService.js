async function groqChat(messages, model = "llama-3.3-70b-versatile") {
  const apiKey = import.meta.env.VITE_GROQ_API_KEY;
  if (!apiKey) {
    console.warn("GROQ API KEY is missing!");
    return null;
  }

  try {
    const body = {
      messages,
      model,
      temperature: 0,
      max_completion_tokens: 16384,
      response_format: { type: "json_object" },
    };

    const response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      },
    );

    const data = await response.json();

    if (!data.choices || !data.choices[0]) {
      console.error("Groq API: No choices returned", data);
      return null;
    }

    let content = data.choices[0].message.content || "";

    if (!content && data.choices[0].finish_reason === "length") {
      console.error("Groq API: Response truncated (hit token limit)");
      return null;
    }

    // Advanced JSON extraction: find the first { and last }
    const jsonStart = content.indexOf("{");
    const jsonEnd = content.lastIndexOf("}");
    if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
      content = content.substring(jsonStart, jsonEnd + 1);
    }

    return content;
  } catch (error) {
    console.error("Groq API Error:", error);
    return null;
  }
}

// OCR: nhận diện hóa đơn từ ảnh (dùng model vision)
export async function recognizeExpense(image) {
  const apiKey = import.meta.env.VITE_GROQ_API_KEY;
  if (!apiKey) {
    throw new Error("GROQ_API_KEY is missing! Vui lòng thêm vào .env");
  }

  const base64Data = image.split("base64,")[1];
  const mimeType = image.split(";")[0].split(":")[1];

  const prompt = `Phân tích hình ảnh hóa đơn này và trích xuất các thông tin sau dưới định dạng JSON:
  - "name": Tên cửa hàng hoặc loại chi tiêu chính (ngắn gọn).
  - "price": Tổng số tiền thanh toán cuối cùng (chỉ lấy số).
  - "date": Ngày trên hóa đơn (nếu có, định dạng YYYY-MM-DD).
  - "items": Danh sách các món hàng (nếu có, gồm tên và giá).
  - "currency": Đơn vị tiền tệ (VND, USD, v.v.).

  Chỉ trả về JSON duy nhất, không thêm văn bản giải thích.`;

  try {
    const response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "llama-3.2-11b-vision-preview",
          messages: [
            {
              role: "user",
              content: [
                { type: "text", text: prompt },
                {
                  type: "image_url",
                  image_url: {
                    url: `data:${mimeType};base64,${base64Data}`,
                  },
                },
              ],
            },
          ],
          temperature: 0.1,
          // Bỏ response_format tạm thời để kiểm tra nếu nó gây ra lỗi 400
          // response_format: { type: "json_object" },
        }),
      },
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Groq API Error Response:", errorText);
      try {
        const errorJson = JSON.parse(errorText);
        throw new Error(`Groq API Error: ${errorJson.error?.message || response.statusText}`);
      } catch (e) {
        throw new Error(`Groq API Error (${response.status}): ${errorText.substring(0, 100)}`);
      }
    }

    const data = await response.json();
    if (!data.choices || !data.choices[0]) {
      throw new Error("Không nhận được phản hồi từ AI");
    }

    let text = data.choices[0].message.content;
    // Làm sạch text nếu AI trả về markdown code blocks
    text = text.replace(/```json\s?|```/g, "").trim();
    
    return JSON.parse(text);
  } catch (error) {
    console.error("Groq OCR Error:", error);
    throw error;
  }
}

export default groqChat;
