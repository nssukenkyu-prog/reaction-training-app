'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { getUser, addRecord } from '@/lib/storage';
import { evaluateReactionTime, calculateStats } from '@/lib/evaluation';
import { User } from '@/lib/types';

type GameState = 'intro' | 'ready' | 'set' | 'go' | 'result' | 'complete';

export default function SprintPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [gameState, setGameState] = useState<GameState>('intro');
  const [reactionTimes, setReactionTimes] = useState<number[]>([]);
  const [currentTrial, setCurrentTrial] = useState(0);
  const [startTime, setStartTime] = useState(0);
  const [falseStart, setFalseStart] = useState(false);

  const totalTrials = 5;

  useEffect(() => {
    const currentUser = getUser();
    if (!currentUser) {
      router.push('/');
      return;
    }
    setUser(currentUser);
  }, [router]);

  const startGame = useCallback(() => {
    setGameState('ready');
    setTimeout(() => {
      startTrial();
    }, 2000);
  }, []);

  const startTrial = useCallback(() => {
    setGameState('ready');
    setFalseStart(false);

    // 「位置について」
    setTimeout(() => {
      setGameState('set');

      // 「ヨーイ」→「ドン!」(ランダム1-3秒)
      const setTime = 1000 + Math.random() * 2000;
      setTimeout(() => {
        setStartTime(Date.now());
        setGameState('go');
        
        // ピストン音を鳴らす(音声がある場合)
        playStartSound();
      }, setTime);
    }, 1500);
  }, []);

  const playStartSound = () => {
    // 将来的に音声ファイルを追加
    // const audio = new Audio('/sounds/pistol.mp3');
    // audio.play();
  };

  const handleTap = useCallback(() => {
    if (gameState === 'ready' || gameState === 'set') {
      // フライング
      setFalseStart(true);
      setGameState('result');
      
      setTimeout(() => {
        if (currentTrial < totalTrials - 1) {
          setCurrentTrial((prev) => prev + 1);
          startTrial();
        } else {
          finishGame();
        }
      }, 2500);
      return;
    }

    if (gameState === 'go') {
      const reactionTime = Date.now() - startTime;
      
      // フライング判定(100ms以内は不自然)
      if (reactionTime < 100) {
        setFalseStart(true);
        setGameState('result');
        
        setTimeout(() => {
          if (currentTrial < totalTrials - 1) {
            setCurrentTrial((prev) => prev + 1);
            startTrial();
          } else {
            finishGame();
          }
        }, 2500);
        return;
      }

      const newTimes = [...reactionTimes, reactionTime];
      setReactionTimes(newTimes);
      setGameState('result');

      setTimeout(() => {
        if (currentTrial < totalTrials - 1) {
          setCurrentTrial((prev) => prev + 1);
          startTrial();
        } else {
          finishGame();
        }
      }, 2000);
    }
  }, [gameState, startTime, reactionTimes, currentTrial]);

  const finishGame = useCallback(() => {
    setGameState('complete');

    if (user && reactionTimes.length > 0) {
      const stats = calculateStats(reactionTimes);
      if (stats) {
        addRecord({
          userId: user.id,
          userName: user.name,
          mode: 'sprint',
          reactionTime: stats.average,
        });
      }
    }
  }, [user, reactionTimes]);

  const resetGame = () => {
    setGameState('intro');
    setReactionTimes([]);
    setCurrentTrial(0);
    setFalseStart(false);
  };

  const stats = reactionTimes.length > 0 ? calculateStats(reactionTimes) : null;
  const evaluation = stats ? evaluateReactionTime(stats.average) : null;

  if (!user) return null;

  return (
    <div className="max-w-2xl mx-auto">
      {/* ヘッダー */}
      <div className="mb-6">
        <button
          onClick={() => router.push('/')}
          className="text-blue-600 hover:text-blue-700 flex items-center mb-4"
        >
          ← トップに戻る
        </button>
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-800 mb-1">
                🏃 スタートダッシュモード
              </h1>
              <p className="text-sm text-gray-600">
                陸上競技のスタート練習!
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">プレイヤー</p>
              <p className="text-lg font-bold text-gray-800">{user.name}</p>
            </div>
          </div>
          {gameState !== 'intro' && gameState !== 'complete' && (
            <div className="mt-4 flex items-center justify-center space-x-2">
              {Array.from({ length: totalTrials }).map((_, i) => (
                <div
                  key={i}
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                    i < currentTrial
                      ? 'bg-green-500 text-white'
                      : i === currentTrial
                      ? 'bg-blue-500 text-white animate-pulse'
                      : 'bg-gray-200 text-gray-400'
                  }`}
                >
                  {i + 1}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ゲームエリア */}
      <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
        {gameState === 'intro' && (
          <div className="p-12 text-center">
            <div className="text-6xl mb-6">🏃‍♂️</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              スタートダッシュ練習
            </h2>
            <div className="mb-8 space-y-3 text-left max-w-md mx-auto bg-blue-50 p-6 rounded-lg">
              <h3 className="font-bold text-blue-900 mb-3">📖 ルール説明</h3>
              <p className="text-sm text-gray-700">
                <span className="font-bold">1.</span> 陸上競技のスタートをシミュレーション
              </p>
              <p className="text-sm text-gray-700">
                <span className="font-bold">2.</span> 「位置について」→「ヨーイ」→<span className="text-red-600 font-bold">「ドン!」</span>
              </p>
              <p className="text-sm text-gray-700">
                <span className="font-bold">3.</span> ピストン音が鳴ったら素早くタップ!
              </p>
              <p className="text-sm text-red-600 font-bold">
                ⚠️ 音が鳴る前にタップするとフライング失格!
              </p>
              <p className="text-xs text-gray-500 mt-2">
                ※本物のスタート音声で臨場感たっぷり!
              </p>
            </div>
            <button
              onClick={startGame}
              className="bg-gradient-to-r from-red-500 to-red-600 text-white px-12 py-4 rounded-full text-xl font-bold hover:from-red-600 hover:to-red-700 transition-all shadow-lg hover:shadow-xl"
            >
              スタート! 🚀
            </button>
          </div>
        )}

        {gameState === 'ready' && (
          <button
            onClick={handleTap}
            className="w-full h-96 bg-blue-500 hover:bg-blue-600 transition-colors flex items-center justify-center cursor-pointer"
          >
            <div className="text-center">
              <div className="text-5xl text-white font-bold mb-4">位置について</div>
              <p className="text-white text-lg">画面に集中...</p>
            </div>
          </button>
        )}

        {gameState === 'set' && (
          <button
            onClick={handleTap}
            className="w-full h-96 bg-yellow-500 hover:bg-yellow-600 transition-colors flex items-center justify-center cursor-pointer"
          >
            <div className="text-center">
              <div className="text-6xl text-white font-bold mb-4">ヨーイ...</div>
              <p className="text-white text-lg">待て...</p>
            </div>
          </button>
        )}

        {gameState === 'go' && (
          <button
            onClick={handleTap}
            className="w-full h-96 bg-red-600 hover:bg-red-700 transition-colors flex items-center justify-center cursor-pointer animate-pulse"
          >
            <div className="text-center">
              <div className="text-8xl mb-6">🔫</div>
              <div className="text-7xl text-white font-bold mb-4">ドン!</div>
              <p className="text-white text-2xl">タップ!</p>
            </div>
          </button>
        )}

        {gameState === 'result' && !falseStart && reactionTimes.length > 0 && (
          <div className="h-96 flex items-center justify-center bg-gradient-to-br from-green-500 to-green-600">
            <div className="text-center text-white">
              <div className="text-6xl mb-4">
                {evaluateReactionTime(reactionTimes[reactionTimes.length - 1]).emoji}
              </div>
              <div className="text-7xl font-bold mb-4">
                {reactionTimes[reactionTimes.length - 1]}
                <span className="text-3xl">ms</span>
              </div>
              <div className="text-2xl font-bold">
                {evaluateReactionTime(reactionTimes[reactionTimes.length - 1]).label}
              </div>
              <p className="text-sm mt-2 opacity-90">スタート反応時間</p>
            </div>
          </div>
        )}

        {falseStart && (
          <div className="h-96 flex items-center justify-center bg-black">
            <div className="text-center text-white">
              <div className="text-6xl mb-4">❌</div>
              <div className="text-5xl font-bold mb-4 text-red-500">フライング!</div>
              <p className="text-xl">失格です</p>
              <p className="text-sm mt-4 opacity-80">
                スタート音が鳴る前にタップしました
              </p>
            </div>
          </div>
        )}

        {gameState === 'complete' && stats && evaluation && (
          <div className="p-8">
            <div className="text-center mb-8">
              <div className="text-6xl mb-4">{evaluation.emoji}</div>
              <h2 className="text-3xl font-bold text-gray-800 mb-2">
                練習完了!
              </h2>
              <p className="text-gray-600">{evaluation.message}</p>
            </div>

            {/* 統計 */}
            <div className="grid md:grid-cols-3 gap-4 mb-8">
              <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-xl p-6 text-white">
                <p className="text-sm opacity-80 mb-1">平均反応時間</p>
                <p className="text-4xl font-bold">{stats.average}<span className="text-xl">ms</span></p>
              </div>
              <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white">
                <p className="text-sm opacity-80 mb-1">最速スタート</p>
                <p className="text-4xl font-bold">{stats.fastest}<span className="text-xl">ms</span></p>
              </div>
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white">
                <p className="text-sm opacity-80 mb-1">安定性</p>
                <p className="text-2xl font-bold">{stats.consistency}</p>
                <p className="text-xs opacity-80">±{stats.stdDev}ms</p>
              </div>
            </div>

            {/* スプリント分析 */}
            <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-orange-300 rounded-xl p-6 mb-8">
              <h3 className="font-bold text-orange-900 mb-3 flex items-center text-lg">
                🏃‍♂️ スプリント分析
              </h3>
              <div className="space-y-3">
                <div className="bg-white rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-1">スタートでのロス時間</p>
                  <p className="text-2xl font-bold text-gray-800">
                    約 {(stats.average / 1000).toFixed(3)} 秒
                  </p>
                </div>
                {stats.average > 150 && (
                  <div className="bg-white rounded-lg p-4">
                    <p className="text-sm text-gray-600 mb-1">改善ポテンシャル</p>
                    <p className="text-lg text-gray-800">
                      理想値(150ms)まで改善すれば<br/>
                      <span className="text-red-600 font-bold text-2xl">
                        {((stats.average - 150) / 1000).toFixed(3)}秒
                      </span> 速くなる!
                    </p>
                  </div>
                )}
                <div className="bg-blue-50 rounded-lg p-4">
                  <p className="text-xs text-blue-800 font-bold mb-2">💡 改善のヒント</p>
                  <ul className="text-xs text-blue-900 space-y-1">
                    <li>• ピストン音に全神経を集中</li>
                    <li>• リラックスした状態で構える</li>
                    <li>• 音が鳴る瞬間を「予測」せずに「反応」する</li>
                    <li>• 毎日練習すれば必ず速くなる!</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* 記録グラフ */}
            <div className="bg-gray-50 rounded-xl p-6 mb-8">
              <h3 className="font-bold text-gray-800 mb-4">📊 各回の記録</h3>
              <div className="space-y-2">
                {reactionTimes.map((time, index) => (
                  <div key={index} className="flex items-center">
                    <span className="w-16 text-sm text-gray-600">第{index + 1}回</span>
                    <div className="flex-1 bg-white rounded-full h-8 overflow-hidden relative">
                      <div
                        className={`h-full flex items-center justify-end px-3 text-white text-sm font-bold transition-all ${
                          time <= 150 ? 'bg-green-500' : time <= 200 ? 'bg-blue-500' : 'bg-orange-500'
                        }`}
                        style={{ width: `${Math.min((time / 400) * 100, 100)}%` }}
                      >
                        {time}ms
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* アクションボタン */}
            <div className="flex space-x-4">
              <button
                onClick={resetGame}
                className="flex-1 bg-gradient-to-r from-red-500 to-red-600 text-white py-4 rounded-xl font-bold hover:from-red-600 hover:to-red-700 transition-all"
              >
                もう一度練習 🔄
              </button>
              <button
                onClick={() => router.push('/ranking')}
                className="flex-1 bg-gradient-to-r from-yellow-500 to-yellow-600 text-white py-4 rounded-xl font-bold hover:from-yellow-600 hover:to-yellow-700 transition-all"
              >
                ランキングを見る 🏆
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
