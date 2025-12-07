import React from 'react';

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AboutModal: React.FC<AboutModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm fade-in">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border-2 border-indigo-100">
        {/* Header */}
        <div className="bg-indigo-600 text-white p-6 sticky top-0 z-10 flex justify-between items-center">
          <h2 className="text-xl md:text-2xl font-bold font-serif tracking-wide">
            ようこそ「短歌評価AI」へ
          </h2>
          <button 
            onClick={onClose}
            className="text-indigo-100 hover:text-white transition-colors"
            aria-label="閉じる"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 md:p-8 space-y-8 text-slate-700 leading-relaxed">
          
          <section>
            <h3 className="text-lg font-bold text-indigo-700 mb-3 flex items-center gap-2 border-b border-indigo-100 pb-2">
              <span className="text-2xl">🖌️</span> このアプリについて
            </h3>
            <p>
              あなたの詠んだ短歌をAI（人工知能）が読み込み、良いところや改善のヒントを優しくアドバイスするアプリです。
              推敲（すいこう）のパートナーとして、あなたの創作活動にお役立てください。
            </p>
          </section>

          <section>
            <h3 className="text-lg font-bold text-indigo-700 mb-3 flex items-center gap-2 border-b border-indigo-100 pb-2">
              <span className="text-2xl">👣</span> 使い方は簡単です
            </h3>
            <ol className="list-decimal list-inside space-y-2 ml-2">
              <li>入力欄にあなたの短歌を入力（または貼り付け）してください。</li>
              <li>「この短歌を評価する」ボタンを押してください。</li>
              <li>10秒ほど待つと、評価結果とアドバイスが表示されます。</li>
            </ol>
          </section>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-5">
            <h3 className="text-amber-800 font-bold mb-3 flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              ご利用上の注意（免責事項）
            </h3>
            <ul className="list-disc list-inside space-y-2 text-sm text-amber-900">
              <li>AIの評価はあくまで参考です。正解を押し付けるものではありません。</li>
              <li>稀に事実と異なる内容や、不自然なアドバイスが表示される場合があります。</li>
              <li>個人情報（お名前、住所、電話番号など）は入力しないようご注意ください。</li>
              <li>入力された作品の著作権はあなたに帰属しますが、AIの学習データとして一時的に処理される可能性があります。</li>
            </ul>
          </div>

        </div>

        {/* Footer */}
        <div className="p-6 bg-slate-50 text-center border-t border-slate-200">
          <button
            onClick={onClose}
            className="bg-indigo-600 text-white px-8 py-3 rounded-full font-bold shadow-md hover:bg-indigo-700 hover:shadow-lg transition-all"
          >
            理解してはじめる
          </button>
        </div>
      </div>
    </div>
  );
};

export default AboutModal;
