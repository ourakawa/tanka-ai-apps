
// Version: 1.1.0
const API_VERSION = '1.1.0';

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

  // ★名歌データベース（ハルシネーション防止）
  const REFERENCE_TANKA_DB = [
    { id: 1, text: "東海の小島の磯の白砂にわれ泣きぬれて蟹とたはむる", author: "石川啄木", explanation: "故郷を離れた孤独と、自然の中での無垢な心が詠まれています。砂浜の白と海の青の対比が鮮やかです。" },
    { id: 2, text: "その子二十櫛にながるる黒髪のおごりの春のうつくしきかな", author: "与謝野晶子", explanation: "青春の生命力と自らの美しさへの自信が、流れる黒髪の描写を通して高らかに歌い上げられています。" },
    { id: 3, text: "観覧車回れよ回れ想ひ出は君には一日我には一生", author: "栗木京子", explanation: "同じ時間を共有していても、相手と自分とでその重みが異なる切なさを、回転する観覧車に託しています。" },
    { id: 4, text: "「嫁さんになれよ」だなんてカンタンに言わないでよと笑っちゃうけど", author: "俵万智", explanation: "口語体を活かした軽やかなリズムの中に、プロポーズされた瞬間の照れと喜びが素直に表現されています。" },
    { id: 5, text: "白鳥は哀しからずや空の青海のあをにも染まずただよふ", author: "若山牧水", explanation: "周囲の青さに染まることなく孤独に漂う白鳥に、作者自身の孤独な魂を重ね合わせています。" },
    { id: 6, text: "春の夜の夢ばかりなる手枕にかひなく立たむ名こそ惜しけれ", author: "周防内侍", explanation: "平安時代の恋の駆け引きを詠んだ歌ですが、一瞬の夢のような出来事に身を委ねることの危うさを説いています。" },
    { id: 7, text: "不来方のお城の草に寝ころびて空に吸はれし十五の心", author: "石川啄木", explanation: "青春時代の無垢で吸収性の高い心が、広い空に溶け込んでいくような感覚を瑞々しく描いています。" },
    { id: 8, text: "たのしみは妻子むつまじくうちつどひ頭ならべて物をくふ時", author: "橘曙覧", explanation: "「独楽吟」の中の一首。日常のささやかな幸せこそが人生の楽しみであるという実感が込められています。" },
    { id: 9, text: "死にたくてならぬ時あり箸持てば大根のあたまの欠けてゐるにも", author: "斎藤茂吉", explanation: "日常の些細な欠損（大根の欠け）から、ふと死にたいほどの虚無感や寂しさが誘発される心理を鋭く捉えています。" },
    { id: 10, text: "くれなゐの二尺伸びたる薔薇の芽の針やはらかに春雨のふる", author: "正岡子規", explanation: "病床から眺める庭の景色。薔薇の芽の赤さと柔らかい針、そして春雨の静けさが、生命の息吹を感じさせます。" }
  ];

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
5. **参考歌の選択**:
   - 創作は禁止です。以下のリストから、ユーザーの歌のテーマ（ジャンル・トーン）に最も近い一首を選び、その【ID番号のみ】を出力JSONの "sampleId" フィールドに設定してください。
   - リスト: ${JSON.stringify(REFERENCE_TANKA_DB.map(t => ({ id: t.id, text: t.text })))}

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
  },
  "sampleId": 数値
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

                // 3. 参考歌の注入（ハルシネーション対策）
                const sampleId = parsedResult.sampleId || 1;
                // IDが範囲外ならランダムに選ぶ
                const safeId = (sampleId > 0 && sampleId <= REFERENCE_TANKA_DB.length) 
                    ? sampleId 
                    : Math.floor(Math.random() * REFERENCE_TANKA_DB.length) + 1;
                
                const selectedTanka = REFERENCE_TANKA_DB.find(t => t.id === safeId);
                parsedResult.sample = {
                    text: selectedTanka.text,
                    author: selectedTanka.author,
                    explanation: selectedTanka.explanation
                };

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
