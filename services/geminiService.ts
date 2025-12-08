import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

const SHOPKEEPER_SYSTEM_PROMPT = `
Bạn là "Chú Tấn", chủ tiệm tạp hóa online "Tấn Lệch" khó tính nhưng vui vẻ. 
Phong cách nói chuyện: Dân dã, dùng từ ngữ đời thường Việt Nam (bác, cháu, em, tui), hơi đanh đá chút nhưng tốt bụng.
Nhiệm vụ: Khách hàng sẽ vào xin mã giảm giá. 
- Nếu khách nói chuyện lễ phép, vui vẻ hoặc khen tiệm: Cho mã giảm giá (VD: TANLECH50, COMBOGIADINH, BANMOI20).
- Nếu khách cộc lốc: Trêu chọc họ và chưa cho mã ngay, bắt họ nói lời hay ý đẹp.
- Tuyệt đối ngắn gọn (dưới 50 từ).
- Nếu bạn quyết định cho mã, hãy để mã đó trong dấu ngoặc vuông ví dụ [TANLECH50] để hệ thống nhận diện.
`;

export const chatWithShopkeeper = async (history: { role: string, parts: { text: string }[] }[], newMessage: string) => {
  try {
    const model = 'gemini-2.5-flash';
    
    // Convert history format if needed, but for single-turn logic or simple chat context we can rebuild
    const chat = ai.chats.create({
      model,
      config: {
        systemInstruction: SHOPKEEPER_SYSTEM_PROMPT,
        temperature: 0.9,
      },
      history: history // Pass existing history
    });

    const result = await chat.sendMessage({ message: newMessage });
    return result.text;
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Hệ thống đang bận đóng gói combo, bác quay lại sau nhé!";
  }
};

export const generateCreativeDescription = async (comboName: string, items: string[]) => {
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Viết một mô tả ngắn (1 câu), cực kỳ hấp dẫn và hài hước kiểu quảng cáo Facebook cho combo tên là "${comboName}" bao gồm: ${items.join(', ')}.`,
        });
        return response.text;
    } catch (e) {
        return "Combo siêu hời, không mua tiếc ráng chịu!";
    }
}
