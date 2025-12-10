export default async function handler(req, res) {
  // Version: 7.0-Mora-Correction-Logic
  
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
  // AIの計算ミスをプログラム側で強制補正するためのロジック
  function calculateMoraCount(text) {
    if (!text) return 0;
    // ひらがな・カタカナ以外（空白など）を除去して詰める
    const cleanText = text.replace(/[^ぁ-んァ-ンー]/g, '');
    
    let count = 0;
    // 小さい文字（拗音など）のリスト。これらは直前の文字とセットで1音とするため、単独ではカウントしない（ループでスキップする仕組みにするか、総数から引く）
    // ここでは「文字数 - 小さい文字の数」で計算する
    const smallChars = ['ゃ', 'ゅ', 'ょ', 'ぁ', 'ぃ', 'ぅ', 'ぇ', 'ぉ', 'ャ', 'ュ', 'ョ', 'ァ', 'ィ', 'ゥ', 'ェ', 'ォ'];
    
    for (const char of cleanText) {
      if (!smallChars.includes(char)) {
        count++;
      }
    }
    // ※「っ」「ー」はsmallCharsに含まれていないため、1音としてカウントされる（正しい挙動）
    return count;
  }

  try {
    const { text } = req.body || {};
    if (!text) {
      res.status(400).json({ error: 'Text is required.' });
      return;
    }

    // ★総当たりモデルリスト（最新モデル優先）
    const modelsToTry = [
      'gemini-2.0-flash-exp',    // 最新世代
      'gemini-1.5-pro-002',      // 1.5世代の最高性能(最新)
      'gemini-1.5-pro',          // 1.5世代の最高性能(安定)
      'gemini-1.5-flash-002',    // 1.5世代の高速版(最新)
      'gemini-1.5-flash'         // 最後の砦(最も安定)
    ];

    let lastError = null;

    for (const model of modelsToTry) {
      try {
        console.log(`Trying model: ${model}...`);
        
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
        
        // ★★★ データ補正処理 ★★★
        // AIのJSONレスポンス内の content.parts[0].text をパースし、
        // 音数（syllables）をプログラム側で再計算して上書きする
        try {
            const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
            if (rawText) {
                let cleanText = rawText.trim().replace(/^```json/, '').replace(/^```/, '').replace(/```$/, '');
                const parsedResult = JSON.parse(cleanText);

                if (parsedResult.inputAnalysis && Array.isArray(parsedResult.inputAnalysis)) {
                    // ここで再計算実行
                    parsedResult.inputAnalysis = parsedResult.inputAnalysis.map(phrase => {
                        const correctCount = calculateMoraCount(phrase.reading);
                        return {
                            ...phrase,
                            syllables: correctCount // AIの値を無視して、正しい計算値で上書き
                        };
                    });
                    
                    // 修正したJSONをテキストに戻してレスポンス構造に書き戻す
                    // （クライアント側はこれをパースして使うため）
                    data.candidates[0].content.parts[0].text = JSON.stringify(parsedResult);
                }
            }
        } catch (e) {
            console.error("Auto-correction failed:", e);
            // 補正に失敗しても、元のAIデータをそのまま返す（エラーにはしない）
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