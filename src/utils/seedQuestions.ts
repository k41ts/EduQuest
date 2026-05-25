import { collection, writeBatch, doc, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import questionsData from '../data/questions.json';
import type { Question } from '../types';

export async function seedQuestions(): Promise<void> {
  // Check if questions already exist
  const existing = await getDocs(collection(db, 'questions'));
  if (!existing.empty) {
    console.log('Questions already seeded, skipping.');
    return;
  }

  // Batch write all questions
  const batch = writeBatch(db);
  (questionsData.questions as Question[]).forEach(q => {
    const ref = doc(collection(db, 'questions'));
    batch.set(ref, q);
  });

  await batch.commit();
  console.log('Questions seeded successfully!');
}