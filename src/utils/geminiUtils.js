import genAI from '../gemini.js';

async function fileToGenerativePart(file) {
  const base64EncodedData = file.split('base64,')[1]
  return {
    inlineData: {
      data: base64EncodedData,
      mimeType: file.split(';')[0].split(':')[1],
    },
  };
}

export async function recognizeExpense(image) {
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  // Đổi prompt sang tiếng Việt
  const prompt = 'Phân tích hình ảnh hóa đơn này và xác định tổng chi phí cùng loại chi tiêu. Trả về kết quả ở định dạng JSON với hai khóa: "name" cho loại chi tiêu và "price" cho tổng chi phí.';
  const imageParts = [await fileToGenerativePart(image)];
  const result = await model.generateContent([prompt, ...imageParts]);
  const response = await result.response;
  const text = response.text();
  console.log(text);
  const jsonMatch = text.match(/```json\n(.*\n)```/s);
  if (jsonMatch && jsonMatch[1]) {
    return JSON.parse(jsonMatch[1]);
  }
  return JSON.parse(text);
}
