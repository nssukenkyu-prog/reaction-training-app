// ローカルストレージ管理
import { User, Record, Session } from './types';

const STORAGE_KEYS = {
  USER: 'reaction-app-user',
  RECORDS: 'reaction-app-records',
  SESSION: 'reaction-app-session',
} as const;

// ユーザー管理
export const getUser = (): User | null => {
  if (typeof window === 'undefined') return null;
  const data = localStorage.getItem(STORAGE_KEYS.USER);
  return data ? JSON.parse(data) : null;
};

export const saveUser = (user: User): void => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
};

export const clearUser = (): void => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEYS.USER);
};

// 記録管理
export const getRecords = (): Record[] => {
  if (typeof window === 'undefined') return [];
  const data = localStorage.getItem(STORAGE_KEYS.RECORDS);
  return data ? JSON.parse(data) : [];
};

export const addRecord = (record: Omit<Record, 'id' | 'createdAt'>): Record => {
  const newRecord: Record = {
    ...record,
    id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    createdAt: new Date().toISOString(),
  };
  
  const records = getRecords();
  records.push(newRecord);
  
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEYS.RECORDS, JSON.stringify(records));
  }
  
  return newRecord;
};

export const getRecordsByUser = (userId: string): Record[] => {
  return getRecords().filter(r => r.userId === userId);
};

export const getRecordsByMode = (mode: string): Record[] => {
  return getRecords().filter(r => r.mode === mode);
};

export const getRecordsByModeType = (mode: ModeType): Record[] => {
  return getRecords().filter(r => r.mode === mode);
};

// セッション管理
export const getCurrentSession = (): Session => {
  if (typeof window === 'undefined') {
    return {
      id: 'local-session',
      name: '大田市講座',
      date: new Date().toISOString().split('T')[0],
    };
  }
  
  const data = localStorage.getItem(STORAGE_KEYS.SESSION);
  if (data) return JSON.parse(data);
  
  // デフォルトセッション
  const defaultSession: Session = {
    id: 'ota-city-2025',
    name: '島根県大田市 × 日本体育大学 特別講座',
    date: new Date().toISOString().split('T')[0],
  };
  
  localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(defaultSession));
  return defaultSession;
};

export const setSession = (session: Session): void => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(session));
};
