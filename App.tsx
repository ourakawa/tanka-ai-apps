
import React, { useState, useCallback, useEffect } from 'react';
import Header from './components/Header';
import Footer from './components/Footer';
import TankaInput from './components/TankaInput';
import LoadingScreen from './components/LoadingScreen';
import EvaluationResult from './components/EvaluationResult';
import AboutModal from './components/AboutModal';
import AdminDashboard from './components/AdminDashboard'; // ★追加
import { evaluateTanka } from './services/geminiService';
import { AppState, EvaluationResult as EvaluationResultType } from './types';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const [result, setResult] = useState<EvaluationResultType | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isAboutOpen, setIsAboutOpen] = useState(false);

  // URLハッシュチェック（#adminで管理画面へ）
  useEffect(() => {
    const handleHashChange = () => {
      if (window.location.hash === '#admin') {
        setAppState(AppState.ADMIN);
      } else if (appState === AppState.ADMIN) {
        setAppState(AppState.IDLE);
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    // 初期チェック
    handleHashChange();
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [appState]);

  const handleAnalyze = useCallback(async (text: string) => {
    setAppState(AppState.ANALYZING);
    setErrorMsg(null);
    
    try {
      const evaluation = await evaluateTanka(text);
      setResult(evaluation);
      setAppState(AppState.RESULT);
    } catch (err: any) {
      console.error(err);
      setAppState(AppState.ERROR);
      setErrorMsg(
        err.message || "予期せぬエラーが発生しました。しばらくしてからもう一度お試しください。"
      );
    }
  }, []);

  const handleReset = useCallback(() => {
    setAppState(AppState.IDLE);
    setResult(null);
    setErrorMsg(null);
  }, []);

  // ★管理画面から戻る
  const handleAdminBack = () => {
    window.location.hash = '';
    setAppState(AppState.IDLE);
  };

  // ★管理画面モード
  if (appState === AppState.ADMIN) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-100 text-slate-800">
        <header className="bg-slate-900 text-white py-4 px-6 shadow-md">
           <h1 className="font-bold text-xl">短歌AI 管理システム</h1>
        </header>
        <main className="flex-grow container mx-auto px-4 py-8">
           <AdminDashboard onBack={handleAdminBack} />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#fdfcf8] text-slate-800">
      <Header onOpenAbout={() => setIsAboutOpen(true)} />
      
      <main className="flex-grow container mx-auto px-4 py-8 md:py-12 relative z-10">
        {/* Error Notification */}
        {appState === AppState.ERROR && (
          <div className="max-w-2xl mx-auto mb-8 bg-red-50 border-l-4 border-red-500 p-4 rounded shadow-sm">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">エラーが発生しました</h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{errorMsg}</p>
                </div>
                <div className="mt-4">
                  <button
                    type="button"
                    onClick={handleReset}
                    className="text-sm font-medium text-red-800 hover:text-red-900 underline"
                  >
                    もう一度試す
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Main Content Switcher */}
        {appState === AppState.IDLE && (
          <div className="fade-in">
             <div className="max-w-3xl mx-auto text-center mb-10">
               <h2 className="text-2xl md:text-3xl font-bold text-slate-700 mb-4">
                 あなたの心の一首を、<br className="md:hidden" />もっと輝かせませんか？
               </h2>
               <p className="text-lg text-slate-600 leading-relaxed mb-6">
                 短歌評価AIは、あなたの作品の「リズム」「表現」「独創性」を分析し、
                 より良い歌にするためのアドバイスを優しく提案します。
               </p>
               <button 
                 onClick={() => setIsAboutOpen(true)}
                 className="text-indigo-600 underline hover:text-indigo-800 text-sm md:text-base"
               >
                 初めての方はこちらをご覧ください
               </button>
             </div>
             <TankaInput onAnalyze={handleAnalyze} isLoading={false} />
          </div>
        )}

        {appState === AppState.ANALYZING && (
          <LoadingScreen />
        )}

        {appState === AppState.RESULT && result && (
          <div className="fade-in">
            <EvaluationResult result={result} onReset={handleReset} />
          </div>
        )}
      </main>

      <Footer />
      
      <AboutModal isOpen={isAboutOpen} onClose={() => setIsAboutOpen(false)} />
    </div>
  );
};

export default App;
