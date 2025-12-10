
import React from 'react';

const Footer: React.FC = () => {
  const APP_VERSION = "v1.1.0"; // クライアントバージョン

  return (
    <footer className="bg-slate-100 py-8 mt-auto border-t border-slate-200">
      <div className="container mx-auto px-4 text-center text-slate-500 text-sm">
        <p className="mb-2 font-bold text-slate-600">短歌評価AIアドバイザー</p>
        <p className="mb-4">&copy; {new Date().getFullYear()} Tanka Evaluation AI. All rights reserved.</p>
        <div className="max-w-xl mx-auto text-xs text-slate-400 border-t border-slate-200 pt-4 px-4 leading-relaxed">
          <p className="mb-1">
            【免責事項】
          </p>
          <p>
            本アプリはAI（人工知能）技術を用いて短歌の評価を行いますが、その結果の正確性や芸術的価値を保証するものではありません。
            あくまで創作の参考としてご利用ください。
            また、入力されたテキストはAI処理のためにGoogleのサーバーへ送信されますが、
            個人情報の入力はお控えください。
          </p>
          <div className="mt-4 text-center text-slate-300 font-mono">
            Client {APP_VERSION}
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
