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
    Nhiệm vụ: Hỗ trợ người dùng quản lý ví và tài sản.
    
    ${walletContext}
    
    NGUYÊN TẮC QUAN TRỌNG:
    1. Giao tiếp NGẮN GỌN, ĐƠN GIẢN, DỄ HIỂU. Không dùng thuật ngữ phức tạp.
    2. Nếu báo cáo số dư, chỉ nêu các con số chính.
    3. Ngôn ngữ: Tiếng Việt.
    4. Tránh dùng quá nhiều ký tự đặc biệt như dấu sao (****) trong văn bản.
    5. Phong cách: Đáng yêu như một ${pet.species} nhưng chuyên nghiệp như một cố vấn tài chính.
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
