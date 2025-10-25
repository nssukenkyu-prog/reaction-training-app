// 反応時間の評価ロジック
import { EvaluationResult } from './types';

// デュアルタスクスコアの評価
export const evaluateDualTaskScore = (score: number): EvaluationResult => {
  if (score >= 80) {
    return {
      emoji: '🧠',
      label: 'マルチタスクマスター!',
      message: '認知的負荷下でも完璧な判断力!',
      sprintImpact: '複雑な状況でも冷静な判断ができる',
    };
  } else if (score >= 60) {
    return {
      emoji: '🎯',
      label: 'バランス良好!',
      message: '二重課題をうまくこなしています!',
      sprintImpact: 'ピッチとフォーム、両方を意識できる',
    };
  } else if (score >= 40) {
    return {
      emoji: '💪',
      label: '成長中!',
      message: 'マルチタスク能力を鍛えましょう!',
      sprintImpact: '一つずつ確実に、そして複合的に',
    };
  } else {
    return {
      emoji: '🌱',
      label: 'チャレンジャー!',
      message: '継続練習で必ず上達します!',
      sprintImpact: 'まずは単一課題から慣れていこう',
    };
  }
};

export const evaluateReactionTime = (reactionTime: number): EvaluationResult => {
  if (reactionTime <= 150) {
    return {
      emoji: '⚡',
      label: '超人級!',
      message: 'オリンピック選手レベルの反応速度です!',
      sprintImpact: 'スタートダッシュで大きなアドバンテージ!',
    };
  } else if (reactionTime <= 200) {
    return {
      emoji: '🔥',
      label: '素晴らしい!',
      message: 'トップアスリート並みの反応です!',
      sprintImpact: '理想的なスタート反応時間です',
    };
  } else if (reactionTime <= 250) {
    return {
      emoji: '👍',
      label: '良い!',
      message: '良好な反応速度です。この調子!',
      sprintImpact: 'さらに磨けば0.1秒速くなります',
    };
  } else if (reactionTime <= 300) {
    return {
      emoji: '💪',
      label: '練習中!',
      message: '練習で必ず速くなります!',
      sprintImpact: '反応を0.05秒改善すれば50m走が速くなる',
    };
  } else {
    return {
      emoji: '🌱',
      label: 'これから!',
      message: 'まずは集中力を高めましょう!',
      sprintImpact: 'リラックスして練習を重ねよう',
    };
  }
};

// 50m走タイムへの影響計算
export const calculateSprintImpact = (reactionTime: number): {
  startAdvantage: number; // スタートでのアドバンテージ(秒)
  improvementPotential: number; // 改善できる可能性(秒)
} => {
  const idealReactionTime = 150; // 理想的な反応時間(ms)
  const startAdvantage = reactionTime / 1000; // ミリ秒を秒に変換
  const improvementPotential = Math.max(0, (reactionTime - idealReactionTime) / 1000);
  
  return {
    startAdvantage: Math.round(startAdvantage * 1000) / 1000,
    improvementPotential: Math.round(improvementPotential * 1000) / 1000,
  };
};

// 統計計算
export const calculateStats = (times: number[]) => {
  if (times.length === 0) return null;
  
  const average = times.reduce((a, b) => a + b, 0) / times.length;
  const fastest = Math.min(...times);
  const slowest = Math.max(...times);
  
  // 標準偏差(安定性)
  const variance = times.reduce((sum, time) => sum + Math.pow(time - average, 2), 0) / times.length;
  const stdDev = Math.sqrt(variance);
  
  return {
    average: Math.round(average),
    fastest,
    slowest,
    stdDev: Math.round(stdDev),
    consistency: stdDev < 20 ? '安定' : stdDev < 40 ? '普通' : '不安定',
  };
};
