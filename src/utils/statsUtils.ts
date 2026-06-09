import { auth, db } from '../firebase';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import type { Question, UserProfile } from '../types';
import { calculateStreak } from './questUtils';

interface UpdateMockStatsParams {
  questions: Question[];
  answers: (number | null)[];
  timeTaken: number;
}

interface UpdateQuestStatsParams {
  uid: string;
  profile: UserProfile;
  questions: Question[];
  answers: (number | null)[];
  xpEarned: number;
  newXp: number;
  newLevel: number;
  newStreak: number;
}

interface XpProgress {
  current: number;
  total: number;
  pct: number;
  remaining: number;
}

interface SubjectStat {
  subject: string;
  correct: number;
  total: number;
  accuracy: number;
  xp: number;
}

interface FocusArea {
  subject: string;
  accuracy: number;
  total: number;
  reason: string;
}

interface DailyQuestStats {
  sessions: number;
  totalXp: number;
  totalQuestions: number;
  correct: number;
  accuracy: number;
  bestSessionXp: number;
}

interface MockTestStats {
  sessions: number;
  averageScore: number;
  bestScore: number;
  averageTime: number;
  lastScore: number;
}

interface UserStatsDoc {
  userId: string;
  generatedAt: string;
  totalXp: number;
  level: number;
  streak: number;
  targetMajor: string;
  activeSubjects: string[];
  lastActiveDate: string;
  xpProgress: XpProgress;
  dailyQuest: DailyQuestStats;
  mockTest: MockTestStats;
  subjects: SubjectStat[];
  focusAreas: FocusArea[];
}

interface ActivityDoc {
  userId: string;
  date: string;
  xp: number;
  questSessions: number;
  mockSessions: number;
  correct: number;
  total: number;
  accuracy: number;
}

function todayString() {
  return new Date().toISOString().split('T')[0];
}

function calculateLevel(totalXp: number) {
  return Math.floor(totalXp / 500) + 1;
}

function getXpProgress(level: number, xp: number): XpProgress {
  const xpPerLevel = Math.max(level, 1) * 500;
  const current = xp % xpPerLevel;

  return {
    current,
    total: xpPerLevel,
    pct: Math.min((current / xpPerLevel) * 100, 100),
    remaining: xpPerLevel - current,
  };
}

function countCorrect(questions: Question[], answers: (number | null)[]) {
  return questions.filter((q, i) => answers[i] === q.correctIndex).length;
}

function calculateAccuracy(correct: number, total: number) {
  return total === 0 ? 0 : Math.round((correct / total) * 100);
}

function defaultUserStats(uid: string): UserStatsDoc {
  return {
    userId: uid,
    generatedAt: '',
    totalXp: 0,
    level: 1,
    streak: 0,
    targetMajor: '',
    activeSubjects: [],
    lastActiveDate: '',
    xpProgress: getXpProgress(1, 0),
    dailyQuest: {
      sessions: 0,
      totalXp: 0,
      totalQuestions: 0,
      correct: 0,
      accuracy: 0,
      bestSessionXp: 0,
    },
    mockTest: {
      sessions: 0,
      averageScore: 0,
      bestScore: 0,
      averageTime: 0,
      lastScore: 0,
    },
    subjects: [],
    focusAreas: [],
  };
}

function normalizeStats(uid: string, data?: Partial<UserStatsDoc>): UserStatsDoc {
  const defaults = defaultUserStats(uid);

  return {
    ...defaults,
    ...data,
    xpProgress: {
      ...defaults.xpProgress,
      ...data?.xpProgress,
    },
    dailyQuest: {
      ...defaults.dailyQuest,
      ...data?.dailyQuest,
    },
    mockTest: {
      ...defaults.mockTest,
      ...data?.mockTest,
    },
    subjects: data?.subjects ?? defaults.subjects,
    focusAreas: data?.focusAreas ?? defaults.focusAreas,
  };
}

function defaultActivity(uid: string, date: string): ActivityDoc {
  return {
    userId: uid,
    date,
    xp: 0,
    questSessions: 0,
    mockSessions: 0,
    correct: 0,
    total: 0,
    accuracy: 0,
  };
}

function normalizeActivity(uid: string, date: string, data?: Partial<ActivityDoc>): ActivityDoc {
  return {
    ...defaultActivity(uid, date),
    ...data,
  };
}

function mergeSubjectPerformance(
  previousSubjects: SubjectStat[],
  questions: Question[],
  answers: (number | null)[],
  xpPerCorrect: number
) {
  const subjectMap = new Map<string, SubjectStat>(
    previousSubjects.map(subject => [subject.subject, { ...subject }])
  );

  questions.forEach((question, index) => {
    const existing = subjectMap.get(question.subject) ?? {
      subject: question.subject,
      correct: 0,
      total: 0,
      accuracy: 0,
      xp: 0,
    };

    const isCorrect = answers[index] === question.correctIndex;
    existing.total += 1;
    existing.correct += isCorrect ? 1 : 0;
    existing.xp += isCorrect ? xpPerCorrect : 0;
    existing.accuracy = calculateAccuracy(existing.correct, existing.total);
    subjectMap.set(question.subject, existing);
  });

  return Array.from(subjectMap.values());
}

function getFocusAreas(subjects: SubjectStat[]): FocusArea[] {
  return [...subjects]
    .filter(subject => subject.total >= 5)
    .sort((a, b) => a.accuracy - b.accuracy)
    .slice(0, 3)
    .map(subject => ({
      subject: subject.subject,
      accuracy: subject.accuracy,
      total: subject.total,
      reason: 'Akurasi lebih rendah dibanding subject lainnya',
    }));
}

