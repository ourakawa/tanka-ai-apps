
import React, { useState, useEffect } from 'react';
import { AdminData, AccessLog } from '../types';

interface AdminDashboardProps {
  onBack: () => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ onBack }) => {
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [data, setData] = useState<AdminData | null>(null);
  const [newNgWord, setNewNgWord] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // ログイン＆データ取得
  const handleLogin = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/evaluate', {
        method: 'GET',
        headers: {
          'x-admin-password': password
        }
      });

      if (response.status === 401) {
        throw new Error("パスワードが間違っています");
      }
      if (!response.ok) {
        throw new Error("データ取得エラー");
      }

      const adminData = await response.json();
      setData(adminData);
      setIsAuthenticated(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // NGワード追加
  const handleAddNgWord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNgWord.trim() || !data) return;

    const updatedNgWords = [...data.ngWords, newNgWord.trim()];
    await updateSettings(updatedNgWords);
    setNewNgWord('');
  };

  // NGワード削除
  const handleDeleteNgWord = async (wordToDelete: string) => {
    if (!data) return;
    const updatedNgWords = data.ngWords.filter(w => w !== wordToDelete);
    await updateSettings(updatedNgWords);
  };

  // 設定更新API呼び出し
  const updateSettings = async (ngWords: string[]) => {
    setLoading(true);
    try {
      const response = await fetch('/api/evaluate', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-password': password
        },
        body: JSON.stringify({ ngWords })
      });

      if (!response.ok) throw new Error("更新失敗");
      
      const result = await response.json();
      if (data) {
        setData({ ...data, ngWords: result.ngWords });
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // データ定期更新 (ログイン中のみ)
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isAuthenticated) {
      interval = setInterval(() => {
        handleLogin();
      }, 10000); // 10秒ごとにログ更新
    }
    return () => clearInterval(interval);
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="bg-white p-8 rounded-xl shadow-lg border border-slate-200 w-full max-w-md">
          <h2 className="text-xl font-bold text-slate-800 mb-6 text-center">管理者ログイン</h2>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">パスワード</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-indigo-200 outline-none"
                placeholder="パスワードを入力"
              />
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-slate-800 text-white py-2 rounded hover:bg-slate-700 transition-colors"
            >
              ログイン
            </button>
          </form>
          <button onClick={onBack} className="mt-4 text-slate-500 text-sm w-full text-center hover:underline">
            トップへ戻る
          </button>
        </div>
        <p className="mt-4 text-xs text-slate-400">初期パスワード: admin123</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto pb-12">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-slate-800">管理者ダッシュボード</h2>
        <button onClick={onBack} className="text-slate-600 hover:text-slate-800 underline">
          ログアウトして戻る
        </button>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* 左カラム：NGワード管理 */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <h3 className="text-lg font-bold text-slate-700 mb-4 flex items-center gap-2">
              <span>🚫</span> NGワード設定
            </h3>
            <div className="mb-4">
              <form onSubmit={handleAddNgWord} className="flex gap-2">
                <input
                  type="text"
                  value={newNgWord}
                  onChange={(e) => setNewNgWord(e.target.value)}
                  className="flex-1 p-2 border border-slate-300 rounded text-sm"
                  placeholder="禁止用語を追加"
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-indigo-600 text-white px-3 py-2 rounded text-sm hover:bg-indigo-700"
                >
                  追加
                </button>
              </form>
            </div>
            <div className="flex flex-wrap gap-2">
              {data?.ngWords.map((word, idx) => (
                <span key={idx} className="bg-red-50 text-red-700 px-3 py-1 rounded-full text-sm flex items-center gap-2 border border-red-100">
                  {word}
                  <button
                    onClick={() => handleDeleteNgWord(word)}
                    className="text-red-400 hover:text-red-900 font-bold"
                  >
                    ×
                  </button>
                </span>
              ))}
              {data?.ngWords.length === 0 && <span className="text-slate-400 text-sm">設定なし</span>}
            </div>
          </div>
        </div>

        {/* 右カラム：アクセスログ */}
        <div className="lg:col-span-2">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <h3 className="text-lg font-bold text-slate-700 mb-4 flex justify-between items-center">
              <span className="flex items-center gap-2"><span>📊</span> アクセスログ (直近30件)</span>
              <button onClick={() => handleLogin()} className="text-sm text-indigo-600 hover:underline">
                更新
              </button>
            </h3>
            
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b">
                  <tr>
                    <th className="px-4 py-3">日時/Ver</th>
                    <th className="px-4 py-3">ステータス/モデル</th>
                    <th className="px-4 py-3">入力テキスト</th>
                    <th className="px-4 py-3">IP</th>
                  </tr>
                </thead>
                <tbody>
                  {data?.logs.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-8 text-center text-slate-400">ログはありません</td>
                    </tr>
                  ) : (
                    data?.logs.map((log) => (
                      <tr key={log.id} className="border-b hover:bg-slate-50">
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="font-medium text-slate-800">
                            {new Date(log.timestamp).toLocaleString('ja-JP')}
                          </div>
                          <div className="text-xs text-slate-400">Ver: {log.appVersion}</div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className={`px-2 py-1 rounded-full text-xs font-bold 
                            ${log.status === 'SUCCESS' ? 'bg-emerald-100 text-emerald-700' : 
                              log.status === 'BLOCKED' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'}`}>
                            {log.status}
                          </span>
                          <div className="text-xs text-slate-500 mt-1">{log.model}</div>
                        </td>
                        <td className="px-4 py-3 max-w-xs truncate" title={log.text}>
                          {log.text}
                        </td>
                        <td className="px-4 py-3 text-slate-400 text-xs font-mono">
                          {log.ip}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <p className="mt-4 text-xs text-slate-400 text-right">
              ※サーバーレス環境のため、サーバー再起動時にログはリセットされます。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
