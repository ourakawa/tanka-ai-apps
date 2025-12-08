export default async function handler(req, res) {
  // 1. CORS設定（どこからでもアクセス許可）
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // 2. OPTIONSリクエスト（確認）ならすぐにOKを返す
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // 3. POST以外は拒否
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }

  // 4. APIキーの確認（Vercelの設定画面から読み込む）
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: 'Server Configuration Error: API_KEY is missing.' });
    return;
  }

  try {
    // ボディからテキストを取得
    const { text } = req.body || {};
    if (!text) {
      res.status(400).json({ error: 'Text is required.' });
      return;
    }

    // 5. Gemini API (2.0 Flash Experimental) を呼び出す
    // 安くて、速くて、JSON指示に従順な最新モデル
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`;

    const systemPrompt = `
あなたは熟練の歌人であり、短歌の指導者です。
ユーザーから入力された短歌を評価し、必ず【純粋なJSON形式のみ】で出力してください。
Markdown記法（\`\`\`jsonなど）や挨拶文は一切不要です。

【JSONの構造】
{
  "scores": { "rhythm": 0-30, "imagery": 0-30, "originality": 0-40, "total": 0-100 },
  "comments": { 
     "rhythm": "文字列", 
     "imagery": "文字列", 
     "originality": "文字列", 
     "general": "文字列"
  },
  "advice": [
    { "suggestion": "文字列", "example": "文字列" },
    { "suggestion": "文字列", "example": "文字列" }
  ],
  "theme": {
    "genre": "文字列",
    "tone": "文字列",
    "nextTopicRecommendation": "文字列"
  },
  "sample": {
    "text": "文字列",
    "author": "文字列",
    "explanation": "文字列"
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