'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { getUser, addRecord } from '@/lib/storage';
import { evaluateReactionTime, calculateStats } from '@/lib/evaluation';
import { User } from '@/lib/types';

type GameState = 'intro' | 'ready' | 'playing' | 'complete';
type Color = 'green' | 'red' | 'blue' | 'yellow';

interface Trial {
  color: Color;
  shouldTap: boolean;
  userTapped: boolean;
  reactionTime?: number;
  correct: boolean;
}

export default function ColorPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [gameState, setGameState] = useState<GameState>('intro');
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('easy');
  const [trials, setTrials] = useState<Trial[]>([]);
  const [currentTrial, setCurrentTrial] = useState(0);
  const [currentColor, setCurrentColor] = useState<Color>('green');
  const [startTime, setStartTime] = useState(0);
  const [countdown, setCountdown] = useState(3);

  const totalTrials = 20;

  useEffect(() => {
    const currentUser = getUser();
    if (!currentUser) {
      router.push('/');
      return;
    }
    setUser(currentUser);
  }, [router]);

  const getRandomColor = useCallback((): Color => {
    const colors: Color[] = ['green', 'red'];
    if (difficulty === 'medium' || difficulty === 'hard') {
      colors.push('blue');
    }
    if (difficulty === 'hard') {
      colors.push('yellow');
    }
    return colors[Math.floor(Math.random() * colors.length)];
  }, [difficulty]);

  const startGame = useCallback(() => {
    setGameState('ready');
    setCountdown(3);
    setTrials([]);
    setCurrentTrial(0);

    const countdownInterval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(countdownInterval);
          startNextTrial();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  const startNextTrial = useCallback(() => {
    if (currentTrial >= totalTrials) {
      finishGame();
      return;
    }

    // 緑色が連続しないようにする
    let color: Color;
    do {
      color = getRandomColor();
    } while (color === 'green' && trials.length > 0 && trials[trials.length - 1].color === 'green');
    
    const shouldTap = color === 'green';

    setCurrentColor(color);
    setGameState('playing');
    setStartTime(Date.now());

    // 自動的に次のトライアルへ(3秒後、またはタップされたら)
    const timeout = setTimeout(() => {
      if (gameState === 'playing') {
        // タイムアウト(タップしなかった)
        const newTrial: Trial = {
          color,
          shouldTap,
          userTapped: false,
          correct: !shouldTap, // 緑でなければ正解、緑なら不正解
        };
        setTrials((prev) => [...prev, newTrial]);
        setCurrentTrial((prev) => prev + 1);
      }
    }, 3000);

    return () => clearTimeout(timeout);
  }, [currentTrial, getRandomColor, gameState]);

  useEffect(() => {
    if (gameState === 'playing') {
      const cleanup = startNextTrial();
      return cleanup;
    }
  }, [currentTrial, gameState]);

  const handleTap = useCallback(() => {
    if (gameState !== 'playing') return;

    const reactionTime = Date.now() - startTime;
    const shouldTap = currentColor === 'green';
    const correct = shouldTap;

    const newTrial: Trial = {
      color: currentColor,
      shouldTap,
      userTapped: true,
      reactionTime: correct ? reactionTime : undefined,
      correct,
    };

    setTrials((prev) => [...prev, newTrial]);
    setCurrentTrial((prev) => prev + 1);
  }, [gameState, startTime, currentColor]);

  const finishGame = useCallback(() => {
    setGameState('complete');

    if (user && trials.length > 0) {
      const correctTrials = trials.filter((t) => t.correct);
      const reactionTimes = correctTrials
        .filter((t) => t.reactionTime !== undefined)
        .map((t) => t.reactionTime!);

      const accuracy = (correctTrials.length / trials.length) * 100;
      const avgTime = reactionTimes.length > 0
        ? reactionTimes.reduce((a, b) => a + b, 0) / reactionTimes.length
        : 0;

      const score = Math.round((accuracy / 100) * 50 + (avgTime > 0 ? Math.max(0, 50 - avgTime / 10) : 0));

      addRecord({
        userId: user.id,
        userName: user.name,
        mode: 'color',
        reactionTime: Math.round(avgTime),
        accuracy: Math.round(accuracy),
        score,
      });
    }
  }, [user, trials]);

  const resetGame = () => {
    setGameState('intro');
    setTrials([]);
    setCurrentTrial(0);
  };

  const getColorClass = (color: Color) => {
    switch (color) {
      case 'green': return 'bg-green-500';
      case 'red': return 'bg-red-500';
      case 'blue': return 'bg-blue-500';
      case 'yellow': return 'bg-yellow-400';
    }
  };

  const getColorName = (color: Color) => {
    switch (color) {
      case 'green': return '緑';
      case 'red': return '赤';
      case 'blue': return '青';
      case 'yellow': return '黄';
    }
  };

  const stats = trials.length > 0 ? {
    correct: trials.filter((t) => t.correct).length,
    total: trials.length,
    accuracy: Math.round((trials.filter((t) => t.correct).length / trials.length) * 100),
    avgTime: (() => {
      const times = trials.filter((t) => t.correct && t.reactionTime).map((t) => t.reactionTime!);
      return times.length > 0 ? Math.round(times.reduce((a, b) => a + b, 0) / times.length) : 0;
    })(),
  } : null;

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
                🎨 カラー判断モード
              </h1>
              <p className="text-sm text-gray-600">
                緑色だけタップ!それ以外は触らない!
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">プレイヤー</p>
              <p className="text-lg font-bold text-gray-800">{user.name}</p>
            </div>
          </div>
          {gameState === 'playing' && (
            <div className="mt-4">
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>進行状況</span>
                <span>{currentTrial + 1} / {totalTrials}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-blue-500 h-3 rounded-full transition-all"
                  style={{ width: `${((currentTrial + 1) / totalTrials) * 100}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ゲームエリア */}
      <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
        {gameState === 'intro' && (
          <div className="p-12 text-center">
            <div className="text-6xl mb-6">🎨</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              カラー判断テスト
            </h2>
            <div className="mb-8 space-y-3 text-left max-w-md mx-auto bg-blue-50 p-6 rounded-lg">
              <h3 className="font-bold text-blue-900 mb-3">📖 ルール説明</h3>
              <p className="text-sm text-gray-700">
                <span className="font-bold">1.</span> 色が表示されます
              </p>
              <p className="text-sm text-gray-700">
                <span className="font-bold">2.</span> 🟢 <span className="font-bold text-green-600">緑色</span>なら素早くタップ!
              </p>
              <p className="text-sm text-gray-700">
                <span className="font-bold">3.</span> 🔴 それ以外の色は<span className="font-bold text-red-600">触らない!</span>
              </p>
              <p className="text-sm text-gray-700">
                <span className="font-bold">4.</span> 全20問チャレンジ
              </p>
            </div>

            <div className="mb-8">
              <h3 className="font-bold text-gray-800 mb-4">難易度を選ぶ</h3>
              <div className="grid grid-cols-3 gap-4 max-w-md mx-auto">
                <button
                  onClick={() => setDifficulty('easy')}
                  className={`py-4 px-4 rounded-lg font-semibold transition-all ${
                    difficulty === 'easy'
                      ? 'bg-green-500 text-white shadow-lg'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  🌟 初級<br/>
                  <span className="text-xs">緑/赤</span>
                </button>
                <button
                  onClick={() => setDifficulty('medium')}
                  className={`py-4 px-4 rounded-lg font-semibold transition-all ${
                    difficulty === 'medium'
                      ? 'bg-blue-500 text-white shadow-lg'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  ⭐⭐ 中級<br/>
                  <span className="text-xs">緑/赤/青</span>
                </button>
                <button
                  onClick={() => setDifficulty('hard')}
                  className={`py-4 px-4 rounded-lg font-semibold transition-all ${
                    difficulty === 'hard'
                      ? 'bg-purple-500 text-white shadow-lg'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  ⭐⭐⭐ 上級<br/>
                  <span className="text-xs">4色</span>
                </button>
              </div>
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

        {gameState === 'playing' && (
          <button
            onClick={handleTap}
            className={`w-full h-96 ${getColorClass(currentColor)} hover:opacity-90 transition-opacity flex items-center justify-center cursor-pointer`}
          >
            <div className="text-center">
              <div className="text-9xl mb-4">●</div>
              <p className="text-4xl text-white font-bold">{getColorName(currentColor)}</p>
            </div>
          </button>
        )}

        {gameState === 'complete' && stats && (
          <div className="p-8">
            <div className="text-center mb-8">
              <div className="text-6xl mb-4">
                {stats.accuracy >= 90 ? '🏆' : stats.accuracy >= 70 ? '🎉' : '💪'}
              </div>
              <h2 className="text-3xl font-bold text-gray-800 mb-2">
                テスト完了!
              </h2>
              <p className="text-gray-600">
                {stats.accuracy >= 90 ? '完璧です!' : stats.accuracy >= 70 ? '素晴らしい!' : '練習しよう!'}
              </p>
            </div>

            {/* スコア */}
            <div className="grid md:grid-cols-2 gap-4 mb-8">
              <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white">
                <p className="text-sm opacity-80 mb-1">正解率</p>
                <p className="text-5xl font-bold">{stats.accuracy}<span className="text-2xl">%</span></p>
                <p className="text-sm mt-2">{stats.correct} / {stats.total} 問正解</p>
              </div>
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white">
                <p className="text-sm opacity-80 mb-1">平均反応時間</p>
                <p className="text-5xl font-bold">{stats.avgTime}<span className="text-2xl">ms</span></p>
                <p className="text-sm mt-2">(正解のみ)</p>
              </div>
            </div>

            {/* 詳細結果 */}
            <div className="bg-gray-50 rounded-xl p-6 mb-8">
              <h3 className="font-bold text-gray-800 mb-4">📊 詳細結果</h3>
              <div className="grid grid-cols-5 gap-2">
                {trials.map((trial, index) => (
                  <div
                    key={index}
                    className={`aspect-square rounded-lg flex items-center justify-center text-xs font-bold ${
                      trial.correct
                        ? 'bg-green-200 text-green-800'
                        : 'bg-red-200 text-red-800'
                    }`}
                    title={`${index + 1}問目: ${getColorName(trial.color)} ${trial.correct ? '正解' : '不正解'}`}
                  >
                    {trial.correct ? '○' : '×'}
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
