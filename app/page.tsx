'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getUser, saveUser, getCurrentSession } from '@/lib/storage';
import { User, UserType } from '@/lib/types';

export default function Home() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [userType, setUserType] = useState<UserType>('student');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [session, setSession] = useState<{ name: string; date: string } | null>(null);

  useEffect(() => {
    const user = getUser();
    setCurrentUser(user);
    
    const sessionData = getCurrentSession();
    setSession(sessionData);
  }, []);

  const handleStart = () => {
    if (!name.trim()) {
      alert('名前を入力してください');
      return;
    }

    const user: User = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: name.trim(),
      type: userType,
      createdAt: new Date().toISOString(),
    };

    saveUser(user);
    setCurrentUser(user);
  };

  const handleLogout = () => {
    if (confirm('ログアウトしますか?')) {
      setCurrentUser(null);
      setName('');
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* ウェルカムセクション */}
      <div className="bg-white rounded-2xl shadow-xl p-8 mb-8 border-t-4 border-red-600">
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">🏔️</div>
          <h2 className="text-3xl font-bold text-gray-800 mb-2">
            見て、考えて、動く力を伸ばそう!
          </h2>
        </div>

        {/* ログインフォーム or ユーザー情報 */}
        {!currentUser ? (
          <div className="max-w-md mx-auto space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                名前を入力してください
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="例: たくや"
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none text-lg"
                maxLength={20}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                あなたは?
              </label>
              <div className="flex space-x-4">
                <button
                  onClick={() => setUserType('student')}
                  className={`flex-1 py-3 px-4 rounded-lg border-2 transition-all ${
                    userType === 'student'
                      ? 'bg-blue-500 text-white border-blue-500'
                      : 'bg-white text-gray-700 border-gray-300 hover:border-blue-300'
                  }`}
                >
                  🧒 小学生
                </button>
                <button
                  onClick={() => setUserType('adult')}
                  className={`flex-1 py-3 px-4 rounded-lg border-2 transition-all ${
                    userType === 'adult'
                      ? 'bg-blue-500 text-white border-blue-500'
                      : 'bg-white text-gray-700 border-gray-300 hover:border-blue-300'
                  }`}
                >
                  👨‍🏫 指導者/保護者
                </button>
              </div>
            </div>

            <button
              onClick={handleStart}
              className="w-full bg-gradient-to-r from-red-600 to-red-500 text-white py-4 px-6 rounded-lg font-bold text-lg hover:from-red-700 hover:to-red-600 transition-all shadow-lg hover:shadow-xl"
            >
              スタート! 🚀
            </button>
          </div>
        ) : (
          <div className="max-w-md mx-auto text-center space-y-4">
            <div className="bg-green-50 border-2 border-green-300 rounded-lg p-4">
              <p className="text-sm text-green-700 mb-1">ようこそ!</p>
              <p className="text-2xl font-bold text-green-800">{currentUser.name}</p>
              <p className="text-xs text-green-600 mt-1">
                {currentUser.type === 'student' ? '🧒 小学生' : '👨‍🏫 指導者/保護者'}
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="text-sm text-gray-500 hover:text-gray-700 underline"
            >
              別の名前でログイン
            </button>
          </div>
        )}
      </div>

      {/* トレーニングメニュー */}
      {currentUser && (
        <>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {/* シンプル反応モード */}
          <button
            onClick={() => router.push('/simple')}
            className="bg-white rounded-xl shadow-lg p-6 hover:shadow-2xl transition-all border-2 border-transparent hover:border-blue-500 text-left group"
          >
            <div className="text-4xl mb-3">📱</div>
            <h3 className="text-xl font-bold text-gray-800 mb-2 group-hover:text-blue-600">
              シンプル反応
            </h3>
            <p className="text-sm text-gray-600 mb-3">
              シグナルに反応する速さを測定
            </p>
            <div className="flex items-center space-x-2">
              <span className="bg-red-100 text-red-700 px-2 py-1 rounded text-xs">認知</span>
              <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs">行動</span>
            </div>
          </button>

          {/* カラー判断モード */}
          <button
            onClick={() => router.push('/color')}
            className="bg-white rounded-xl shadow-lg p-6 hover:shadow-2xl transition-all border-2 border-transparent hover:border-blue-500 text-left group"
          >
            <div className="text-4xl mb-3">🎨</div>
            <h3 className="text-xl font-bold text-gray-800 mb-2 group-hover:text-blue-600">
              カラー判断
            </h3>
            <p className="text-sm text-gray-600 mb-3">
              色を見分けて素早く判断
            </p>
            <div className="flex items-center space-x-2">
              <span className="bg-red-100 text-red-700 px-2 py-1 rounded text-xs">認知</span>
              <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs">判断</span>
              <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs">行動</span>
            </div>
          </button>

          {/* デュアルタスクモード */}
          <button
            onClick={() => router.push('/dual')}
            className="bg-white rounded-xl shadow-lg p-6 hover:shadow-2xl transition-all border-2 border-transparent hover:border-purple-500 text-left group"
          >
            <div className="text-4xl mb-3">🧠</div>
            <h3 className="text-xl font-bold text-gray-800 mb-2 group-hover:text-purple-600">
              デュアルタスク
            </h3>
            <p className="text-sm text-gray-600 mb-3">
              色判断+数字記憶の二重課題
            </p>
            <div className="flex items-center space-x-2">
              <span className="bg-red-100 text-red-700 px-2 py-1 rounded text-xs">認知</span>
              <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs">判断</span>
              <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs">行動</span>
              <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded text-xs font-bold">NEW!</span>
            </div>
          </button>

        </div>

        {/* ランキングエリア */}
        <div className="bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-2xl shadow-xl p-8 mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-2xl font-bold text-gray-800 flex items-center">
                🏆 ランキング
              </h3>
              <p className="text-sm text-gray-700 mt-1">
                みんなの記録を見て、目標を立てよう！
              </p>
            </div>
            <button
              onClick={() => router.push('/ranking')}
              className="bg-white text-yellow-700 px-6 py-3 rounded-lg font-bold hover:bg-yellow-50 transition-all shadow-md hover:shadow-lg flex items-center space-x-2"
            >
              <span>ランキングを見る</span>
              <span>→</span>
            </button>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="bg-white bg-opacity-50 rounded-xl p-4 text-center">
              <div className="text-3xl mb-2">🥇</div>
              <p className="text-sm font-bold text-gray-700">シンプル反応</p>
              <p className="text-xs text-gray-600">反応速度TOP記録</p>
            </div>
            <div className="bg-white bg-opacity-50 rounded-xl p-4 text-center">
              <div className="text-3xl mb-2">🥈</div>
              <p className="text-sm font-bold text-gray-700">カラー判断</p>
              <p className="text-xs text-gray-600">正解率TOP記録</p>
            </div>
            <div className="bg-white bg-opacity-50 rounded-xl p-4 text-center">
              <div className="text-3xl mb-2">🥉</div>
              <p className="text-sm font-bold text-gray-700">デュアルタスク</p>
              <p className="text-xs text-gray-600">総合スコアTOP記録</p>
            </div>
          </div>
        </div>
        </>
      )}

      {/* 説明セクション */}
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl shadow-xl p-8 text-white mb-8">
        <h3 className="text-2xl font-bold mb-4">💡 このアプリでできること</h3>
        <div className="grid md:grid-cols-3 gap-6">
          <div>
            <div className="text-3xl mb-2">⚡</div>
            <h4 className="font-bold mb-2">反応速度を測る</h4>
            <p className="text-sm text-blue-100">
              シグナルへの反応時間を正確に測定
            </p>
          </div>
          <div>
            <div className="text-3xl mb-2">🏃‍♂️</div>
            <h4 className="font-bold mb-2">運動能力が向上する</h4>
            <p className="text-sm text-blue-100">
              反応速度の改善がスポーツパフォーマンス向上につながる!
            </p>
          </div>
          <div>
            <div className="text-3xl mb-2">📈</div>
            <h4 className="font-bold mb-2">成長を記録</h4>
            <p className="text-sm text-blue-100">
              毎日練習して自己ベストを更新しよう
            </p>
          </div>
        </div>
      </div>


    </div>
  );
}
