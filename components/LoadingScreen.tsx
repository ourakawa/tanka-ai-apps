import React, { useEffect, useState } from 'react';

const MESSAGES = [
  "短歌の心を読み解いています...",
  "リズムを確認しています...",
  "言葉の響きを味わっています...",
  "評価書を作成しています..."
];

const LoadingScreen: React.FC = () => {
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % MESSAGES.length);
    }, 1500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full py-20 flex flex-col items-center justify-center bg-white/50 rounded-xl backdrop-blur-sm">
      <div className="relative w-24 h-24 mb-8">
        <div className="absolute top-0 left-0 w-full h-full border-4 border-indigo-100 rounded-full"></div>
        <div className="absolute top-0 left-0 w-full h-full border-4 border-indigo-500 rounded-full border-t-transparent animate-spin"></div>
      </div>
      <p className="text-xl md:text-2xl text-slate-700 font-serif font-bold animate-pulse">
        {MESSAGES[messageIndex]}
      </p>
      <p className="mt-4 text-slate-500 text-sm">少々お待ちください</p>
    </div>
  );
};

export default LoadingScreen;