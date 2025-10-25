'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getUser, getRecords, getCurrentSession } from '@/lib/storage';
import { User, Record } from '@/lib/types';

type ModeFilter = 'all' | 'simple' | 'color' | 'sprint' | 'dual';
type TypeFilter = 'all' | 'student' | 'adult';

export default function RankingPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [records, setRecords] = useState<Record[]>([]);
  const [modeFilter, setModeFilter] = useState<ModeFilter>('simple');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [session, setSession] = useState<{ name: string; date: string } | null>(null);

  useEffect(() => {
    const currentUser = getUser();
    setUser(currentUser);
    
    const allRecords = getRecords();
    setRecords(allRecords);
    
    const sessionData = getCurrentSession();
    setSession(sessionData);
  }, []);

  // フィルタリングとソート
  const filteredRecords = records
    .filter((record) => {
      if (modeFilter !== 'all' && record.mode !== modeFilter) return false;
      // typeFilterは将来の拡張用(ユーザータイプを記録に含める必要あり)
      return true;
    })
    .sort((a, b) => a.reactionTime - b.reactionTime)
    .slice(0, 50); // トップ50まで

  // ユーザーの順位を見つける
  const userRank = user
    ? filteredRecords.findIndex((r) => r.userId === user.id) + 1
    : 0;

  const userBestRecord = user
    ? filteredRecords.find((r) => r.userId === user.id)
    : null;

  const getMedalEmoji = (rank: number) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `${rank}位`;
  };

  const getEvaluationEmoji = (time: number) => {
    if (time <= 150) return '⚡';
    if (time <= 200) return '🔥';
    if (time <= 250) return '👍';
    if (time <= 300) return '💪';
    return '🌱';
  };

  const getModeName = (mode: string) => {
    switch (mode) {
      case 'simple': return 'シンプル反応';
      case 'color': return 'カラー判断';
      case 'sprint': return 'スタートダッシュ';
      case 'dual': return 'デュアルタスク';
      default: return mode;
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* ヘッダー */}
      <div className="mb-6">
        <button
          onClick={() => router.push('/')}
          className="text-blue-600 hover:text-blue-700 flex items-center mb-4"
        >
          ← トップに戻る
        </button>
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="text-center">
            <div className="text-5xl mb-3">🏆</div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">ランキング</h1>
            {session && (
              <p className="text-sm text-gray-600">{session.name}</p>
            )}
          </div>
        </div>
      </div>

      {/* ユーザーの記録 */}
      {user && userBestRecord && (
        <div className="bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-xl shadow-lg p-6 mb-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-80 mb-1">あなたの順位</p>
              <p className="text-4xl font-bold">{getMedalEmoji(userRank)}</p>
            </div>
            <div className="text-right">
              <p className="text-sm opacity-80 mb-1">ベスト記録</p>
              <p className="text-4xl font-bold">
                {userBestRecord.reactionTime}
                <span className="text-xl">ms</span>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* フィルター */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
        <h3 className="font-bold text-gray-800 mb-4">📊 モード選択</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <button
            onClick={() => setModeFilter('simple')}
            className={`py-3 px-4 rounded-lg font-semibold transition-all ${
              modeFilter === 'simple'
                ? 'bg-blue-500 text-white shadow-lg'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            📱 シンプル
          </button>
          <button
            onClick={() => setModeFilter('color')}
            className={`py-3 px-4 rounded-lg font-semibold transition-all ${
              modeFilter === 'color'
                ? 'bg-blue-500 text-white shadow-lg'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            🎨 カラー
          </button>
          <button
            onClick={() => setModeFilter('sprint')}
            className={`py-3 px-4 rounded-lg font-semibold transition-all ${
              modeFilter === 'sprint'
                ? 'bg-blue-500 text-white shadow-lg'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            🏃 スプリント
          </button>
          <button
            onClick={() => setModeFilter('dual')}
            className={`py-3 px-4 rounded-lg font-semibold transition-all ${
              modeFilter === 'dual'
                ? 'bg-purple-500 text-white shadow-lg'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            🧠 デュアル
          </button>
          <button
            onClick={() => setModeFilter('all')}
            className={`py-3 px-4 rounded-lg font-semibold transition-all ${
              modeFilter === 'all'
                ? 'bg-blue-500 text-white shadow-lg'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            📋 全て
          </button>
        </div>
      </div>

      {/* ランキングリスト */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4">
          <h2 className="text-xl font-bold">
            {getModeName(modeFilter)} - トップ50
          </h2>
          <p className="text-sm opacity-80 mt-1">
            全{filteredRecords.length}件の記録
          </p>
        </div>

        {filteredRecords.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <div className="text-5xl mb-4">📝</div>
            <p className="text-lg">まだ記録がありません</p>
            <p className="text-sm mt-2">最初にチャレンジしてみよう!</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredRecords.map((record, index) => {
              const rank = index + 1;
              const isCurrentUser = user && record.userId === user.id;

              return (
                <div
                  key={record.id}
                  className={`p-4 flex items-center space-x-4 transition-all hover:bg-gray-50 ${
                    isCurrentUser ? 'bg-yellow-50 border-l-4 border-yellow-500' : ''
                  }`}
                >
                  {/* 順位 */}
                  <div className="w-16 text-center">
                    {rank <= 3 ? (
                      <span className="text-3xl">{getMedalEmoji(rank)}</span>
                    ) : (
                      <span className="text-lg font-bold text-gray-600">{rank}</span>
                    )}
                  </div>

                  {/* 名前 */}
                  <div className="flex-1">
                    <p className={`font-bold ${isCurrentUser ? 'text-yellow-700' : 'text-gray-800'}`}>
                      {record.userName}
                      {isCurrentUser && (
                        <span className="ml-2 text-xs bg-yellow-500 text-white px-2 py-1 rounded">
                          あなた
                        </span>
                      )}
                    </p>
                    {modeFilter === 'all' && (
                      <p className="text-xs text-gray-500">{getModeName(record.mode)}</p>
                    )}
                  </div>

                  {/* 評価 */}
                  <div className="text-2xl">
                    {getEvaluationEmoji(record.reactionTime)}
                  </div>

                  {/* 記録 */}
                  <div className="text-right">
                    <p className="text-2xl font-bold text-gray-800">
                      {record.reactionTime}
                      <span className="text-sm text-gray-500 ml-1">ms</span>
                    </p>
                    {record.accuracy !== undefined && (
                      <p className="text-xs text-gray-500">正確率: {record.accuracy}%</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 統計情報 */}
      {filteredRecords.length > 0 && (
        <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl shadow-lg p-6 mt-6 text-white">
          <h3 className="font-bold mb-4">📈 全体統計</h3>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-sm opacity-80">参加者数</p>
              <p className="text-2xl font-bold">
                {new Set(filteredRecords.map(r => r.userId)).size}人
              </p>
            </div>
            <div>
              <p className="text-sm opacity-80">平均タイム</p>
              <p className="text-2xl font-bold">
                {Math.round(
                  filteredRecords.reduce((sum, r) => sum + r.reactionTime, 0) /
                    filteredRecords.length
                )}
                <span className="text-sm">ms</span>
              </p>
            </div>
            <div>
              <p className="text-sm opacity-80">最速記録</p>
              <p className="text-2xl font-bold">
                {filteredRecords[0]?.reactionTime || 0}
                <span className="text-sm">ms</span>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* アクションボタン */}
      <div className="mt-6 flex space-x-4">
        <button
          onClick={() => router.push('/simple')}
          className="flex-1 bg-gradient-to-r from-green-500 to-green-600 text-white py-4 rounded-xl font-bold hover:from-green-600 hover:to-green-700 transition-all"
        >
          チャレンジする 🚀
        </button>
      </div>
    </div>
  );
}
