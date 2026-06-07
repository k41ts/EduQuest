import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { doc, updateDoc, addDoc, collection } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import type { Question } from '../types';
import { calculateStreak, calculateLevel } from '../utils/questUtils';
import { Zap, RotateCcw, LayoutDashboard, Flame, Check, X } from 'lucide-react';

interface ResultState {
  questions: Question[];
  answers: (number | null)[];
  xpEarned: number;
}

export default function QuestResults() {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser, userProfile, refreshProfile } = useAuth();
  const [saved, setSaved] = useState(false);

  const state = location.state as ResultState | null;

  useEffect(() => {
    if (!state || !currentUser || !userProfile || saved) return;
    setSaved(true);
    saveResults();
  }, [state, currentUser, userProfile]);

  async function saveResults() {
    if (!state || !currentUser || !userProfile) return;

    const today = new Date().toISOString().split('T')[0];
    const newStreak = calculateStreak(userProfile.lastActiveDate, userProfile.streak);
    const newXp = userProfile.xp + state.xpEarned;
    const newLevel = calculateLevel(newXp);

    const subjectStats: Record<string, { correct: number; total: number }> = {};
    state.questions.forEach((q, i) => {
      if (!subjectStats[q.subject]) subjectStats[q.subject] = { correct: 0, total: 0 };
      subjectStats[q.subject].total++;
      if (state.answers[i] === q.correctIndex) subjectStats[q.subject].correct++;
    });

    try {
      await updateDoc(doc(db, 'users', currentUser.uid), {
        xp: newXp,
        level: newLevel,
        streak: newStreak,
        lastActiveDate: today,
      });
      await addDoc(collection(db, 'sessions'), {
        userId: currentUser.uid,
        userName: userProfile.name,
        userEmail: userProfile.email,
        completedAt: new Date().toISOString(),
        xpEarned: state.xpEarned,
        correctCount: state.questions.filter((q, i) => state.answers[i] === q.correctIndex).length,
        totalCount: state.questions.length,
        subjectStats,
      });
      await refreshProfile();
    } catch (err) {
      console.error(err);
    }
  }

  if (!state) {
    navigate('/dashboard');
    return null;
  }

  const { questions, answers, xpEarned } = state;
  const correctCount = questions.filter((q, i) => answers[i] === q.correctIndex).length;
  const wrongCount = questions.length - correctCount;
  const scorePct = Math.round((correctCount / questions.length) * 100);

  const subjectMap: Record<string, { correct: number; total: number }> = {};
  questions.forEach((q, i) => {
    if (!subjectMap[q.subject]) subjectMap[q.subject] = { correct: 0, total: 0 };
    subjectMap[q.subject].total++;
    if (answers[i] === q.correctIndex) subjectMap[q.subject].correct++;
  });

  const scoreColor = scorePct >= 70 ? '#1D9E75' : scorePct >= 40 ? '#EF9F27' : '#D85A30';
  const scoreBg   = scorePct >= 70 ? '#E1F5EE' : scorePct >= 40 ? '#FAEEDA' : '#FAECE7';

  const getMessage = () => {
    if (scorePct >= 80) return 'Luar biasa! Kamu keren banget!';
    if (scorePct >= 60) return 'Bagus! Terus semangat ya!';
    if (scorePct >= 40) return 'Lumayan! Latihan lagi yuk!';
    return 'Jangan menyerah! Coba lagi!';
  };

  return (
    <div style={{
      minHeight: '100vh', background: '#F7F6F2',
      fontFamily: 'Plus Jakarta Sans, sans-serif',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '24px',
    }}>
      <div style={{ width: '100%', maxWidth: '520px' }}>

        {/* Score card */}
        <div style={{
          background: 'white', borderRadius: '24px', padding: '32px',
          border: '1px solid #EDE9FE', marginBottom: '14px', textAlign: 'center',
        }}>
          <div style={{
            width: '100px', height: '100px', borderRadius: '50%',
            background: scoreBg, border: `4px solid ${scoreColor}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px', flexDirection: 'column',
          }}>
            <span style={{ fontSize: '26px', fontWeight: '700', color: scoreColor, lineHeight: 1 }}>
              {scorePct}%
            </span>
          </div>
          <div style={{ fontSize: '20px', fontWeight: '700', color: '#26215C', marginBottom: '6px' }}>
            Quest selesai!
          </div>
          <div style={{ fontSize: '14px', color: '#888780', marginBottom: '24px' }}>
            {getMessage()}
          </div>

          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginBottom: '20px' }}>
            {[
              { label: 'Benar',    value: correctCount,    icon: Check, color: '#1D9E75', bg: '#E1F5EE' },
              { label: 'Salah',    value: wrongCount,      icon: X,     color: '#D85A30', bg: '#FAECE7' },
              { label: 'XP dapat', value: `+${xpEarned}`, icon: Zap,   color: '#EF9F27', bg: '#FAEEDA' },
            ].map(({ label, value, icon: Icon, color, bg }) => (
              <div key={label} style={{ background: bg, borderRadius: '12px', padding: '12px 8px' }}>
                <Icon size={18} color={color} style={{ marginBottom: '4px' }} />
                <div style={{ fontSize: '20px', fontWeight: '700', color }}>{value}</div>
                <div style={{ fontSize: '11px', color }}>{label}</div>
              </div>
            ))}
          </div>

          {/* Streak */}
          <div style={{
            background: '#FAEEDA', borderRadius: '12px', padding: '12px 16px',
            display: 'flex', alignItems: 'center', gap: '10px',
          }}>
            <Flame size={20} color="#EF9F27" />
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: '13px', fontWeight: '600', color: '#412402' }}>
                Streak diperbarui!
              </div>
              <div style={{ fontSize: '12px', color: '#888780' }}>
                Kamu udah belajar {userProfile?.streak ?? 1} hari berturut-turut
              </div>
            </div>
          </div>
        </div>

        {/* Per-subject accuracy */}
        <div style={{
          background: 'white', borderRadius: '20px', padding: '20px 24px',
          border: '1px solid #EDE9FE', marginBottom: '14px',
        }}>
          <div style={{ fontSize: '14px', fontWeight: '700', color: '#26215C', marginBottom: '14px' }}>
            Akurasi per mapel
          </div>
          {Object.entries(subjectMap).map(([subject, { correct, total }]) => {
            const pct = Math.round((correct / total) * 100);
            const color = pct >= 70 ? '#1D9E75' : pct >= 40 ? '#EF9F27' : '#D85A30';
            const bg    = pct >= 70 ? '#E1F5EE' : pct >= 40 ? '#FAEEDA' : '#FAECE7';
            return (
              <div key={subject} style={{ marginBottom: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ fontSize: '13px', fontWeight: '600', color: '#26215C' }}>{subject}</span>
                  <span style={{ fontSize: '12px', fontWeight: '600', color }}>
                    {correct}/{total} ({pct}%)
                  </span>
                </div>
                <div style={{ height: '8px', background: bg, borderRadius: '99px' }}>
                  <div style={{
                    height: '100%', borderRadius: '99px', background: color,
                    width: `${pct}%`, transition: 'width 0.6s ease',
                  }} />
                </div>
              </div>
            );
          })}
        </div>

        {/* Question recap */}
        <div style={{
          background: 'white', borderRadius: '20px', padding: '20px 24px',
          border: '1px solid #EDE9FE', marginBottom: '16px',
        }}>
          <div style={{ fontSize: '14px', fontWeight: '700', color: '#26215C', marginBottom: '14px' }}>
            Rekap jawaban
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {questions.map((q, i) => {
              const correct = answers[i] === q.correctIndex;
              return (
                <div key={i} style={{
                  display: 'flex', alignItems: 'flex-start', gap: '10px',
                  padding: '10px 12px', borderRadius: '10px',
                  background: correct ? '#E1F5EE' : '#FAECE7',
                  border: `1px solid ${correct ? '#5DCAA5' : '#F0997B'}`,
                }}>
                  <div style={{
                    width: '22px', height: '22px', borderRadius: '50%', flexShrink: 0,
                    background: correct ? '#1D9E75' : '#D85A30',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {correct
                      ? <Check size={12} color="white" strokeWidth={3} />
                      : <X size={12} color="white" strokeWidth={3} />
                    }
                  </div>
                  <div>
                    <div style={{ fontSize: '12px', fontWeight: '600', color: '#26215C', marginBottom: '2px' }}>
                      Soal {i + 1}
                    </div>
                    <div style={{ fontSize: '11px', color: '#888780', lineHeight: '1.4' }}>
                      {q.text.length > 80 ? q.text.slice(0, 80) + '...' : q.text}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Buttons */}
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={() => navigate('/quest')}
            style={{
              flex: 1, padding: '13px', borderRadius: '14px',
              border: '2px solid #EDE9FE', background: 'white',
              color: '#7F77DD', fontSize: '13px', fontWeight: '700',
              cursor: 'pointer', fontFamily: 'Plus Jakarta Sans, sans-serif',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = '#EEEDFE'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'white'; }}
          >
            <RotateCcw size={14} /> Ulang quest
          </button>
          <button
            onClick={() => navigate('/dashboard')}
            style={{
              flex: 1, padding: '13px', borderRadius: '14px',
              background: '#F0A84B', border: 'none',
              color: '#fefcf9', fontSize: '13px', fontWeight: '700',
              cursor: 'pointer', fontFamily: 'Plus Jakarta Sans, sans-serif',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
              transition: 'background 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = '#e09738'; }}
            onMouseLeave={e => { e.currentTarget.style.background = '#F0A84B'; }}
          >
            <LayoutDashboard size={14} /> Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}