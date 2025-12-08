import { EvaluationResult } from "../types";

// Vercel内のAPIエンドポイント（WordPressはもう使いません）
const API_ENDPOINT = "/api/evaluate";

export const evaluateTanka = async (tankaText: string): Promise<EvaluationResult> => {
  try {
    const response = await fetch(API_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ text: tankaText }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.error || `サーバーエラー (${response.status})`;
      
      if (errorMessage.includes('API_KEY')) {
        throw new Error("システム設定エラー：APIキーが設定されていません。");
      }
      throw new Error(errorMessage);
    }

    const data = await response.json();
    const candidate = data.candidates?.[0];
    
    if (candidate?.finishReason === 'SAFETY') {
      throw new Error("入力内容がAIの安全基準によりブロックされました。");
    }

    const rawText = candidate?.content?.parts?.[0]?.text;
    if (!rawText) throw new Error("AIからの応答が空でした。");

    let cleanText = rawText.trim();
    cleanText = cleanText.replace(/^```json/, '').replace(/^```/, '').replace(/```$/, '');
    
    try {
      return JSON.parse(cleanText) as EvaluationResult;
    } catch (e) {
      throw new Error("評価データの読み込みに失敗しました。");
    }

  } catch (error: any) {
    console.error("Evaluate Error:", error);
    throw error;
  }
};
