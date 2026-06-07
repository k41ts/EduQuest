import { useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { addDoc, collection } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import type { Question } from '../types';
import { Clock, LayoutDashboard, ClipboardList } from 'lucide-react';

interface MockResultState {
  config: { id: string; name: string; subjects: string[]; questionCount: number; durationMinutes: number };
  questions: Question[];
  answers: (number | null)[];
  timeTaken: number;
}

export default function MockResults() {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser } = useAuth();
  const savedRef = useRef(false);

  const state = location.state as MockResultState | null;

  useEffect(() => {
    if (!state) navigate('/mock', { replace: true });
  }, [navigate, state]);

  useEffect(() => {
    if (!state || !currentUser || savedRef.current) return;
    savedRef.current = true;

    async function save() {
      if (!state || !currentUser) return;
      const correctCount = state.questions.filter((q, i) => state.answers[i] === q.correctIndex).length;
      try {
        await addDoc(collection(db, 'mockSessions'), {
          userId: currentUser.uid,
          testId: state.config.id,
          testName: state.config.name,
          completedAt: new Date().toISOString(),
          correctCount,
          totalCount: state.questions.length,
          score: Math.round((correctCount / state.questions.length) * 100),
          timeTaken: state.timeTaken,
        });
      } catch (err) { console.error(err); }
    }
    void save();
  }, [state, currentUser]);

  if (!state) return null;

  const { config, questions, answers, timeTaken } = state;
  const correctCount = questions.filter((q, i) => answers[i] === q.correctIndex).length;
  const wrongCount = answers.filter((a, i) => a !== null && a !== questions[i].correctIndex).length;
  const blankCount = answers.filter(a => a === null).length;
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
    if (scorePct >= 80) return 'Luar biasa! Nilai kamu sangat bagus!';
    if (scorePct >= 60) return 'Bagus! Terus tingkatkan ya!';
    if (scorePct >= 40) return 'Lumayan! Masih ada ruang untuk berkembang';
    return 'Jangan menyerah! Latihan lebih banyak yuk!';
  };

  const formatTime = (s: number) => `${Math.floor(s / 60)} mnt ${s % 60} dtk`;

  return (
    <div style={{
      minHeight: '100vh', background: '#F7F6F2',
      fontFamily: 'Plus Jakarta Sans, sans-serif',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px',
    }}>
      <div style={{ width: '100%', maxWidth: '520px' }}>

        {/* Test name badge */}
        <div style={{ textAlign: 'center', marginBottom: '16px' }}>
          <span style={{
            background: '#EEEDFE', color: '#7F77DD',
            fontSize: '12px', fontWeight: '600', padding: '5px 14px', borderRadius: '99px',
          }}>
            {config.name}
          </span>
        </div>

        {/* Score card */}
        <div style={{
          background: 'white', borderRadius: '24px', padding: '28px',
          border: '1px solid #EDE9FE', marginBottom: '14px', textAlign: 'center',
        }}>
          <div style={{
            width: '110px', height: '110px', borderRadius: '50%',
            background: scoreBg, border: `4px solid ${scoreColor}`,
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px',
          }}>
            <span style={{ fontSize: '28px', fontWeight: '700', color: scoreColor, lineHeight: 1 }}>
              {scorePct}%
            </span>
            <span style={{ fontSize: '10px', color: scoreColor, marginTop: '2px' }}>skor</span>
          </div>

          <div style={{ fontSize: '20px', fontWeight: '700', color: '#26215C', marginBottom: '6px' }}>
            Tes selesai!
          </div>
          <div style={{ fontSize: '13px', color: '#888780', marginBottom: '20px' }}>
            {getMessage()}
          </div>

          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginBottom: '16px' }}>
            {[
              { label: 'Benar',  value: correctCount, color: '#1D9E75', bg: '#E1F5EE' },
              { label: 'Salah',  value: wrongCount,   color: '#D85A30', bg: '#FAECE7' },
              { label: 'Kosong', value: blankCount,   color: '#888780', bg: '#F7F6F2' },
            ].map(({ label, value, color, bg }) => (
              <div key={label} style={{ background: bg, borderRadius: '12px', padding: '12px 8px' }}>
                <div style={{ fontSize: '22px', fontWeight: '700', color, lineHeight: 1, marginBottom: '4px' }}>{value}</div>
                <div style={{ fontSize: '11px', color }}>{label}</div>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '12px', color: '#888780' }}>
            <Clock size={13} color="#AFA9EC" />
            Selesai dalam {formatTime(timeTaken)} dari {config.durationMinutes} menit
          </div>
        </div>

        {/* Per-subject */}
        <div style={{
          background: 'white', borderRadius: '20px', padding: '20px 24px',
          border: '1px solid #EDE9FE', marginBottom: '14px',
        }}>
          <div style={{ fontSize: '14px', fontWeight: '700', color: '#26215C', marginBottom: '14px' }}>
            Hasil per mapel
          </div>
          {Object.entries(subjectMap).map(([subject, { correct, total }]) => {
            const pct = Math.round((correct / total) * 100);
            const color = pct >= 70 ? '#1D9E75' : pct >= 40 ? '#EF9F27' : '#D85A30';
            const bg    = pct >= 70 ? '#E1F5EE' : pct >= 40 ? '#FAEEDA' : '#FAECE7';
            return (
              <div key={subject} style={{ marginBottom: '14px' }}>
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

        {/* Buttons */}
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={() => navigate('/mock')}
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
            <ClipboardList size={14} /> Mock lain
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
