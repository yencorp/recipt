import { GoogleGenAI, Type } from '@google/genai';
import { ExtractedReceiptData } from '../types';

if (!process.env.API_KEY) {
    console.warn("API_KEY 환경 변수가 설정되지 않았습니다. 모의 서비스를 사용합니다.");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

const fileToGenerativePart = async (file: File) => {
    const base64EncodedDataPromise = new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            if (typeof reader.result === 'string') {
                resolve(reader.result.split(',')[1]);
            }
        };
        reader.readAsDataURL(file);
    });
    return {
        inlineData: { data: await base64EncodedDataPromise, mimeType: file.type },
    };
};

const mockReceiptExtraction = (file: File): Promise<ExtractedReceiptData> => {
    return new Promise(resolve => {
        setTimeout(() => {
            resolve({
                store: "모의 카페",
                date: new Date().toISOString().split('T')[0],
                total: parseFloat((Math.random() * 50000).toFixed(0))
            });
        }, 1500);
    });
};

export const extractReceiptInfoFromImage = async (file: File): Promise<ExtractedReceiptData | null> => {
    if (!process.env.API_KEY) {
        return mockReceiptExtraction(file);
    }

    try {
        const imagePart = await fileToGenerativePart(file);

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: [
                {
                    parts: [
                        imagePart,
                        { text: "이 영수증 이미지를 분석해주세요. 가게 이름, 전체 거래 날짜, 최종 합계 금액을 추출해주세요. 날짜는 YYYY-MM-DD 형식이어야 합니다." }
                    ]
                }
            ],
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        store: {
                            type: Type.STRING,
                            description: "The name of the store or merchant."
                        },
                        date: {
                            type: Type.STRING,
                            description: "The full transaction date, formatted as YYYY-MM-DD."
                        },
                        total: {
                            type: Type.NUMBER,
                            description: "The final total amount of the transaction."
                        }
                    },
                    required: ["store", "date", "total"]
                }
            }
        });

        const jsonText = response.text.trim();
        const extractedData = JSON.parse(jsonText);

        if (extractedData && typeof extractedData.store === 'string' && typeof extractedData.date === 'string' && typeof extractedData.total === 'number') {
            return extractedData as ExtractedReceiptData;
        }
        
        return null;

    } catch (error) {
        console.error("영수증 정보 추출 중 오류 발생:", error);
        return null;
    }
};