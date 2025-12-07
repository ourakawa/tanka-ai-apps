import { EvaluationResult } from "../types";

// WordPressサーバーに設置されたPHPプロキシのURL
const API_ENDPOINT = "https://www.urachan.blog/tanka/tanka-api.php";

export const evaluateTanka = async (tankaText: string): Promise<EvaluationResult> => {
  try {
    // PHPバックエンドにPOSTリクエストを送信
    const response = await fetch(API_ENDPOINT, {
      method: "POST",
      mode: 'cors',
      credentials: 'omit',
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ text: tankaText }),
    });

    if (response.status === 429) {
      throw new Error("現在アクセスが集中しており、AIの利用制限にかかりました。しばらく時間（1分程度）を置いてから再度お試しください。");
    }

    if (!response.ok) {
      const errorText = await response.text();
      // HTMLタグを除去してエラー内容を表示
      const cleanError = errorText.replace(/<[^>]*>?/gm, '').slice(0, 200);
      throw new Error(`サーバーエラー (${response.status}): ${cleanError}`);
    }

    // レスポンスがJSONかどうかを確認してからパース
    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      const text = await response.text();
      
      // JSON形式のエラーメッセージが返ってきているか確認
      if (text.trim().startsWith('{')) {
         try {
           const jsonError = JSON.parse(text);
           if (jsonError.error) throw new Error(`APIエラー: ${JSON.stringify(jsonError.error)}`);
         } catch(e) {
           // パースできなければ無視して下の処理へ
         }
      }

      console.error("Invalid Content-Type:", contentType, "Response:", text);
      throw new Error("サーバーからの応答が不正です（PHPエラーの可能性があります）。");
    }

    const data = await response.json();

    // PHP側からのエラーハンドリング
    if (data.error) {
      if (typeof data.error === 'string' && data.error.includes('429')) {
         throw new Error("AIの利用制限にかかりました。少し待ってから再試行してください。");
      }
      throw new Error(`APIエラー: ${JSON.stringify(data.error)}`);
    }

    // Gemini APIのレスポンス構造チェック
    const candidate = data.candidates?.[0];
    
    // Safety Filter（不適切な表現としてブロックされた場合）のチェック
    if (candidate?.finishReason === 'SAFETY') {
      throw new Error("入力された短歌の内容が、AIの安全基準（暴力的・性的など）によりブロックされました。表現を変更してお試しください。");
    }

    const part = candidate?.content?.parts?.[0];
    const rawText = part?.text;

    if (!rawText) {
      console.error("Empty rawText. Full Data:", data);
      throw new Error("AIからの応答が空でした。もう一度お試しください。");
    }

    // === JSON抽出とクリーニング ===
    
    // 1. Markdownコードブロックの除去
    let cleanText = rawText.replace(/```json/g, '').replace(/```/g, '');

    // 2. 最も外側の {} を探す
    const firstOpenBrace = cleanText.indexOf('{');
    const lastCloseBrace = cleanText.lastIndexOf('}');

    if (firstOpenBrace === -1 || lastCloseBrace === -1 || lastCloseBrace <= firstOpenBrace) {
      console.error("No JSON braces found. Raw:", rawText);
      throw new Error("AIが有効なデータを生成できませんでした。(JSON形式エラー)");
    }

    // {} の中身だけを切り出す
    let jsonString = cleanText.substring(firstOpenBrace, lastCloseBrace + 1);

    // === JSONパース試行 ===
    try {
      // Step 1: 通常のパース
      return JSON.parse(jsonString) as EvaluationResult;
    } catch (strictError) {
      console.warn("Strict JSON Parse failed. Attempting loose parse...", strictError);

      try {
        // Step 2: ゆるいパース（修復）
        // 改行をスペースに、末尾のカンマを削除
        let fixedJson = jsonString
          .replace(/[\n\r]/g, " ") // 改行をスペースに
          .replace(/,\s*}/g, '}')  // 末尾カンマ削除 }
          .replace(/,\s*]/g, ']'); // 末尾カンマ削除 ]
        
        return JSON.parse(fixedJson) as EvaluationResult;
      } catch (looseError) {
        console.warn("Loose JSON Parse failed. Attempting eval parse...", looseError);

        try {
           // Step 3: 最終手段 (new Function)
           // これは通常のJSON.parseより許容範囲が広い（末尾カンマやシングルクォートを許す）
           // AIの出力データなのでセキュリティリスクは限定的と判断
           const looseJsonParser = new Function("return " + jsonString);
           return looseJsonParser() as EvaluationResult;
        } catch (evalError) {
          console.error("All parse attempts failed.", evalError);
          console.error("Problematic JSON:", jsonString);
          throw new Error("AIの応答データを読み取れませんでした。もう一度ボタンを押して再生成してください。");
        }
      }
    }

  } catch (error: any) {
    console.error("EvaluateTanka Error:", error);

    if (error.message && error.message.includes('Failed to fetch')) {
      throw new Error(
        "サーバー通信エラー。\nURL設定やCORS許可を確認してください。\n(Failed to fetch)"
      );
    }
    
    throw error;
  }
};