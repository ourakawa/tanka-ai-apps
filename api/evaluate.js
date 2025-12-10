
// Version: 8.0-Admin-Logs-NGWords
// ★簡易メモリデータベース（注意：サーバー再起動でリセットされます）
// 本格運用時は外部DB（Supabase等）への移行を推奨
let MEMORY_DB = {
  logs: [],       // アクセスログ（最大30件）
  ngWords: ['死ね', '殺す', '馬鹿', 'アホ', '犯罪', '爆破'], // デフォルトNGワード
  appVersion: 'v1.0.0'
};

export default async function handler(req, res) {
  // 1. CORS設定
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, PUT, OPTIONS'); // GET/PUT追加
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-admin-password'); // パスワードヘッダー許可

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // ★管理者用パスワード（本番環境では環境変数で管理推奨）
  const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

  // ==========================================
  // 【管理者機能】データ取得 (GET)
  // ==========================================
  if (req.method === 'GET') {
    const password = req.headers['x-admin-password'];
    if (password !== ADMIN_PASSWORD) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    res.status(200).json({
      logs: MEMORY_DB.logs,
      ngWords: MEMORY_DB.ngWords
    });
    return;
  }

  // ==========================================
  // 【管理者機能】設定更新 (PUT)
  // ==========================================
  if (req.method === 'PUT') {
    const password = req.headers['x-admin-password'];
    if (password !== ADMIN_PASSWORD) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    const { ngWords } = req.body;
    if (Array.isArray(ngWords)) {
      MEMORY_DB.ngWords = ngWords;
      res.status(200).json({ message: 'Settings updated', ngWords: MEMORY_DB.ngWords });
    } else {
      res.status(400).json({ error: 'Invalid data format' });
    }
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

  // ログ記録用ヘルパー関数
  const addLog = (text, status, model = '-') => {
    const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress || 'unknown';
    const log = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      ip: ip.split(',')[0], // 最初のIPを採用
      text: text.substring(0, 50) + (text.length > 50 ? '...' : ''), // 長すぎる場合はカット
      model: model,
      status: status,
      appVersion: MEMORY_DB.appVersion
    };
    
    // 先頭に追加（新しい順）
    MEMORY_DB.logs.unshift(log);
    
    // 30件制限
    if (MEMORY_DB.logs.length > 30) {
      MEMORY_DB.logs.pop();
    }
  };

  // ★音数（モーラ）計算関数
  function calculateMoraCount(text) {
    if (!text) return 0;
    const cleanText = text.replace(/[^ぁ-んァ-ンー]/g, '');
    let count = 0;
    const smallChars = ['ゃ', 'ゅ', 'ょ', 'ぁ', 'ぃ', 'ぅ', 'ぇ', 'ぉ', 'ャ', 'ュ', 'ョ', 'ァ', 'ィ', 'ゥ', 'ェ', 'ォ'];
    for (const char of cleanText) {
      if (!smallChars.includes(char)) {
        count++;
      }
    }
    return count;
  }

  try {
    const { text } = req.body || {};
    if (!text) {
      res.status(400).json({ error: 'Text is required.' });
      return;
    }

    // ★NGワードチェック
    for (const ngWord of MEMORY_DB.ngWords) {
      if (text.includes(ngWord)) {
        addLog(text, 'BLOCKED');
        res.status(400).json({ error: '不適切な表現が含まれているため、評価できません。' });
        return;
      }
    }

    // ★総当たりモデルリスト（最新モデル優先）
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
4. **推敲案の作成**:
   - アドバイスに基づく改作例も作成し、それについても入力短歌と同様に「読み」と「音数計算」を行ってください。
   - ただしJSON構造上はテキストのみを返しますが、内部でリズムを確認してください。

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
    "style": "文体（口語/文語）",
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
        usedModelName = model;
        
        // ★★★ データ補正処理 ★★★
        try {
            const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
            if (rawText) {
                let cleanText = rawText.trim().replace(/^```json/, '').replace(/^```/, '').replace(/```$/, '');
                const parsedResult = JSON.parse(cleanText);

                if (parsedResult.inputAnalysis && Array.isArray(parsedResult.inputAnalysis)) {
                    parsedResult.inputAnalysis = parsedResult.inputAnalysis.map(phrase => {
                        const correctCount = calculateMoraCount(phrase.reading);
                        return { ...phrase, syllables: correctCount };
                    });
                    data.candidates[0].content.parts[0].text = JSON.stringify(parsedResult);
                }
            }
        } catch (e) {
            console.error("Auto-correction failed:", e);
        }

        // ★ログ記録（成功）
        addLog(text, 'SUCCESS', usedModelName);

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
    // ★ログ記録（エラー）
    addLog(text, 'ERROR', '-');
    throw lastError || new Error("All models failed.");

  } catch (error) {
    console.error("Server Error (Final):", error);
    res.status(500).json({ error: 'AIサーバーへの接続に失敗しました。しばらく待ってから再度お試しください。' });
  }
}
