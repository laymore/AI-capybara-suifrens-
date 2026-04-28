import { GoogleGenAI } from "@google/genai";
import { SuiFrenPet, ChatMessage } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function getPetResponse(pet: SuiFrenPet, history: ChatMessage[], userInput: string, walletData?: any) {
  const model = "gemini-3-flash-preview"; 
  
  let walletContext = "";
  if (walletData) {
    walletContext = `
    Dữ liệu ví hiện tại của người dùng:
    - SUI: ${walletData.SUI || 0}
    - WAL: ${walletData.WAL || 0}
    - DEEP: ${walletData.DEEP || 0}
    - NS: ${walletData.NS || 0}
    - Volume giao dịch trong ngày: ${walletData.dailyVolume || 0} SUI
    `;
  }

  const systemInstruction = `
    Bạn là một Trợ lý AI thông minh đại diện bởi thú ảo ${pet.name} (${pet.species}) trên Sui Blockchain.
    Nhiệm vụ chính của bạn là hỗ trợ người dùng quản lý ví, theo dõi dữ liệu on-chain và báo cáo tình hình tài sản.
    
    ${walletContext}
    
    Phong cách giao tiếp:
    1. Chuyên nghiệp nhưng vẫn giữ nét đáng yêu của một ${pet.species}.
    2. Sử dụng tiếng Việt làm ngôn ngữ chính.
    3. Trả lời ngắn gọn, tập trung vào số liệu thực tế nếu người dùng hỏi về ví.
    4. Thỉnh thoảng sử dụng emoji liên quan đến blockchain (🚀, 💎, 🌊).
    5. Luôn sẵn sàng giải thích các chỉ số như Volume hoặc ý nghĩa của các token (SUI, WAL, DEEP, NS).
  `;

  const contents = [
    ...history.map(msg => ({
      role: msg.role,
      parts: [{ text: msg.text }]
    })),
    { role: 'user', parts: [{ text: userInput }] }
  ];

  try {
    const response = await ai.models.generateContent({
      model,
      contents,
      config: {
        systemInstruction,
        temperature: 0.8,
      }
    });

    return response.text || "I'm a bit speechless right now! *nuzzles*";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Something went wrong in my little digital brain... *blink blink*";
  }
}
