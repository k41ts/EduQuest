import type { User } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import type { UserProfile } from '../types';

export function createDefaultProfile(user: User, name?: string): UserProfile {
  return {
    uid: user.uid,
    name: name?.trim() || user.displayName || user.email?.split('@')[0] || 'User',
    email: user.email ?? '',
    level: 1,
    xp: 0,
    streak: 0,
    lastActiveDate: '',
    targetMajor: '',
    subjects: [],
    badges: [],
    onboardingComplete: false,
    createdAt: new Date().toISOString(),
  };
}

export async function createInitialUserDocuments(profile: UserProfile) {
  const today = new Date().toISOString().split('T')[0];

  await setDoc(doc(db, 'users', profile.uid), profile, { merge: true });

  await setDoc(
    doc(db, 'userStats', profile.uid),
    {
      userId: profile.uid,
      generatedAt: new Date().toISOString(),
      totalXp: 0,
      level: 1,
      streak: 0,
      targetMajor: '',
      activeSubjects: [],
      lastActiveDate: '',
      xpProgress: {
        current: 0,
        total: 500,
        pct: 0,
        remaining: 500,
      },
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
    },
    { merge: true }
  );

  await setDoc(
    doc(db, 'userActivity', `${profile.uid}_${today}`),
    {
      userId: profile.uid,
      date: today,
      xp: 0,
      questSessions: 0,
      mockSessions: 0,
      correct: 0,
      total: 0,
      accuracy: 0,
    },
    { merge: true }
  );
}

export async function ensureUserDocuments(user: User) {
  const userRef = doc(db, 'users', user.uid);
  const snap = await getDoc(userRef);

  if (snap.exists()) return snap.data() as UserProfile;

  const profile = createDefaultProfile(user);
  await createInitialUserDocuments(profile);
  return profile;
}
