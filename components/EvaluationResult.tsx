
import React from 'react';
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { EvaluationResult as EvaluationResultType } from '../types';

interface EvaluationResultProps {
  result: EvaluationResultType;
  onReset: () => void;
}

const ScoreBadge: React.FC<{ label: string; score: number; max: number }> = ({ label, score, max }) => (
  <div className="flex flex-col items-center p-3 bg-slate-50 rounded-lg border border-slate-100">
    <span className="text-slate-500 text-sm mb-1">{label}</span>
    <div className="flex items-baseline">
      <span className="text-2xl font-bold text-indigo-700">{score}</span>
      <span className="text-sm text-slate-400">/{max}</span>
    </div>
  </div>
);

const EvaluationResult: React.FC<EvaluationResultProps> = ({ result, onReset }) => {
  const chartData = [
    { subject: 'リズム・定型', A: result.scores.rhythm, fullMark: 30 },
    { subject: '表現技法', A: result.scores.imagery, fullMark: 30 },
    { subject: '独創性', A: result.scores.originality, fullMark: 40 },
  ];

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col gap-8 pb-12">
      
      {/* 1. User's Tanka Analysis with Reading */}
      <section className="bg-white rounded-xl shadow-lg border-2 border-indigo-100 overflow-hidden">
        <div className="bg-indigo-50 px-6 py-4 border-b border-indigo-100 flex items-center justify-between">
           <h2 className="text-lg font-bold text-indigo-800 flex items-center gap-2">
             <span className="text-xl">🪶</span> あなたの短歌（音数分析）
           </h2>
        </div>
        <div className="p-6 md:p-8">
          <div className="flex flex-wrap justify-center items-start gap-3 md:gap-6">
            {result.inputAnalysis && result.inputAnalysis.map((phrase, idx) => (
              <div key={idx} className="flex flex-col items-center p-3 bg-slate-50 rounded-lg border border-slate-100 min-w-[4rem]">
                {/* Reading (Hiragana) - NEW FEATURE */}
                <span className="text-xs text-indigo-500 mb-1 font-bold tracking-wider">
                  {phrase.reading}
                </span>
                {/* Kanji */}
                <div className="text-xl md:text-2xl font-serif text-slate-800 font-bold mb-2 writing-horizontal">
                  {phrase.part}
                </div>
                {/* Syllable Count */}
                <span className={`
                  px-3 py-1 rounded-full text-xs font-bold shadow-sm transition-colors whitespace-nowrap
                  ${(idx === 0 || idx === 2) && phrase.syllables === 5 ? 'bg-emerald-100 text-emerald-700' : ''}
                  ${(idx === 1 || idx === 3 || idx === 4) && phrase.syllables === 7 ? 'bg-emerald-100 text-emerald-700' : ''}
                  ${!((idx === 0 || idx === 2) && phrase.syllables === 5) && !((idx === 1 || idx === 3 || idx === 4) && phrase.syllables === 7) ? 'bg-amber-100 text-amber-700' : ''}
                `}>
                  {phrase.syllables}音
                </span>
              </div>
            ))}
          </div>
          <p className="text-center text-xs text-slate-400 mt-4">
             ※AIが読み（ひらがな）を判定して音数を計算しています。読みが意図と異なる場合は音数も変わる可能性があります。
          </p>
        </div>
      </section>

      {/* 2. Total Score Section */}
      <section className="bg-white rounded-xl shadow-lg border-2 border-indigo-50 overflow-hidden">
        <div className="bg-indigo-600 text-white p-4 text-center">
          <h2 className="text-xl font-bold tracking-widest">総合評価</h2>
        </div>
        <div className="p-8 flex flex-col md:flex-row items-center justify-around gap-8">
          <div className="text-center relative">
            <div className="text-6xl md:text-8xl font-serif font-bold text-slate-800">
              {result.scores.total}
              <span className="text-2xl md:text-3xl text-slate-400 font-sans ml-2">点</span>
            </div>
            <div className="mt-2 text-indigo-600 font-bold text-lg">
              {result.scores.total >= 90 ? "素晴らしい傑作です！" :
               result.scores.total >= 80 ? "とても良い歌です！" :
               result.scores.total >= 70 ? "味わい深い一首です。" : "これからの伸びしろがあります。"}
            </div>
          </div>

          {/* Radar Chart */}
          <div className="w-full md:w-1/2 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="80%" data={chartData}>
                <PolarGrid stroke="#e2e8f0" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: '#475569', fontSize: 14 }} />
                <PolarRadiusAxis angle={30} domain={[0, 40]} tick={false} axisLine={false} />
                <Radar
                  name="Score"
                  dataKey="A"
                  stroke="#4f46e5"
                  strokeWidth={3}
                  fill="#6366f1"
                  fillOpacity={0.4}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Detailed Scores Row */}
        <div className="grid grid-cols-3 gap-2 p-4 bg-slate-50 border-t border-slate-100">
          <ScoreBadge label="リズム・定型" score={result.scores.rhythm} max={30} />
          <ScoreBadge label="表現・具体性" score={result.scores.imagery} max={30} />
          <ScoreBadge label="独創性・主体性" score={result.scores.originality} max={40} />
        </div>
      </section>

      {/* 3. AI Comments (Renamed & Enhanced) */}
      <section className="bg-white rounded-xl shadow-md p-6 md:p-8 border-l-8 border-indigo-400">
        <h3 className="text-xl font-bold text-slate-700 mb-4 flex items-center">
          <span className="text-2xl mr-2">🤖</span> AIからのコメント
        </h3>
        <p className="text-lg leading-loose text-slate-700 font-serif mb-6 whitespace-pre-wrap">
          {result.comments.general}
        </p>
        <div className="grid md:grid-cols-2 gap-6 text-sm">
          <div className="bg-indigo-50 p-5 rounded-lg">
            <strong className="block text-indigo-800 mb-3 text-base border-b border-indigo-200 pb-2">♪ リズムについて</strong>
            <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">{result.comments.rhythm}</p>
          </div>
          <div className="bg-emerald-50 p-5 rounded-lg">
            <strong className="block text-emerald-800 mb-3 text-base border-b border-emerald-200 pb-2">✿ 表現について</strong>
            <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">{result.comments.imagery}</p>
          </div>
          <div className="bg-amber-50 p-5 rounded-lg md:col-span-2">
            <strong className="block text-amber-800 mb-3 text-base border-b border-amber-200 pb-2">★ 独創性について</strong>
            <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">{result.comments.originality}</p>
          </div>
        </div>
      </section>

      {/* 4. Revision Advice */}
      <section className="bg-white rounded-xl shadow-md p-6 md:p-8">
        <h3 className="text-xl font-bold text-slate-700 mb-6 flex items-center">
          <span className="text-2xl mr-2">💡</span> 推敲のアドバイス
        </h3>
        <div className="space-y-6">
          {result.advice.map((item, idx) => (
            <div key={idx} className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
              <div className="bg-slate-50 p-4 font-bold text-slate-700 border-b border-slate-200 flex items-center gap-2">
                <span className="bg-slate-200 text-slate-600 w-6 h-6 flex items-center justify-center rounded-full text-xs">
                  {idx + 1}
                </span>
                アドバイス
              </div>
              <div className="p-5 md:p-7">
                <p className="mb-5 text-slate-800 font-medium leading-relaxed whitespace-pre-wrap">
                  {item.suggestion}
                </p>
                <div className="bg-yellow-50 p-5 rounded-lg flex flex-col md:flex-row gap-4 items-start md:items-center">
                  <span className="bg-yellow-200 text-yellow-800 px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap">
                    改作例
                  </span>
                  <p className="text-slate-700 font-serif text-lg">
                    「{item.example}」
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 5. Theme & Sample */}
      <div className="grid md:grid-cols-2 gap-8">
        {/* Theme Analysis */}
        <section className="bg-white rounded-xl shadow-md p-6 border-t-4 border-pink-300">
          <h3 className="text-lg font-bold text-slate-700 mb-4">
            🔍 テーマ分析
          </h3>
          <div className="space-y-4">
            <div>
              <span className="text-xs text-slate-400 block mb-1">ジャンル</span>
              <span className="inline-block bg-pink-100 text-pink-700 px-4 py-1 rounded-full text-sm font-bold">
                {result.theme.genre}
              </span>
            </div>
            <div>
              <span className="text-xs text-slate-400 block mb-1">作品のトーン</span>
              <p className="text-slate-700">{result.theme.tone}</p>
            </div>
            <div className="pt-4 border-t border-slate-100">
              <span className="text-xs text-slate-400 block mb-1">次におすすめのテーマ</span>
              <p className="text-indigo-600 font-bold">{result.theme.nextTopicRecommendation}</p>
            </div>
          </div>
        </section>

        {/* Reference Tanka */}
        <section className="bg-white rounded-xl shadow-md p-6 border-t-4 border-teal-300">
          <h3 className="text-lg font-bold text-slate-700 mb-4">
            📖 参考になる一首 (実在する名歌)
          </h3>
          <blockquote className="relative p-4 bg-teal-50 rounded-lg mb-4">
             <p className="font-serif text-xl text-slate-800 leading-loose mb-2">
               {result.sample.text}
             </p>
             <footer className="text-right text-teal-800 font-medium text-sm">
               — {result.sample.author}
             </footer>
          </blockquote>
          <p className="text-sm text-slate-600 leading-relaxed">
            {result.sample.explanation}
          </p>
        </section>
      </div>

      <div className="text-center mt-8">
        <button
          onClick={onReset}
          className="bg-slate-600 text-white px-8 py-4 rounded-full text-lg shadow-lg hover:bg-slate-700 transition-colors flex items-center justify-center mx-auto gap-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.707-10.293a1 1 0 00-1.414-1.414l-3 3a1 1 0 000 1.414l3 3a1 1 0 001.414-1.414L9.414 11H13a1 1 0 100-2H9.414l1.293-1.293z" clipRule="evenodd" />
          </svg>
          続けて別の短歌を詠む
        </button>
      </div>

    </div>
  );
};

export default EvaluationResult;