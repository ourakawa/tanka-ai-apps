import React from 'react';

interface HeaderProps {
  onOpenAbout: () => void;
}

const Header: React.FC<HeaderProps> = ({ onOpenAbout }) => {
  return (
    <header className="bg-slate-800 text-white py-4 shadow-md border-b-4 border-indigo-300 relative z-20">
      <div className="container mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="text-center md:text-left">
          <h1 className="text-2xl md:text-3xl font-serif font-bold tracking-widest">
            短歌評価AI
          </h1>
          <p className="text-indigo-200 text-xs md:text-sm font-light mt-1">
            あなたの詠んだ歌を、優しく丁寧に添削いたします
          </p>
        </div>
        
        <button
          onClick={onOpenAbout}
          className="bg-indigo-500/30 hover:bg-indigo-500/50 text-indigo-100 hover:text-white px-4 py-2 rounded-full text-sm transition-colors flex items-center gap-2 border border-indigo-400/30"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          初めての方へ・使い方
        </button>
      </div>
    </header>
  );
};

export default Header;
