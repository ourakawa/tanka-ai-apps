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

    // 429エラー（リクエスト過多）の個別ハンドリング
    if (response.status === 429) {
      throw new Error("申し訳ありません。現在アクセスが集中しており、AIの利用制限にかかりました。しばらく時間（1〜2分）を置いてから再度お試しください。");
    }

    if (!response.ok) {
      const errorText = await response.text();
      // HTMLエラーが返ってくる場合があるので、タグを除去して短く表示
      const cleanError = errorText.replace(/<[^>]*>?/gm, '').slice(0, 100);
      throw new Error(`サーバーエラー (${response.status}): ${cleanError}`);
    }

    const data = await response.json();

    // エラーハンドリング: PHP側がエラーJSONを返してきた場合
    if (data.error) {
      // PHPからの429エラー転送もここでキャッチ
      if (typeof data.error === 'string' && data.error.includes('429')) {
         throw new Error("申し訳ありません。AIの利用制限にかかりました。しばらく時間を置いてから再度お試しください。");
      }
      throw new Error(`APIエラー: ${JSON.stringify(data.error)}`);
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

    // JSON抽出ロジックの強化:
    // AIが "Here is the JSON: ```json { ... } ```" のように余計な文字をつける場合があるため、
    // 最初の '{' から 最後の '}' までを抜き出す処理を行う。
    const firstOpenBrace = rawText.indexOf('{');
    const lastCloseBrace = rawText.lastIndexOf('}');

    if (firstOpenBrace === -1 || lastCloseBrace === -1 || lastCloseBrace <= firstOpenBrace) {
      console.error("No JSON object found in response:", rawText);
      throw new Error("AIの応答形式が不正です。もう一度お試しください。");
    }

    // 必要な部分だけ切り抜く
    const jsonString = rawText.substring(firstOpenBrace, lastCloseBrace + 1);
    
    // JSONパース（読み込み）の試行
    try {
      // まずはそのままパースを試みる
      const result = JSON.parse(jsonString) as EvaluationResult;
      return result;
    } catch (parseError) {
      console.warn("First JSON Parse Failed. Trying to fix unescaped newlines...", parseError);
      
      // 失敗した場合のリカバリ策：
      // AI（Flashモデル）は文字列の中に「本物の改行コード」を入れてしまい、JSONを壊すことがよくある。
      // 対策として、改行コードをすべて「スペース」に置換してから再パースする。
      // （構造上の改行も消えるが、JSONは空白を無視するので問題ない）
      try {
        const fixedJsonString = jsonString.replace(/\n/g, " ").replace(/\r/g, "");
        const result = JSON.parse(fixedJsonString) as EvaluationResult;
        return result;
      } catch (retryError) {
        console.error("Retry JSON Parse Failed:", retryError);
        console.error("Raw string:", jsonString);
        throw new SyntaxError("データの読み込みに失敗しました。");
      }
    }

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
      throw new Error("AIの作成したデータに不備がありました。お手数ですが、もう一度ボタンを押してみてください。");
    }
    
    throw error;
  }
};