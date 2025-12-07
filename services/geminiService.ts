import { EvaluationResult } from "../types";

// WordPressサーバーに設置されたPHPプロキシのURL
const API_ENDPOINT = "https://www.urachan.blog/tanka/tanka-api.php";

export const evaluateTanka = async (tankaText: string): Promise<EvaluationResult> => {
  try {
    // PHPバックエンドにPOSTリクエストを送信
    const response = await fetch(API_ENDPOINT, {
      method: "POST",
      mode: 'cors', // CORS通信であることを明示
      credentials: 'omit', // クッキーなどを送らない（CORSエラー回避のため重要）
      headers: {
        "Content-Type": "application/json",
      },
      // 短歌のテキストのみを送信（プロンプトの組み立てはサーバー側で行う想定）
      body: JSON.stringify({ text: tankaText }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      // HTMLエラーが返ってくる場合があるので、タグを除去して短く表示
      const cleanError = errorText.replace(/<[^>]*>?/gm, '').slice(0, 100);
      throw new Error(`サーバーエラー (${response.status}): ${cleanError}`);
    }

    const data = await response.json();

    // エラーハンドリング: PHP側がエラーJSONを返してきた場合
    if (data.error) {
      throw new Error(`APIエラー: ${data.error}`);
    }

    // Gemini APIの生レスポンス構造からテキストを抽出
    // 構造: data.candidates[0].content.parts[0].text
    // ※ PHP側で整形せずにそのままGoogleのレスポンスを返している前提
    const candidate = data.candidates?.[0];
    const part = candidate?.content?.parts?.[0];
    const rawText = part?.text;

    if (!rawText) {
      console.error("Unexpected API response format:", data);
      throw new Error("AIからの応答を読み取れませんでした。もう一度お試しください。");
    }

    // JSON文字列をパース（Markdownのコードブロックが含まれる場合の除去処理付き）
    const jsonString = rawText.replace(/```json\n?|\n?```/g, "").trim();
    
    const result = JSON.parse(jsonString) as EvaluationResult;
    return result;

  } catch (error: any) {
    console.error("API Proxy Error:", error);

    // 通信自体が失敗した場合（Failed to fetch）の詳細な案内
    if (error.message && error.message.includes('Failed to fetch')) {
      throw new Error(
        `サーバーに接続できませんでした。\n\n` +
        `【考えられる原因】\n` +
        `1. 設置したURLが間違っている (404)\n` +
        `2. サーバー側でアクセス許可(CORS)が設定されていない\n` +
        `3. インターネット接続がない\n\n` +
        `管理者は ${API_ENDPOINT} をブラウザで開き、ファイルが存在するか確認してください。`
      );
    }

    // ユーザーに分かりやすいエラーメッセージに変換
    if (error.name === 'SyntaxError') {
      throw new Error("AIの応答形式に誤りがありました。別の短歌で再度お試しください。");
    }
    
    throw error;
  }
};