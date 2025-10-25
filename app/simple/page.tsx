'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { getUser, addRecord, getRecordsByUser } from '@/lib/storage';
import { evaluateReactionTime, calculateSprintImpact, calculateStats } from '@/lib/evaluation';
import { User } from '@/lib/types';

type GameState = 'intro' | 'ready' | 'waiting' | 'go' | 'result' | 'complete';

export default function SimplePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [gameState, setGameState] = useState<GameState>('intro');
  const [reactionTimes, setReactionTimes] = useState<number[]>([]);
  const [currentTrial, setCurrentTrial] = useState(0);
  const [startTime, setStartTime] = useState(0);
  const [tooEarly, setTooEarly] = useState(false);
  const [countdown, setCountdown] = useState(3);

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
    setCountdown(3);
    
    // カウントダウン
    const countdownInterval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(countdownInterval);
          startTrial();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  const startTrial = useCallback(() => {
    setGameState('waiting');
    setTooEarly(false);
    
    // ランダムな待機時間(2-5秒)
    const waitTime = 2000 + Math.random() * 3000;
    
    setTimeout(() => {
      setStartTime(Date.now());
      setGameState('go');
    }, waitTime);
  }, []);

  const handleTap = useCallback(() => {
    if (gameState === 'waiting') {
      // お手つき
      setTooEarly(true);
      setTimeout(() => {
        if (currentTrial < totalTrials - 1) {
          setCurrentTrial((prev) => prev + 1);
          startTrial();
        } else {
          finishGame();
        }
      }, 2000);
      return;
    }

    if (gameState === 'go') {
      const reactionTime = Date.now() - startTime;
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
    
    // 記録を保存
    if (user && reactionTimes.length > 0) {
      const stats = calculateStats(reactionTimes);
      if (stats) {
        addRecord({
          userId: user.id,
          userName: user.name,
          mode: 'simple',
          reactionTime: stats.average,
        });
      }
    }
  }, [user, reactionTimes]);

  const resetGame = () => {
    setGameState('intro');
    setReactionTimes([]);
    setCurrentTrial(0);
    setTooEarly(false);
  };

  const stats = reactionTimes.length > 0 ? calculateStats(reactionTimes) : null;
  const evaluation = stats ? evaluateReactionTime(stats.average) : null;
  const sprintImpact = stats ? calculateSprintImpact(stats.average) : null;

  if (!user) {
    return null;
  }

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
                📱 シンプル反応モード
              </h1>
              <p className="text-sm text-gray-600">
                緑色に変わったら素早くタップ!
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
            <div className="text-6xl mb-6">⚡</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              反応速度テスト
            </h2>
            <div className="mb-8 space-y-3 text-left max-w-md mx-auto bg-blue-50 p-6 rounded-lg">
              <h3 className="font-bold text-blue-900 mb-3">📖 ルール説明</h3>
              <p className="text-sm text-gray-700">
                <span className="font-bold">1.</span> 灰色の画面が表示されます
              </p>
              <p className="text-sm text-gray-700">
                <span className="font-bold">2.</span> ランダムなタイミングで緑色に変わります
              </p>
              <p className="text-sm text-gray-700">
                <span className="font-bold">3.</span> 緑色になったら素早くタップ!
              </p>
              <p className="text-sm text-red-600 font-bold">
                ⚠️ フライング(早すぎるタップ)は失格!
              </p>
            </div>
            <button
              onClick={startGame}
              className="bg-gradient-to-r from-green-500 to-green-600 text-white px-12 py-4 rounded-full text-xl font-bold hover:from-green-600 hover:to-green-700 transition-all shadow-lg hover:shadow-xl"
            >
              スタート! 🚀
            </button>
          </div>
        )}

        {gameState === 'ready' && (
          <div className="h-96 flex items-center justify-center bg-yellow-400">
            <div className="text-center">
              <div className="text-9xl font-bold text-white mb-4 animate-bounce">
                {countdown}
              </div>
              <p className="text-2xl text-white font-bold">準備...</p>
            </div>
          </div>
        )}

        {gameState === 'waiting' && (
          <button
            onClick={handleTap}
            className="w-full h-96 bg-gray-400 hover:bg-gray-500 transition-colors flex items-center justify-center cursor-pointer"
          >
            <div className="text-center">
              <div className="text-4xl text-white font-bold">待て...</div>
              <p className="text-white mt-4">緑色になるまで待って!</p>
            </div>
          </button>
        )}

        {gameState === 'go' && (
          <button
            onClick={handleTap}
            className="w-full h-96 bg-green-500 hover:bg-green-600 transition-colors flex items-center justify-center cursor-pointer animate-pulse"
          >
            <div className="text-center">
              <div className="text-6xl text-white font-bold mb-4">タップ!</div>
              <div className="text-9xl">👆</div>
            </div>
          </button>
        )}

        {gameState === 'result' && !tooEarly && reactionTimes.length > 0 && (
          <div className="h-96 flex items-center justify-center bg-gradient-to-br from-blue-500 to-blue-600">
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
            </div>
          </div>
        )}

        {tooEarly && (
          <div className="h-96 flex items-center justify-center bg-red-500">
            <div className="text-center text-white">
              <div className="text-6xl mb-4">❌</div>
              <div className="text-4xl font-bold mb-2">フライング!</div>
              <p className="text-xl">緑色になる前にタップしました</p>
            </div>
          </div>
        )}

        {gameState === 'complete' && stats && evaluation && sprintImpact && (
          <div className="p-8">
            <div className="text-center mb-8">
              <div className="text-6xl mb-4">{evaluation.emoji}</div>
              <h2 className="text-3xl font-bold text-gray-800 mb-2">
                テスト完了!
              </h2>
              <p className="text-gray-600">{evaluation.message}</p>
            </div>

            {/* 統計 */}
            <div className="grid md:grid-cols-3 gap-4 mb-8">
              <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white">
                <p className="text-sm opacity-80 mb-1">平均反応時間</p>
                <p className="text-4xl font-bold">{stats.average}<span className="text-xl">ms</span></p>
              </div>
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white">
                <p className="text-sm opacity-80 mb-1">最速記録</p>
                <p className="text-4xl font-bold">{stats.fastest}<span className="text-xl">ms</span></p>
              </div>
              <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white">
                <p className="text-sm opacity-80 mb-1">安定性</p>
                <p className="text-2xl font-bold">{stats.consistency}</p>
                <p className="text-xs opacity-80">標準偏差: {stats.stdDev}ms</p>
              </div>
            </div>

            {/* 50m走への影響 */}
            <div className="bg-yellow-50 border-2 border-yellow-300 rounded-xl p-6 mb-8">
              <h3 className="font-bold text-yellow-900 mb-3 flex items-center">
                🏃‍♂️ 50m走への影響
              </h3>
              <p className="text-sm text-gray-700 mb-2">
                <span className="font-bold">スタートでのロス:</span> 約{sprintImpact.startAdvantage}秒
              </p>
              {sprintImpact.improvementPotential > 0 && (
                <p className="text-sm text-gray-700">
                  <span className="font-bold">改善の余地:</span> 反応時間を理想値(150ms)まで改善すれば、
                  <span className="text-red-600 font-bold"> {sprintImpact.improvementPotential}秒 </span>
                  速くなる可能性!
                </p>
              )}
              <p className="text-xs text-gray-500 mt-3">{evaluation.sprintImpact}</p>
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
                          time <= 200 ? 'bg-green-500' : time <= 250 ? 'bg-blue-500' : 'bg-gray-400'
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
                className="flex-1 bg-gradient-to-r from-green-500 to-green-600 text-white py-4 rounded-xl font-bold hover:from-green-600 hover:to-green-700 transition-all"
              >
                もう一度チャレンジ 🔄
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
