export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  level: number;
  xp: number;
  streak: number;
  lastActiveDate: string;
  targetMajor: string;
  subjects: string[];
  onboardingComplete: boolean;
  createdAt: string;
  badges: string[];
}

export interface Question {
  id: string;
  subject: 'TPS' | 'Literasi' | 'Matematika';
  difficulty: 'easy' | 'medium' | 'hard';
  text: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}