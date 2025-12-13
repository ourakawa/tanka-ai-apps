
// Version: 1.2.1
const API_VERSION = '1.2.1';

export default async function handler(req, res) {
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

  // ★音数（モーラ）計算関数
  function calculateMoraCount(text) {
    if (!text) return 0;
    // ひらがな・カタカナ・ー 以外を削除（念のため）
    const cleanText = text.replace(/[^ぁ-んァ-ンー]/g, '');
    let count = 0;
    const smallChars = ['ゃ', 'ゅ', 'ょ', 'ぁ', 'ぃ', 'ぅ', 'ぇ', 'ぉ', 'ャ', 'ュ', 'ョ', 'ァ', 'ィ', 'ゥ', 'ェ', 'ォ'];
    for (const char of cleanText) {
      // 小さい文字以外を1音としてカウント
      if (!smallChars.includes(char)) {
        count++;
      }
      // ※「っ」「ー」は小さい文字リストに含まれていないのでカウントされる（正しい）
    }
    return count;
  }

  try {
    const { text } = req.body || {};
    if (!text) {
      res.status(400).json({ error: 'Text is required.' });
      return;
    }

    // 総当たりモデルリスト（最新モデル優先）
    const modelsToTry = [
      'gemini-2.0-flash-exp',
      'gemini-1.5-pro-002',
      'gemini-1.5-pro',
      'gemini-1.5-flash-002',
      'gemini-1.5-flash'
    ];

    let lastError = null;
    let usedModelName = 'unknown';

    for (const model of modelsToTry) {
      try {
        console.log(`Trying model: ${model}...`);
        
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

        const systemPrompt = `
あなたは熟練の歌人AIです。ユーザーの短歌を評価し、JSON形式のみを返してください。
Markdown装飾や挨拶は不要です。即座にJSONデータを出力してください。

【処理手順】
1. **読みの特定**: 入力された短歌の漢字を、文脈に合わせて正しい「ひらがな（読み）」に変換してください。
   - **重要**: "reading"フィールドには漢字を含めず、**すべてひらがな**に展開してください。（例：「頭」→「かしら」、「妻子」→「さいし」）
2. **音数計算**: その「ひらがな」に基づいて音数（モーラ）を数えてください。
   - 小さい「ゃ」「ゅ」「ょ」は直前の文字とセットで1音と数える（例：きゃ＝1音）。
   - 小さい「っ」は1音と数える。長音「ー」は1音と数える。
   - 字余り・字足らずを厳密に判定してください。
3. **評価とコメント**: 
   - 評価コメントは**従来の2倍の分量**で、具体的かつ論理的に記述してください。
   - 「なぜ良いのか」「どこが惜しいのか」を背景まで踏み込んで解説してください。
   - 推敲アドバイスも**分量を倍増**させ、修正案の意図を丁寧に説明してください。
   - 表現は優しく、しかし的確に指導してください。
4. **推敲案の作成**:
   - アドバイスに基づく改作例も作成し、それについても入力短歌と同様に「読み」と「音数計算」を行ってください。

【JSON構造】
{
  "inputAnalysis": [
    { "part": "初句のテキスト", "reading": "初句の読み(すべてひらがな)", "syllables": 数値 },
    { "part": "二句のテキスト", "reading": "二句の読み(すべてひらがな)", "syllables": 数値 },
    { "part": "三句のテキスト", "reading": "三句の読み(すべてひらがな)", "syllables": 数値 },
    { "part": "四句のテキスト", "reading": "四句の読み(すべてひらがな)", "syllables": 数値 },
    { "part": "結句のテキスト", "reading": "結句の読み(すべてひらがな)", "syllables": 数値 }
  ],
  "scores": { "rhythm": 0-30, "imagery": 0-30, "originality": 0-40, "total": 0-100 },
  "comments": { 
     "rhythm": "リズムに関する詳細な長文コメント", 
     "imagery": "表現技法に関する詳細な長文コメント", 
     "originality": "独創性に関する詳細な長文コメント", 
     "general": "全体的な長文の総評"
  },
  "advice": [
    { 
      "suggestion": "具体的な改善提案（長文詳細）", 
      "example": "改作例",
      "exampleAnalysis": [
          { "part": "初句", "reading": "ひらがな", "syllables": 数値 },
          { "part": "二句", "reading": "ひらがな", "syllables": 数値 },
          { "part": "三句", "reading": "ひらがな", "syllables": 数値 },
          { "part": "四句", "reading": "ひらがな", "syllables": 数値 },
          { "part": "結句", "reading": "ひらがな", "syllables": 数値 }
      ]
    }
  ],
  "theme": {
    "genre": "ジャンル",
    "tone": "トーン",
    "style": "文体（口語/文語）",
    "nextTopicRecommendation": "おすすめテーマ"
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

        if (!response.ok) {
          const errorText = await response.text();
          console.warn(`Model ${model} failed with status ${response.status}: ${errorText}`);
          lastError = new Error(`Model ${model} error: ${response.status} - ${errorText}`);
          continue; 
        }

        const data = await response.json();

        if (data.error) {
          console.warn(`Model ${model} returned API error:`, data.error);
          lastError = new Error(data.error.message);
          continue; 
        }

        // 成功！
        data.usedModel = model;
        // ★APIバージョンを付与
        data.apiVersion = API_VERSION;
        usedModelName = model;
        
        // ★★★ データ補正処理 ★★★
        try {
            const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
            if (rawText) {
                let cleanText = rawText.trim().replace(/^```json/, '').replace(/^```/, '').replace(/```$/, '');
                const parsedResult = JSON.parse(cleanText);

                // 1. ユーザー短歌の音数再計算
                if (parsedResult.inputAnalysis && Array.isArray(parsedResult.inputAnalysis)) {
                    parsedResult.inputAnalysis = parsedResult.inputAnalysis.map(phrase => {
                        const correctCount = calculateMoraCount(phrase.reading);
                        return { ...phrase, syllables: correctCount };
                    });
                }

                // 2. 推敲案の音数再計算
                if (parsedResult.advice && Array.isArray(parsedResult.advice)) {
                    parsedResult.advice = parsedResult.advice.map(item => {
                        if (item.exampleAnalysis && Array.isArray(item.exampleAnalysis)) {
                            item.exampleAnalysis = item.exampleAnalysis.map(phrase => {
                                const correctCount = calculateMoraCount(phrase.reading);
                                return { ...phrase, syllables: correctCount };
                            });
                        }
                        return item;
                    });
                }

                data.candidates[0].content.parts[0].text = JSON.stringify(parsedResult);
            }
        } catch (e) {
            console.error("Auto-correction failed:", e);
        }

        res.status(200).json(data);
        return;

      } catch (e) {
        console.warn(`Model ${model} exception:`, e);
        lastError = e;
        continue;
      }
    }

    // 全滅した場合
    console.error("All models failed. Last error:", lastError);
    throw lastError || new Error("All models failed.");

  } catch (error) {
    console.error("Server Error (Final):", error);
    res.status(500).json({ error: 'AIサーバーへの接続に失敗しました。しばらく待ってから再度お試しください。' });
  }
}
