import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import type { Question } from '../types';

export const XP_MAP: Record<string, number> = { easy: 10, medium: 15, hard: 20 };

// Cache 
let cachedQuestions: Question[] | null = null;

export async function fetchQuestions(): Promise<Question[]> {
  if (cachedQuestions) return cachedQuestions;
  const snap = await getDocs(collection(db, 'questions'));
  cachedQuestions = snap.docs.map(d => ({ id: d.id, ...d.data() } as Question));
  return cachedQuestions;
}

export function getRandomQuestions(allQuestions: Question[], subjects: string[], count = 10): Question[] {
  const pool = allQuestions.filter(q =>
    subjects.length === 0 || subjects.includes(q.subject)
  );
  return [...pool].sort(() => Math.random() - 0.5).slice(0, Math.min(count, pool.length));
}

export function calculateStreak(lastActiveDate: string, currentStreak: number): number {
  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
  if (lastActiveDate === today) return currentStreak;
  if (lastActiveDate === yesterday) return currentStreak + 1;
  return 1;
}

export function calculateLevel(totalXp: number): number {
  return Math.floor(totalXp / 500) + 1;
}