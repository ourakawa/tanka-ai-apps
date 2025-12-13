
import { EvaluationResult } from "../types";

// Vercel内のAPIエンドポイント（WordPressはもう使いません）
const API_ENDPOINT = "/api/evaluate";

// ★サンプル短歌の定義
const SAMPLE_TANKA_TEXT = '「ごめんね」とまいた実家の除草剤母が施設に引っ越した夏';

// ★サンプル短歌用のキャッシュ結果（高品質な固定データ）
const CACHED_SAMPLE_RESULT: EvaluationResult = {
  inputAnalysis: [
    { part: "「ごめんね」と", reading: "ごめんねと", syllables: 5 },
    { part: "まいた実家の", reading: "まいたじっかの", syllables: 7 },
    { part: "除草剤", reading: "じょそうざい", syllables: 5 },
    { part: "母が施設に", reading: "ははがしせつに", syllables: 7 },
    { part: "引っ越した夏", reading: "ひっこしたなつ", syllables: 7 }
  ],
  scores: {
    rhythm: 30,
    imagery: 29,
    originality: 38,
    total: 97
  },
  comments: {
    rhythm: "五七五七七の定型を完璧に守りつつ、会話文から始まる導入が非常にスムーズです。「除草剤（じょそうざい）」という硬い言葉を第3句（5音）にピタリと嵌める技術も見事。リズムに淀みがなく、読む人の心にすっと入ってくる心地よい定型のリズムです。",
    imagery: "「除草剤をまく」という日常的な行為に、「ごめんね」という心情を重ねることで、作者の複雑な悲しみや罪悪感が痛いほど伝わってきます。雑草が生えないようにすることは、もう母が戻ってこない家を守るための合理的処置でありながら、実家の「死」を受け入れる儀式のようでもあります。「夏」という季節が、草いきれや日差しの強さを想起させ、切なさを際立たせています。",
    originality: "「除草剤」という無機質なアイテムを短歌の核に据え、そこから家族のドラマ（介護、施設入居、実じまい）を描き出した点が非常に独創的かつ現代的です。ありふれた「悲しみ」という言葉を使わずに、行動だけで深い喪失感を表現した傑作と言えます。",
    general: "非常に完成度の高い一首です。現代社会が抱える「実家の今後」や「親の老い」という重いテーマを、たった31文字で鮮やかに切り取っています。「ごめんね」という言葉が、草に対しても、そして家を去った母に対しても向けられているような多義性を持ち、読むたびに味わいが増します。"
  },
  advice: [
    {
      suggestion: "完成度が非常に高く、修正の必要はほとんどありません。あえて別のアプローチを考えるなら、結句の「夏」を具体的な情景や体感に変えることで、違った余韻を残すことも可能です。",
      example: "「ごめんね」とまいた実家の除草剤母が施設に引っ越した朝",
      exampleAnalysis: [
        { part: "「ごめんね」と", reading: "ごめんねと", syllables: 5 },
        { part: "まいた実家の", reading: "まいたじっかの", syllables: 7 },
        { part: "除草剤", reading: "じょそうざい", syllables: 5 },
        { part: "母が施設に", reading: "ははがしせつに", syllables: 7 },
        { part: "引っ越した朝", reading: "ひっこしたあさ", syllables: 7 }
      ]
    }
  ],
  theme: {
    genre: "生活・家族",
    tone: "切ない・哀愁",
    style: "現代口語",
    nextTopicRecommendation: "「空き家」「手紙」「帰り道」などをテーマに詠んでみてはいかがでしょうか。"
  },
  usedModel: "Cached-Sample-High-Performance",
  apiVersion: "1.2.1"
};

export const evaluateTanka = async (tankaText: string): Promise<EvaluationResult> => {
  try {
    // ★サンプル短歌のキャッシュ判定（空白を除去して比較）
    const normalizedInput = tankaText.replace(/\s/g, '');
    const normalizedSample = SAMPLE_TANKA_TEXT.replace(/\s/g, '');

    if (normalizedInput === normalizedSample) {
      // APIコールをスキップして即座に結果を返す（ユーザー体験向上とAPI節約）
      return Promise.resolve(CACHED_SAMPLE_RESULT);
    }

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

    // ★バックエンドから送られてきたモデル名とバージョンを取得
    const usedModel = data.usedModel;
    const apiVersion = data.apiVersion;

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
      // モデル名とバージョンを結果オブジェクトに結合
      parsedResult.usedModel = usedModel;
      parsedResult.apiVersion = apiVersion;
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
