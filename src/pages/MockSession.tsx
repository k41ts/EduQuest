import { useCallback, useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { fetchQuestions, getRandomQuestions } from '../utils/questUtils';
import type { Question } from '../types';
import { Clock, ChevronLeft, ChevronRight, AlertCircle, BookOpen, Brain, Calculator } from 'lucide-react';
import { updateMockStats } from '../utils/statsUtils';

interface MockConfig {
  id: string;
  name: string;
  subjects: string[];
  questionCount: number;
  durationMinutes: number;
}

const SUBJECT_META: Record<string, { color: string; bg: string; icon: typeof BookOpen }> = {
  TPS:        { color: '#7F77DD', bg: '#EEEDFE', icon: Brain },
  Literasi:   { color: '#1D9E75', bg: '#E1F5EE', icon: BookOpen },
  Matematika: { color: '#EF9F27', bg: '#FAEEDA', icon: Calculator },
};

export default function MockSession() {
  const location = useLocation();
  const navigate = useNavigate();
  const config = location.state as MockConfig | null;

  const [questions, setQuestions] = useState<Question[]>([]);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>([]);
  const [timeLeft, setTimeLeft] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    if (!config) { navigate('/mock'); return; }
    async function load() {
      const all = await fetchQuestions();
      const qs = getRandomQuestions(all, config!.subjects, config!.questionCount);
      setQuestions(qs);
      setAnswers(new Array(qs.length).fill(null));
      setTimeLeft(config!.durationMinutes * 60);
      setLoading(false);
    }
    load();
  }, [config, navigate]);

  const handleSubmit = useCallback(async () => {
    const timeTaken =
      (config?.durationMinutes ?? 0) * 60 - timeLeft;

    await updateMockStats({
      questions,
      answers,
      timeTaken,
    });

    navigate('/mock/results', {
      state: {
        config,
        questions,
        answers,
        timeTaken,
      },
    });
  }, [answers, config, navigate, questions, timeLeft]);

  useEffect(() => {
    if (loading || questions.length === 0) return;
    if (timeLeft <= 0) { handleSubmit(); return; }
    const t = setTimeout(() => setTimeLeft(t => t - 1), 1000);
    return () => clearTimeout(t);
  }, [handleSubmit, loading, questions.length, timeLeft]);

  function handleSelect(i: number) {
    const updated = [...answers];
    updated[index] = i;
    setAnswers(updated);
  }

  if (!config) return null;

  if (loading) {
    return (
      <Layout>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '12px' }}>
          <div style={{ width: '36px', height: '36px', borderRadius: '50%', border: '3px solid #EEEDFE', borderTopColor: '#7F77DD', animation: 'spin 0.8s linear infinite' }} />
          <div style={{ fontSize: '14px', color: '#888780' }}>Memuat soal...</div>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </Layout>
    );
  }

  const q = questions[index];
  const selected = answers[index];
  const answeredCount = answers.filter(a => a !== null).length;
  const unansweredCount = questions.length - answeredCount;
  const timerColor = timeLeft > 60 ? '#26215C' : '#D85A30';
  const timerBg = timeLeft > 60 ? '#EEEDFE' : '#FAECE7';
  const subjectMeta = SUBJECT_META[q.subject] ?? SUBJECT_META['TPS'];
  const SubjectIcon = subjectMeta.icon;

  return (
    <Layout>
      <div style={{
        padding: '20px 24px',
        display: 'grid', gridTemplateColumns: '1fr 230px',
        gap: '16px', height: 'calc(100vh - 57px)', boxSizing: 'border-box',
      }}>

        {/* Left: question */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', overflowY: 'auto', paddingRight: '4px' }}>

          {/* Question card */}
          <div style={{ background: 'white', borderRadius: '16px', padding: '22px 24px', border: '1px solid #EDE9FE' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
              <span style={{
                background: subjectMeta.bg, color: subjectMeta.color,
                fontSize: '11px', fontWeight: '600', padding: '4px 12px',
                borderRadius: '99px', display: 'flex', alignItems: 'center', gap: '5px',
              }}>
                <SubjectIcon size={12} /> {q.subject}
              </span>
              <span style={{ fontSize: '12px', color: '#B4B2A9', fontWeight: '600' }}>
                Soal {index + 1} dari {questions.length}
              </span>
            </div>
            <div style={{ fontSize: '15px', fontWeight: '600', color: '#26215C', lineHeight: '1.65' }}>
              {q.text}
            </div>
          </div>

          {/* Options */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            {q.options.map((opt, i) => {
              const isSelected = selected === i;
              return (
                <button
                  key={i}
                  onClick={() => handleSelect(i)}
                  style={{
                    padding: '14px 16px', borderRadius: '14px', textAlign: 'left',
                    border: `2px solid ${isSelected ? '#7F77DD' : '#EDE9FE'}`,
                    background: isSelected ? '#EEEDFE' : '#FDFCFF',
                    cursor: 'pointer', fontFamily: 'Plus Jakarta Sans, sans-serif',
                    display: 'flex', alignItems: 'center', gap: '12px',
                    transition: 'all 0.15s',
                  }}
                  onMouseEnter={e => { if (!isSelected) e.currentTarget.style.borderColor = '#AFA9EC'; }}
                  onMouseLeave={e => { if (!isSelected) e.currentTarget.style.borderColor = '#EDE9FE'; }}
                >
                  <div style={{
                    width: '28px', height: '28px', borderRadius: '8px', flexShrink: 0,
                    background: isSelected ? '#7F77DD' : '#EDE9FE',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '12px', fontWeight: '700',
                    color: isSelected ? 'white' : '#AFA9EC',
                    transition: 'all 0.15s',
                  }}>
                    {String.fromCharCode(65 + i)}
                  </div>
                  <span style={{
                    fontSize: '13px', fontWeight: isSelected ? '600' : '400',
                    color: isSelected ? '#26215C' : '#444', lineHeight: '1.4',
                  }}>
                    {opt}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Prev / Next */}
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={() => setIndex(i => Math.max(0, i - 1))}
              disabled={index === 0}
              style={{
                flex: 1, padding: '12px', borderRadius: '12px',
                border: '2px solid #EDE9FE', background: 'white',
                color: index === 0 ? '#B4B2A9' : '#7F77DD',
                fontSize: '13px', fontWeight: '600',
                cursor: index === 0 ? 'not-allowed' : 'pointer',
                fontFamily: 'Plus Jakarta Sans, sans-serif',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
              }}
            >
              <ChevronLeft size={15} /> Sebelumnya
            </button>
            <button
              onClick={() => setIndex(i => Math.min(questions.length - 1, i + 1))}
              disabled={index === questions.length - 1}
              style={{
                flex: 1, padding: '12px', borderRadius: '12px',
                border: '2px solid #EDE9FE', background: 'white',
                color: index === questions.length - 1 ? '#B4B2A9' : '#7F77DD',
                fontSize: '13px', fontWeight: '600',
                cursor: index === questions.length - 1 ? 'not-allowed' : 'pointer',
                fontFamily: 'Plus Jakarta Sans, sans-serif',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
              }}
            >
              Selanjutnya <ChevronRight size={15} />
            </button>
          </div>
        </div>

        {/* Right: timer + navigator */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

          {/* Timer */}
          <div style={{
            background: timerBg, borderRadius: '16px', padding: '16px',
            border: `1.5px solid ${timerColor}33`, textAlign: 'center',
            transition: 'background 0.3s',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginBottom: '4px' }}>
              <Clock size={14} color={timerColor} />
              <span style={{ fontSize: '11px', fontWeight: '600', color: timerColor }}>Waktu tersisa</span>
            </div>
            <div style={{ fontSize: '30px', fontWeight: '700', color: timerColor, fontVariantNumeric: 'tabular-nums' }}>
              {String(Math.floor(timeLeft / 60)).padStart(2, '0')}:{String(timeLeft % 60).padStart(2, '0')}
            </div>
          </div>

          {/* Navigator */}
          <div style={{
            background: 'white', borderRadius: '16px', padding: '16px',
            border: '1px solid #EDE9FE', flex: 1, display: 'flex', flexDirection: 'column',
          }}>
            <div style={{ fontSize: '12px', fontWeight: '600', color: '#888780', marginBottom: '10px' }}>
              Navigator soal
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '5px', marginBottom: '14px' }}>
              {questions.map((_, i) => {
                const isAnswered = answers[i] !== null;
                const isCurrent = i === index;
                return (
                  <button
                    key={i}
                    onClick={() => setIndex(i)}
                    style={{
                      aspectRatio: '1', borderRadius: '8px', border: 'none',
                      background: isCurrent ? '#F0A84B' : isAnswered ? '#7F77DD' : '#EDE9FE',
                      color: isCurrent || isAnswered ? 'white' : '#AFA9EC',
                      fontSize: '11px', fontWeight: '700', cursor: 'pointer',
                      transition: 'all 0.15s',
                    }}
                  >
                    {i + 1}
                  </button>
                );
              })}
            </div>

            {/* Legend */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '12px' }}>
              {[
                { color: '#F0A84B', label: 'Sedang dijawab' },
                { color: '#7F77DD', label: 'Sudah dijawab' },
                { color: '#EDE9FE', label: 'Belum dijawab' },
              ].map(({ color, label }) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{ width: '10px', height: '10px', borderRadius: '3px', background: color, flexShrink: 0 }} />
                  <span style={{ fontSize: '10px', color: '#888780' }}>{label}</span>
                </div>
              ))}
            </div>

            <div style={{ fontSize: '12px', color: '#888780', textAlign: 'center', marginBottom: '12px' }}>
              {answeredCount} / {questions.length} terjawab
            </div>

            <button
              onClick={() => setShowConfirm(true)}
              style={{
                width: '100%', padding: '11px', borderRadius: '12px', border: 'none',
                background: '#F0A84B', color: '#fefcf9',
                fontSize: '13px', fontWeight: '700', cursor: 'pointer',
                fontFamily: 'Plus Jakarta Sans, sans-serif', transition: 'background 0.15s',
                marginTop: 'auto',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = '#e09738'; }}
              onMouseLeave={e => { e.currentTarget.style.background = '#F0A84B'; }}
            >
              Kumpulkan
            </button>
          </div>
        </div>
      </div>

      {/* Confirm modal */}
      {showConfirm && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 100, padding: '24px',
        }}>
          <div style={{
            background: 'white', borderRadius: '20px', padding: '28px',
            maxWidth: '360px', width: '100%',
            boxShadow: '0 8px 40px rgba(0,0,0,0.15)',
          }}>
            <div style={{ fontSize: '17px', fontWeight: '700', color: '#26215C', marginBottom: '8px' }}>
              Kumpulkan jawaban?
            </div>

            {unansweredCount > 0 && (
              <div style={{
                background: '#FAEEDA', border: '1.5px solid #EF9F27', borderRadius: '10px',
                padding: '10px 14px', marginBottom: '14px',
                display: 'flex', alignItems: 'center', gap: '8px',
              }}>
                <AlertCircle size={15} color="#EF9F27" style={{ flexShrink: 0 }} />
                <span style={{ fontSize: '13px', color: '#412402' }}>
                  {unansweredCount} soal belum dijawab
                </span>
              </div>
            )}

            <div style={{ fontSize: '13px', color: '#888780', lineHeight: '1.6', marginBottom: '20px' }}>
              Kamu sudah menjawab <strong style={{ color: '#26215C' }}>{answeredCount}</strong> dari{' '}
              <strong style={{ color: '#26215C' }}>{questions.length}</strong> soal. Yakin mau kumpulkan?
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => setShowConfirm(false)}
                style={{
                  flex: 1, padding: '11px', borderRadius: '12px',
                  border: '1.5px solid #EDE9FE', background: 'white',
                  color: '#888780', fontSize: '13px', fontWeight: '600',
                  cursor: 'pointer', fontFamily: 'Plus Jakarta Sans, sans-serif',
                }}
              >
                Batal
              </button>
              <button
                onClick={handleSubmit}
                style={{
                  flex: 1, padding: '11px', borderRadius: '12px',
                  border: 'none', background: '#F0A84B',
                  color: '#fefcf9', fontSize: '13px', fontWeight: '700',
                  cursor: 'pointer', fontFamily: 'Plus Jakarta Sans, sans-serif',
                }}
              >
                Ya, kumpulkan
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
