'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { getUser, addRecord } from '@/lib/storage';
import { User } from '@/lib/types';

type GameState = 'intro' | 'ready' | 'playing' | 'complete';
type Color = 'green' | 'red' | 'blue' | 'yellow';

interface Trial {
  color: Color;
  number?: number;
  shouldTap: boolean;
  userTapped: boolean;
  reactionTime?: number;
  correct: boolean;
}

export default function DualPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [gameState, setGameState] = useState<GameState>('intro');
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('easy');
  const [trials, setTrials] = useState<Trial[]>([]);
  const [currentTrial, setCurrentTrial] = useState(0);
  const [currentColor, setCurrentColor] = useState<Color>('green');
  const [currentNumber, setCurrentNumber] = useState<number | null>(null);
  const [startTime, setStartTime] = useState(0);
  const [countdown, setCountdown] = useState(3);
  const [memoryNumbers, setMemoryNumbers] = useState<number[]>([]);
  const [showNumberInput, setShowNumberInput] = useState(false);
  const [userAnswer, setUserAnswer] = useState('');

  const totalTrials = difficulty === 'easy' ? 15 : difficulty === 'medium' ? 20 : 25;

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

  const getRandomNumber = useCallback((): number => {
    return Math.floor(Math.random() * 9) + 1; // 1-9の数字
  }, []);

  const startGame = useCallback(() => {
    setGameState('ready');
    setCountdown(3);
    setTrials([]);
    setCurrentTrial(0);
    setMemoryNumbers([]);

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
      // ゲーム終了、数字の合計を答える
      setShowNumberInput(true);
      return;
    }

    // 緑色が連続しないようにする
    let color: Color;
    do {
      color = getRandomColor();
    } while (color === 'green' && trials.length > 0 && trials[trials.length - 1].color === 'green');
    
    const shouldTap = color === 'green';
    
    // 数字は30%の確率で表示
    const showNumber = Math.random() < 0.3;
    const number = showNumber ? getRandomNumber() : null;

    if (number) {
      setMemoryNumbers(prev => [...prev, number]);
    }

    setCurrentColor(color);
    setCurrentNumber(number);
    setGameState('playing');
    setStartTime(Date.now());

    // 3秒後に自動的に次のトライアルへ
    const timeout = setTimeout(() => {
      if (gameState === 'playing') {
        // タイムアウト(タップしなかった)
        const newTrial: Trial = {
          color,
          number,
          shouldTap,
          userTapped: false,
          correct: !shouldTap, // 緑でなければ正解
        };
        setTrials((prev) => [...prev, newTrial]);
        setCurrentTrial((prev) => prev + 1);
      }
    }, 3000);

    return () => clearTimeout(timeout);
  }, [currentTrial, getRandomColor, getRandomNumber, gameState, totalTrials]);

  useEffect(() => {
    if (gameState === 'playing' && !showNumberInput) {
      const cleanup = startNextTrial();
      return cleanup;
    }
  }, [currentTrial, gameState, showNumberInput]);

  const handleTap = useCallback(() => {
    if (gameState !== 'playing' || showNumberInput) return;

    const reactionTime = Date.now() - startTime;
    const shouldTap = currentColor === 'green';
    const correct = shouldTap;

    const newTrial: Trial = {
      color: currentColor,
      number: currentNumber,
      shouldTap,
      userTapped: true,
      reactionTime: correct ? reactionTime : undefined,
      correct,
    };

    setTrials((prev) => [...prev, newTrial]);
    setCurrentTrial((prev) => prev + 1);
  }, [gameState, startTime, currentColor, currentNumber, showNumberInput]);

  const handleNumberSubmit = () => {
    const correctSum = memoryNumbers.reduce((sum, num) => sum + num, 0);
    const userSum = parseInt(userAnswer) || 0;
    const memoryAccuracy = correctSum === userSum ? 100 : 0;

    finishGame(memoryAccuracy, correctSum, userSum);
  };

  const finishGame = useCallback((memoryAccuracy: number, correctSum: number, userSum: number) => {
    setGameState('complete');

    if (user && trials.length > 0) {
      const correctTrials = trials.filter((t) => t.correct);
      const reactionTimes = correctTrials
        .filter((t) => t.reactionTime !== undefined)
        .map((t) => t.reactionTime!);

      const colorAccuracy = (correctTrials.length / trials.length) * 100;
      const avgTime = reactionTimes.length > 0
        ? reactionTimes.reduce((a, b) => a + b, 0) / reactionTimes.length
        : 0;

      // デュアルタスクスコア: 色判断(50%) + 数字記憶(30%) + 反応速度(20%)
      const colorScore = (colorAccuracy / 100) * 50;
      const memoryScore = (memoryAccuracy / 100) * 30;
      const speedScore = avgTime > 0 ? Math.max(0, 20 - avgTime / 50) : 0;
      const totalScore = Math.round(colorScore + memoryScore + speedScore);

      addRecord({
        userId: user.id,
        userName: user.name,
        mode: 'dual',
        reactionTime: Math.round(avgTime),
        accuracy: Math.round((colorAccuracy + memoryAccuracy) / 2),
        score: totalScore,
      });
    }
  }, [user, trials]);

  const resetGame = () => {
    setGameState('intro');
    setTrials([]);
    setCurrentTrial(0);
    setMemoryNumbers([]);
    setShowNumberInput(false);
    setUserAnswer('');
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
    colorAccuracy: Math.round((trials.filter((t) => t.correct).length / trials.length) * 100),
    avgTime: (() => {
      const times = trials.filter((t) => t.correct && t.reactionTime).map((t) => t.reactionTime!);
      return times.length > 0 ? Math.round(times.reduce((a, b) => a + b, 0) / times.length) : 0;
    })(),
    memorySum: memoryNumbers.reduce((sum, num) => sum + num, 0),
    memoryCount: memoryNumbers.length,
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
                🧠 デュアルタスクモード
              </h1>
              <p className="text-sm text-gray-600">
                色判断 + 数字記憶の二重課題!
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">プレイヤー</p>
              <p className="text-lg font-bold text-gray-800">{user.name}</p>
            </div>
          </div>
          {gameState === 'playing' && !showNumberInput && (
            <div className="mt-4">
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>進行状況</span>
                <span>{currentTrial + 1} / {totalTrials}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-purple-500 h-3 rounded-full transition-all"
                  style={{ width: `${((currentTrial + 1) / totalTrials) * 100}%` }}
                />
              </div>
              <div className="mt-2 text-xs text-purple-600">
                記憶中の数字: {memoryNumbers.length}個
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ゲームエリア */}
      <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
        {gameState === 'intro' && (
          <div className="p-12 text-center">
            <div className="text-6xl mb-6">🧠</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              デュアルタスクテスト
            </h2>
            <div className="mb-8 space-y-3 text-left max-w-md mx-auto bg-purple-50 p-6 rounded-lg">
              <h3 className="font-bold text-purple-900 mb-3">📖 ルール説明</h3>
              <p className="text-sm text-gray-700">
                <span className="font-bold">課題A:</span> 🟢 <span className="text-green-600 font-bold">緑色だけタップ!</span>
              </p>
              <p className="text-sm text-gray-700">
                <span className="font-bold">課題B:</span> 📊 出てくる<span className="text-blue-600 font-bold">数字を記憶</span>
              </p>
              <p className="text-sm text-gray-700">
                <span className="font-bold">最後に:</span> 記憶した数字の<span className="text-red-600 font-bold">合計を答える</span>
              </p>
              <div className="bg-yellow-100 p-3 rounded-lg mt-4">
                <p className="text-xs text-yellow-800 font-bold">💡 例</p>
                <p className="text-xs text-yellow-900">
                  緑+3→タップ&記憶, 赤+5→無視&記憶, 緑→タップ<br/>
                  最後に「3+5=8」と答える
                </p>
              </div>
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
                  <span className="text-xs">15問・2色</span>
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
                  <span className="text-xs">20問・3色</span>
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
                  <span className="text-xs">25問・4色</span>
                </button>
              </div>
            </div>

            <button
              onClick={startGame}
              className="bg-gradient-to-r from-purple-500 to-purple-600 text-white px-12 py-4 rounded-full text-xl font-bold hover:from-purple-600 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl"
            >
              チャレンジ開始! 🚀
            </button>
          </div>
        )}

        {gameState === 'ready' && (
          <div className="h-96 flex items-center justify-center bg-purple-400">
            <div className="text-center">
              <div className="text-9xl font-bold text-white mb-4 animate-bounce">
                {countdown}
              </div>
              <p className="text-2xl text-white font-bold">準備...</p>
              <p className="text-white mt-2">緑色をタップ & 数字を記憶!</p>
            </div>
          </div>
        )}

        {gameState === 'playing' && !showNumberInput && (
          <button
            onClick={handleTap}
            className={`w-full h-96 ${getColorClass(currentColor)} hover:opacity-90 transition-opacity flex items-center justify-center cursor-pointer`}
          >
            <div className="text-center">
              <div className="text-9xl mb-4">●</div>
              {currentNumber && (
                <div className="text-8xl font-bold text-white mb-4 animate-pulse border-4 border-white rounded-full w-32 h-32 mx-auto flex items-center justify-center">
                  {currentNumber}
                </div>
              )}
              <p className="text-4xl text-white font-bold">{getColorName(currentColor)}</p>
            </div>
          </button>
        )}

        {showNumberInput && (
          <div className="p-12 text-center">
            <div className="text-6xl mb-6">🧮</div>
            <h2 className="text-3xl font-bold text-gray-800 mb-4">
              数字の合計を答えてください
            </h2>
            <div className="mb-6">
              <p className="text-lg text-gray-600 mb-4">
                トレーニング中に表示された数字を、
              </p>
              <p className="text-lg text-gray-600">
                記憶していますか？合計を答えてください。
              </p>
            </div>
            <div className="max-w-md mx-auto mb-8">
              <input
                type="number"
                value={userAnswer}
                onChange={(e) => setUserAnswer(e.target.value)}
                placeholder="合計を入力"
                className="w-full px-6 py-4 border-2 border-purple-300 rounded-xl focus:border-purple-500 focus:outline-none text-2xl text-center"
                autoFocus
              />
            </div>
            <button
              onClick={handleNumberSubmit}
              className="bg-gradient-to-r from-purple-500 to-purple-600 text-white px-12 py-4 rounded-full text-xl font-bold hover:from-purple-600 hover:to-purple-700 transition-all"
            >
              答える! ✅
            </button>
          </div>
        )}

        {gameState === 'complete' && stats && (
          <div className="p-8">
            <div className="text-center mb-8">
              <div className="text-6xl mb-4">🎯</div>
              <h2 className="text-3xl font-bold text-gray-800 mb-2">
                デュアルタスク完了!
              </h2>
              <p className="text-gray-600">認知的負荷下での判断力測定</p>
            </div>

            {/* 結果サマリー */}
            <div className="grid md:grid-cols-3 gap-4 mb-8">
              <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white">
                <p className="text-sm opacity-80 mb-1">色判断正解率</p>
                <p className="text-4xl font-bold">{stats.colorAccuracy}<span className="text-xl">%</span></p>
                <p className="text-sm mt-1">{stats.correct} / {stats.total} 正解</p>
              </div>
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white">
                <p className="text-sm opacity-80 mb-1">数字記憶</p>
                <p className="text-4xl font-bold">{parseInt(userAnswer) || 0}</p>
                <p className="text-sm mt-1">正解: {stats.memorySum}</p>
              </div>
              <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white">
                <p className="text-sm opacity-80 mb-1">平均反応時間</p>
                <p className="text-4xl font-bold">{stats.avgTime}<span className="text-xl">ms</span></p>
                <p className="text-sm mt-1">(正解のみ)</p>
              </div>
            </div>

            {/* デュアルタスク分析 */}
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 border-2 border-purple-300 rounded-xl p-6 mb-8">
              <h3 className="font-bold text-purple-900 mb-3 flex items-center text-lg">
                🧠 デュアルタスク分析
              </h3>
              <div className="space-y-3">
                <div className="bg-white rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-1">認知的負荷耐性</p>
                  <p className="text-lg text-gray-800">
                    {stats.colorAccuracy >= 80 && (parseInt(userAnswer) === stats.memorySum) ? 
                      '🏆 エクセレント! 両方の課題を高いレベルで達成' :
                      stats.colorAccuracy >= 70 ?
                      '👍 良好! さらなる向上の余地あり' :
                      '💪 練習でもっと上達できます'
                    }
                  </p>
                </div>
                <div className="bg-white rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-1">スプリントへの応用</p>
                  <ul className="text-sm text-gray-700 space-y-1">
                    <li>• ピッチを数えながらフォーム意識</li>
                    <li>• 周りを見ながら自分のペース管理</li>
                    <li>• 複数の情報を同時処理する能力向上</li>
                  </ul>
                </div>
                <div className="bg-blue-50 rounded-lg p-4">
                  <p className="text-xs text-blue-800 font-bold mb-2">💡 改善のヒント</p>
                  <ul className="text-xs text-blue-900 space-y-1">
                    <li>• 色判断に集中しすぎて数字を忘れがち→バランス意識</li>
                    <li>• 数字に気を取られて色判断ミス→優先順位を決める</li>
                    <li>• 毎日短時間でも継続練習→マルチタスク能力向上</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* 詳細結果 */}
            <div className="bg-gray-50 rounded-xl p-6 mb-8">
              <h3 className="font-bold text-gray-800 mb-4">📊 詳細結果</h3>
              <div className="grid grid-cols-10 gap-1 mb-4">
                {trials.map((trial, index) => (
                  <div
                    key={index}
                    className={`aspect-square rounded flex items-center justify-center text-xs font-bold relative ${
                      trial.correct
                        ? 'bg-green-200 text-green-800'
                        : 'bg-red-200 text-red-800'
                    }`}
                    title={`${index + 1}問目: ${getColorName(trial.color)} ${trial.correct ? '正解' : '不正解'}${trial.number ? ` (数字: ${trial.number})` : ''}`}
                  >
                    {trial.correct ? '○' : '×'}
                    {trial.number && (
                      <div className="absolute -top-1 -right-1 bg-blue-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-xs">
                        {trial.number}
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-500">
                青い丸の数字は記憶すべき数字
              </p>
            </div>

            {/* アクションボタン */}
            <div className="flex space-x-4">
              <button
                onClick={resetGame}
                className="flex-1 bg-gradient-to-r from-purple-500 to-purple-600 text-white py-4 rounded-xl font-bold hover:from-purple-600 hover:to-purple-700 transition-all"
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