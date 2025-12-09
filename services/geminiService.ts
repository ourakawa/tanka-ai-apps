
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

    // VercelAPIからのエラーハンドリング
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.error || `サーバーエラー (${response.status})`;
      
      if (errorMessage.includes('API_KEY')) {
        throw new Error("システム設定エラー：APIキーが設定されていません。管理者に連絡してください。");
      }
      throw new Error(errorMessage);
    }

    const data = await response.json();

    // ★バックエンドから送られてきたモデル名を取得
    const usedModel = data.usedModel;

    // Geminiからの応答データを解析
    const candidate = data.candidates?.[0];
    
    // Safety Filterチェック
    if (candidate?.finishReason === 'SAFETY') {
      throw new Error("入力内容がAIの安全基準によりブロックされました。表現を変更してお試しください。");
    }

    const rawText = candidate?.content?.parts?.[0]?.text;
    if (!rawText) {
      throw new Error("AIからの応答が空でした。");
    }

    // JSONパース（Vercel経由なら綺麗なデータが来るはずだが、念のためクリーニング）
    let cleanText = rawText.trim();
    // Markdown記法の除去
    cleanText = cleanText.replace(/^```json/, '').replace(/^```/, '').replace(/```$/, '');
    
    try {
      const parsedResult = JSON.parse(cleanText) as EvaluationResult;
      // モデル名を結果オブジェクトに結合
      parsedResult.usedModel = usedModel;
      return parsedResult;
    } catch (e) {
      console.error("JSON Parse Error:", cleanText);
      throw new Error("評価データの読み込みに失敗しました。");
    }

  } catch (error: any) {
    console.error("Evaluate Error:", error);
    throw error; // UI側でメッセージを表示するためにそのまま投げる
  }
};