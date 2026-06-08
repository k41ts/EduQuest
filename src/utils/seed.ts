import { doc, setDoc } from "firebase/firestore";
import { db } from "../firebase";

const today = new Date().toISOString().split("T")[0];

const users = [
  ["admin", "Admin", "Kedokteran", 60],
  ["budi", "Budi", "Teknik Informatika", 420],
  ["citra", "Citra", "Kedokteran", 390],
  ["andi", "Andi", "Akuntansi", 350],
  ["salsa", "Salsa", "Psikologi", 320],
  ["kevin", "Kevin", "Teknik Industri", 290],
  ["nabila", "Nabila", "Farmasi", 250],
  ["rafa", "Rafa", "Hukum", 210],
  ["dinda", "Dinda", "Manajemen", 170],
  ["fajar", "Fajar", "Arsitektur", 130],
] as const;

export async function seedFirestore() {
  for (const [uid, name, targetMajor, xp] of users) {
    const level = Math.max(1, Math.floor(xp / 500) + 1);
    const streak = Math.floor(Math.random() * 10);

    await setDoc(doc(db, "users", uid), {
      uid,
      name,
      email: `${uid}@eduquest.com`,
      level,
      xp,
      streak,
      lastActiveDate: today,
      targetMajor,
      subjects: ["TPS", "Literasi", "Matematika"],
      onboardingComplete: true,
      createdAt: new Date().toISOString(),
      badges: [],
    });

    await setDoc(doc(db, "userStats", uid), {
      userId: uid,
      totalXp: xp,
      level,
      streak,
      lastActiveDate: today,

      dailyQuest: {
        sessions: Math.floor(Math.random() * 15),
        correct: Math.floor(Math.random() * 50),
        totalQuestions: 50,
        accuracy: Math.floor(Math.random() * 40) + 60,
        totalXp: xp / 2,
        bestSessionXp: 60,
      },

      mockTest: {
        sessions: Math.floor(Math.random() * 10),
        bestScore: Math.floor(Math.random() * 30) + 70,
        lastScore: Math.floor(Math.random() * 30) + 70,
        averageScore: Math.floor(Math.random() * 20) + 75,
        averageTime: Math.floor(Math.random() * 20) + 25,
      },

      xpProgress: {
        current: xp % 500,
        total: 500,
        remaining: 500 - (xp % 500),
        pct: Math.floor(((xp % 500) / 500) * 100),
      },

      activeSubjects: ["TPS", "Literasi", "Matematika"],
      focusAreas: [],
    });

    await setDoc(doc(db, "userActivity", uid), {
      userId: uid,
      date: today,
      correct: Math.floor(Math.random() * 50),
      total: 50,
      accuracy: Math.floor(Math.random() * 40) + 60,
      xp,
      mockSessions: Math.floor(Math.random() * 10),
      questSessions: Math.floor(Math.random() * 20),
    });
  }

  console.log("✅ Firestore seeded successfully!");
}