async function updateDailyActivity({
  uid,
  date,
  xpEarned,
  correct,
  total,
  questSessions,
  mockSessions,
}: {
  uid: string;
  date: string;
  xpEarned: number;
  correct: number;
  total: number;
  questSessions: number;
  mockSessions: number;
}) {
  const activityRef = doc(db, 'userActivity', `${uid}_${date}`);
  const activitySnap = await getDoc(activityRef);
  const activity = normalizeActivity(
    uid,
    date,
    activitySnap.exists() ? activitySnap.data() as Partial<ActivityDoc> : undefined
  );

  const nextCorrect = activity.correct + correct;
  const nextTotal = activity.total + total;

  await setDoc(
    activityRef,
    {
      ...activity,
      xp: activity.xp + xpEarned,
      questSessions: activity.questSessions + questSessions,
      mockSessions: activity.mockSessions + mockSessions,
      correct: nextCorrect,
      total: nextTotal,
      accuracy: calculateAccuracy(nextCorrect, nextTotal),
    },
    { merge: true }
  );
}

export async function updateMockStats({
  questions,
  answers,
  timeTaken,
}: UpdateMockStatsParams) {
  const user = auth.currentUser;

  if (!user) return;

  const uid = user.uid;
  const today = todayString();
  const correct = countCorrect(questions, answers);
  const total = questions.length;
  const accuracy = calculateAccuracy(correct, total);
  const xpEarned = correct * 10;

  const userRef = doc(db, 'users', uid);
  const userSnap = await getDoc(userRef);
  const userData = userSnap.data() as Partial<UserProfile> | undefined;
  const currentXp = userData?.xp ?? 0;
  const newXp = currentXp + xpEarned;
  const newLevel = calculateLevel(newXp);
  const newStreak = calculateStreak(userData?.lastActiveDate ?? '', userData?.streak ?? 0);

  await updateDoc(userRef, {
    xp: newXp,
    level: newLevel,
    streak: newStreak,
    lastActiveDate: today,
  });

  await updateDailyActivity({
    uid,
    date: today,
    xpEarned,
    correct,
    total,
    questSessions: 0,
    mockSessions: 1,
  });

  const statsRef = doc(db, 'userStats', uid);
  const statsSnap = await getDoc(statsRef);
  const stats = normalizeStats(
    uid,
    statsSnap.exists() ? statsSnap.data() as Partial<UserStatsDoc> : undefined
  );
  const nextMockSessions = stats.mockTest.sessions + 1;
  const subjects = mergeSubjectPerformance(stats.subjects, questions, answers, 10);

  await setDoc(
    statsRef,
    {
      ...stats,
      generatedAt: new Date().toISOString(),
      totalXp: newXp,
      level: newLevel,
      lastActiveDate: today,
      xpProgress: getXpProgress(newLevel, newXp),
      subjects,
      focusAreas: getFocusAreas(subjects),
      mockTest: {
        sessions: nextMockSessions,
        averageScore: Math.round(
          (stats.mockTest.averageScore * stats.mockTest.sessions + accuracy) /
            nextMockSessions
        ),
        bestScore: Math.max(stats.mockTest.bestScore, accuracy),
        averageTime: Math.round(
          (stats.mockTest.averageTime * stats.mockTest.sessions + timeTaken) /
            nextMockSessions
        ),
        lastScore: accuracy,
      },
    },
    { merge: true }
  );
}

export async function updateQuestStats({
  uid,
  profile,
  questions,
  answers,
  xpEarned,
  newXp,
  newLevel,
  newStreak,
}: UpdateQuestStatsParams) {
  const today = todayString();
  const correct = countCorrect(questions, answers);
  const total = questions.length;

  await updateDailyActivity({
    uid,
    date: today,
    xpEarned,
    correct,
    total,
    questSessions: 1,
    mockSessions: 0,
  });

  const statsRef = doc(db, 'userStats', uid);
  const statsSnap = await getDoc(statsRef);
  const stats = normalizeStats(
    uid,
    statsSnap.exists() ? statsSnap.data() as Partial<UserStatsDoc> : undefined
  );
  const nextDailyCorrect = stats.dailyQuest.correct + correct;
  const nextDailyQuestions = stats.dailyQuest.totalQuestions + total;
  const subjects = mergeSubjectPerformance(stats.subjects, questions, answers, 10);

  await setDoc(
    statsRef,
    {
      ...stats,
      generatedAt: new Date().toISOString(),
      totalXp: newXp,
      level: newLevel,
      streak: newStreak,
      targetMajor: profile.targetMajor,
      activeSubjects: profile.subjects,
      lastActiveDate: today,
      xpProgress: getXpProgress(newLevel, newXp),
      dailyQuest: {
        sessions: stats.dailyQuest.sessions + 1,
        totalXp: stats.dailyQuest.totalXp + xpEarned,
        totalQuestions: nextDailyQuestions,
        correct: nextDailyCorrect,
        accuracy: calculateAccuracy(nextDailyCorrect, nextDailyQuestions),
        bestSessionXp: Math.max(stats.dailyQuest.bestSessionXp, xpEarned),
      },
      subjects,
      focusAreas: getFocusAreas(subjects),
    },
    { merge: true }
  );
}
