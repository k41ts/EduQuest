import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import type { Question } from '../types';
import { Trophy, Flame, Zap, Star } from 'lucide-react';

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

export const BADGE_DEFINITIONS = [
  {
    id: 'first_quest',
    label: 'Quest Pertama',
    desc: 'Selesaikan quest pertama',
    icon: Star,
    color: '#7F77DD',
    bg: '#EEEDFE',
    check: (xp: number) => xp > 0,
  },
  {
    id: 'streak_3',
    label: '3 Hari Streak',
    desc: 'Belajar 3 hari berturut',
    icon: Flame,
    color: '#EF9F27',
    bg: '#FAEEDA',
    check: (_xp: number, streak: number) => streak >= 3,
  },
  {
    id: 'streak_7',
    label: '7 Hari Streak',
    desc: 'Belajar 7 hari berturut',
    icon: Flame,
    color: '#D85A30',
    bg: '#FAECE7',
    check: (_xp: number, streak: number) => streak >= 7,
  },
  {
    id: 'level_5',
    label: 'Level 5',
    desc: 'Capai level 5',
    icon: Trophy,
    color: '#1D9E75',
    bg: '#E1F5EE',
    check: (_xp: number, _streak: number, level: number) => level >= 5,
  },
  {
    id: 'xp_500',
    label: '500 XP',
    desc: 'Kumpulkan 500 XP',
    icon: Zap,
    color: '#7F77DD',
    bg: '#EEEDFE',
    check: (xp: number) => xp >= 500,
  },
  {
    id: 'xp_1000',
    label: '1000 XP',
    desc: 'Kumpulkan 1000 XP',
    icon: Zap,
    color: '#26215C',
    bg: '#EEEDFE',
    check: (xp: number) => xp >= 1000,
  },
];

export function getNewlyEarnedBadges(
  xp: number,
  streak: number,
  level: number,
  currentBadges: string[]
): string[] {
  return BADGE_DEFINITIONS
    .filter(b => !currentBadges.includes(b.id) && b.check(xp, streak, level))
    .map(b => b.id);
}