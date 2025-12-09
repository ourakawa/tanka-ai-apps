export default async function handler(req, res) {
  // Version: 3.2-Stable-Flash-1.5
  
  // 1. CORS設定
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }

  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: 'Server Configuration Error: API_KEY is missing.' });
    return;
  }

  try {
    const { text } = req.body || {};
    if (!text) {
      res.status(400).json({ error: 'Text is required.' });
      return;
    }

    // ★モデルを安定版の gemini-1.5-flash に変更
    // 課金有効化されたプロジェクトであれば、レート制限エラーを回避できます。
    const model = 'gemini-1.5-flash';
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const systemPrompt = `
あなたは熟練の歌人AIです。ユーザーの短歌を評価し、JSON形式のみを返してください。
Markdown装飾や挨拶は不要です。即座にJSONデータを出力してください。

【処理手順】
1. **読みの特定**: 入力された短歌の漢字を、文脈に合わせて正しい「ひらがな（読み）」に変換してください。
   - 現代仮名遣いで出力すること。
2. **音数計算**: その「ひらがな」に基づいて音数（モーラ）を数えてください。
   - 小さい「ゃ」「ゅ」「ょ」は直前の文字とセットで1音と数える（例：きゃ＝1音）。
   - 小さい「っ」は1音と数える。長音「ー」は1音と数える。
   - 字余り・字足らずを厳密に判定してください。
3. **評価とコメント**: 
   - 評価コメントは**従来の2倍の分量**で、具体的かつ論理的に記述してください。
   - 「なぜ良いのか」「どこが惜しいのか」を背景まで踏み込んで解説してください。
   - 推敲アドバイスも**分量を倍増**させ、修正案の意図を丁寧に説明してください。
   - 表現は優しく、しかし的確に指導してください。

【JSON構造】
{
  "inputAnalysis": [
    { "part": "初句(漢字)", "reading": "初句(ひらがな)", "syllables": 数値 },
    { "part": "二句(漢字)", "reading": "二句(ひらがな)", "syllables": 数値 },
    { "part": "三句(漢字)", "reading": "三句(ひらがな)", "syllables": 数値 },
    { "part": "四句(漢字)", "reading": "四句(ひらがな)", "syllables": 数値 },
    { "part": "結句(漢字)", "reading": "結句(ひらがな)", "syllables": 数値 }
  ],
  "scores": { "rhythm": 0-30, "imagery": 0-30, "originality": 0-40, "total": 0-100 },
  "comments": { 
     "rhythm": "リズムに関する詳細な長文コメント", 
     "imagery": "表現技法に関する詳細な長文コメント", 
     "originality": "独創性に関する詳細な長文コメント", 
     "general": "全体的な長文の総評"
  },
  "advice": [
    { "suggestion": "具体的な改善提案（長文詳細）", "example": "改作例" },
    { "suggestion": "具体的な改善提案（長文詳細）", "example": "改作例" }
  ],
  "theme": {
    "genre": "ジャンル",
    "tone": "トーン",
    "nextTopicRecommendation": "おすすめテーマ"
  },
  "sample": {
    "text": "実在する有名な短歌（AI創作禁止）",
    "author": "作者名",
    "explanation": "解説"
  }
}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: systemPrompt + "\n\n入力された短歌:\n" + text }]
        }],
        generationConfig: {
          responseMimeType: "application/json"
        }
      })
    });

    // レスポンスのステータスチェック（404などが返ってきていないか）
    if (!response.ok) {
      const errorText = await response.text();
      console.error("Gemini API Error Response:", response.status, errorText);
      
      let errorMessage = `AIサーバーエラー (${response.status})`;
      try {
        const errorJson = JSON.parse(errorText);
        if (errorJson.error && errorJson.error.message) {
          errorMessage = errorJson.error.message;
        }
      } catch (e) {
        // JSONパースエラー時は生のテキストを使用
      }
      res.status(response.status).json({ error: errorMessage });
      return;
    }

    const data = await response.json();

    if (data.error) {
      console.error("Gemini API Error:", data.error);
      res.status(500).json({ error: data.error.message });
      return;
    }

    res.status(200).json(data);

  } catch (error) {
    console.error("Server Error:", error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}