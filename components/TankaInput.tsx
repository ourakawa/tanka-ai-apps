
import React, { useState } from 'react';

interface TankaInputProps {
  onAnalyze: (text: string) => void;
  isLoading: boolean;
}

const TankaInput: React.FC<TankaInputProps> = ({ onAnalyze, isLoading }) => {
  const [text, setText] = useState('');
  const MAX_CHARS = 50;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // 文字数制限チェック
    if (text.length > MAX_CHARS) {
      alert("ご利用ありがとうございます。\n文字数は50文字以内にしてください");
      return;
    }

    if (text.trim().length > 0) {
      onAnalyze(text);
    }
  };

  const isOverLimit = text.length > MAX_CHARS;

  return (
    <div className="w-full max-w-2xl mx-auto bg-white p-6 md:p-8 rounded-xl shadow-lg border border-slate-200">
      <h2 className="text-xl md:text-2xl font-bold text-slate-700 mb-6 text-center border-b pb-4 border-slate-100">
        短歌を入力してください
      </h2>
      
      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <div className="relative">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={'例：\n春の夜の夢ばかりなる手枕に\nかひなく立たむ名こそ惜しけれ'}
            className={`w-full h-48 p-4 text-lg md:text-xl border-2 rounded-lg focus:outline-none resize-none font-serif leading-loose placeholder-slate-300 text-slate-800 transition-all
              ${isOverLimit 
                ? 'border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-200' 
                : 'border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200'
              }
            `}
            disabled={isLoading}
            aria-label="短歌入力欄"
          />
          <div className={`absolute bottom-4 right-4 text-sm font-bold ${isOverLimit ? 'text-red-500' : 'text-slate-400'}`}>
            {text.length} / {MAX_CHARS} 文字
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading || text.trim().length === 0}
          className={`
            w-full py-4 rounded-lg text-lg md:text-xl font-bold tracking-wider shadow-md transition-all
            ${isLoading || text.trim().length === 0
              ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
              : 'bg-indigo-600 text-white hover:bg-indigo-700 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 active:shadow-sm'
            }
          `}
        >
          {isLoading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              評価中...
            </span>
          ) : (
            'この短歌を評価する'
          )}
        </button>
      </form>
      
      <p className="mt-4 text-center text-slate-500 text-sm">
        ※ 入力された短歌はAIが分析します。個人的な秘密を含む内容はご注意ください。
      </p>
    </div>
  );
};

export default TankaInput;
