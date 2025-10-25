// 型定義
export type UserType = 'student' | 'adult';

export type ModeType = 'simple' | 'color' | 'sprint' | 'dual';

export interface User {
  id: string;
  name: string;
  type: UserType;
  createdAt: string;
}

export interface Record {
  id: string;
  userId: string;
  userName: string;
  mode: ModeType;
  reactionTime: number; // ミリ秒
  accuracy?: number; // 0-100
  score?: number;
  sleepHours?: number;
  createdAt: string;
}

export interface Session {
  id: string;
  name: string;
  date: string;
}

export interface RankingEntry {
  rank: number;
  userName: string;
  reactionTime: number;
  isCurrentUser?: boolean;
}

export interface EvaluationResult {
  emoji: string;
  label: string;
  message: string;
  sprintImpact: string; // 50m走への影響
}
