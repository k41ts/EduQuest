import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Layout from '../components/Layout';
import type { Question } from '../types';
import { fetchQuestions, getRandomQuestions, XP_MAP } from '../utils/questUtils';
import { Clock, ChevronRight, Check, X, BookOpen, Brain, Calculator, Zap } from 'lucide-react';

const TIMER = 90;

const SUBJECT_META: Record<string, { color: string; bg: string; icon: typeof BookOpen }> = {
  TPS:        { color: '#7F77DD', bg: '#EEEDFE', icon: Brain },
  Literasi:   { color: '#1D9E75', bg: '#E1F5EE', icon: BookOpen },
  Matematika: { color: '#EF9F27', bg: '#FAEEDA', icon: Calculator },
};

const DIFF_META: Record<string, { label: string; color: string; bg: string }> = {
  easy:   { label: 'Mudah',  color: '#1D9E75', bg: '#E1F5EE' },
  medium: { label: 'Sedang', color: '#EF9F27', bg: '#FAEEDA' },
  hard:   { label: 'Sulit',  color: '#D85A30', bg: '#FAECE7' },
};

export default function Quest() {
  const { userProfile } = useAuth();
  const navigate = useNavigate();

  const [questions, setQuestions] = useState<Question[]>([]);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [answers, setAnswers] = useState<(number | null)[]>([]);
  const [timeLeft, setTimeLeft] = useState(TIMER);
  const [xpEarned, setXpEarned] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadQuestions() {
      try {
        setLoading(true);

        const all = await fetchQuestions();
        console.log("all questions:", all);

        console.log("subjects:", userProfile?.subjects);

        const qs = getRandomQuestions(all, userProfile?.subjects ?? [], 10);
        console.log("selected questions:", qs);

        setQuestions(qs);
        setAnswers(new Array(qs.length).fill(null));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    if (userProfile) loadQuestions();
  }, [userProfile]);

  useEffect(() => {
    if (submitted || questions.length === 0) return;
    const t = setTimeout(() => {
      setTimeLeft(currentTime => {
        if (currentTime <= 1) {
          setAnswers(currentAnswers => {
            const updatedAnswers = [...currentAnswers];
            updatedAnswers[index] = null;
            return updatedAnswers;
          });
          setSubmitted(true);
          return 0;
        }

        return currentTime - 1;
      });
    }, 1000);
    return () => clearTimeout(t);
  }, [index, submitted, questions.length, timeLeft]);

  function handleSubmit() {
    const newAnswers = [...answers];
    newAnswers[index] = selected;
    setAnswers(newAnswers);
    setSubmitted(true);
    const q = questions[index];
    if (selected === q.correctIndex) {
      setXpEarned(prev => prev + (XP_MAP[q.difficulty] ?? 10));
    }
  }

  function handleNext() {
    if (index + 1 >= questions.length) {
      navigate('/quest/results', { state: { questions, answers, xpEarned } });
      return;
    }
    setIndex(i => i + 1);
    setSelected(null);
    setSubmitted(false);
    setTimeLeft(TIMER);
  }

  if (loading || questions.length === 0) {
    return (
      <Layout>
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'center', height: '100%', gap: '12px',
        }}>
          <div style={{
            width: '40px', height: '40px', borderRadius: '50%',
            border: '3px solid #EEEDFE', borderTopColor: '#7F77DD',
            animation: 'spin 0.8s linear infinite',
          }} />
          <div style={{ fontSize: '14px', color: '#888780' }}>Memuat soal...</div>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </Layout>
    );
  }

  const q = questions[index];
  const isCorrect = submitted && selected === q.correctIndex;
  const timerColor = timeLeft > 30 ? '#7F77DD' : timeLeft > 10 ? '#EF9F27' : '#D85A30';
  const subjectMeta = SUBJECT_META[q.subject] ?? SUBJECT_META['TPS'];
  const diffMeta = DIFF_META[q.difficulty] ?? DIFF_META['medium'];
  const SubjectIcon = subjectMeta.icon;
  const isLast = index + 1 >= questions.length;

  return (
    <Layout>
      <div style={{ padding: '24px', maxWidth: '720px', margin: '0 auto' }}>

        {/* Progress + timer bar */}
        <div style={{
          background: 'white', borderRadius: '16px', padding: '14px 20px',
          border: '1px solid #EDE9FE', marginBottom: '16px',
          display: 'flex', alignItems: 'center', gap: '14px',
        }}>
          {/* Progress dots */}
          <div style={{ display: 'flex', gap: '4px', flex: 1 }}>
            {questions.map((_, i) => (
              <div key={i} style={{
                flex: 1, height: '7px', borderRadius: '99px',
                background: i < index ? '#7F77DD' : i === index ? '#F0A84B' : '#EDE9FE',
                transition: 'background 0.3s',
              }} />
            ))}
          </div>

          <span style={{ fontSize: '12px', fontWeight: '600', color: '#B4B2A9', flexShrink: 0 }}>
            {index + 1} / {questions.length}
          </span>

          {/* Timer */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            background: timeLeft <= 10 ? '#FAECE7' : '#EEEDFE',
            borderRadius: '10px', padding: '6px 12px', flexShrink: 0,
            transition: 'background 0.3s',
          }}>
            <Clock size={14} color={timerColor} />
            <span style={{ fontSize: '13px', fontWeight: '700', color: timerColor, minWidth: '34px' }}>
              {String(Math.floor(timeLeft / 60)).padStart(2, '0')}:{String(timeLeft % 60).padStart(2, '0')}
            </span>
          </div>

          {/* XP earned */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: '5px',
            background: '#FAEEDA', borderRadius: '10px', padding: '6px 12px', flexShrink: 0,
          }}>
            <Zap size={14} color="#EF9F27" />
            <span style={{ fontSize: '13px', fontWeight: '700', color: '#412402' }}>
              +{xpEarned} XP
            </span>
          </div>
        </div>

        {/* Question card */}
        <div style={{
          background: 'white', borderRadius: '16px', padding: '24px',
          border: '1px solid #EDE9FE', marginBottom: '12px',
        }}>
          {/* Pills */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
            <span style={{
              background: subjectMeta.bg, color: subjectMeta.color,
              fontSize: '11px', fontWeight: '600', padding: '4px 12px',
              borderRadius: '99px', display: 'flex', alignItems: 'center', gap: '5px',
            }}>
              <SubjectIcon size={12} /> {q.subject}
            </span>
            <span style={{
              background: diffMeta.bg, color: diffMeta.color,
              fontSize: '11px', fontWeight: '600', padding: '4px 12px', borderRadius: '99px',
            }}>
              {diffMeta.label}
            </span>
          </div>

          {/* Question text */}
          <div style={{
            fontSize: '16px', fontWeight: '600', color: '#26215C',
            lineHeight: '1.65',
          }}>
            {q.text}
          </div>
        </div>

        {/* Options */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
          {q.options.map((opt, i) => {
            const isSelected = selected === i;
            const showCorrect = submitted && i === q.correctIndex;
            const showWrong = submitted && isSelected && i !== q.correctIndex;

            let border = '2px solid #EDE9FE';
            let bg = '#FDFCFF';
            let textColor = '#444';
            let badgeBg = '#EDE9FE';
            let badgeColor = '#AFA9EC';

            if (showCorrect) {
              border = '2px solid #1D9E75'; bg = '#E1F5EE';
              textColor = '#0F6E56'; badgeBg = '#1D9E75'; badgeColor = 'white';
            } else if (showWrong) {
              border = '2px solid #D85A30'; bg = '#FAECE7';
              textColor = '#993C1D'; badgeBg = '#D85A30'; badgeColor = 'white';
            } else if (isSelected) {
              border = '2px solid #7F77DD'; bg = '#EEEDFE';
              textColor = '#26215C'; badgeBg = '#7F77DD'; badgeColor = 'white';
            }

            return (
              <button
                key={i}
                onClick={() => { if (!submitted) setSelected(i); }}
                style={{
                  padding: '14px 16px', borderRadius: '14px', textAlign: 'left',
                  border, background: bg,
                  cursor: submitted ? 'default' : 'pointer',
                  fontFamily: 'Plus Jakarta Sans, sans-serif',
                  display: 'flex', alignItems: 'center', gap: '12px',
                  transition: 'all 0.15s',
                }}
                onMouseEnter={e => { if (!submitted && !isSelected) e.currentTarget.style.borderColor = '#AFA9EC'; }}
                onMouseLeave={e => { if (!submitted && !isSelected) e.currentTarget.style.borderColor = '#EDE9FE'; }}
              >
                {/* Letter badge */}
                <div style={{
                  width: '28px', height: '28px', borderRadius: '8px', flexShrink: 0,
                  background: badgeBg, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '12px', fontWeight: '700', color: badgeColor,
                  transition: 'all 0.15s',
                }}>
                  {showCorrect ? <Check size={14} strokeWidth={3} /> :
                   showWrong   ? <X size={14} strokeWidth={3} /> :
                   String.fromCharCode(65 + i)}
                </div>

                <span style={{
                  fontSize: '13px', fontWeight: isSelected || showCorrect ? '600' : '400',
                  color: textColor, lineHeight: '1.4', textAlign: 'left',
                }}>
                  {opt}
                </span>
              </button>
            );
          })}
        </div>

        {/* Explanation */}
        {submitted && (
          <div style={{
            background: isCorrect ? '#E1F5EE' : '#FAECE7',
            border: `2px solid ${isCorrect ? '#5DCAA5' : '#F0997B'}`,
            borderRadius: '14px', padding: '16px 18px', marginBottom: '12px',
          }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              fontSize: '14px', fontWeight: '700',
              color: isCorrect ? '#0F6E56' : '#993C1D',
              marginBottom: '8px',
            }}>
              {isCorrect
                ? <><Check size={16} strokeWidth={3} /> Benar! +{XP_MAP[q.difficulty] ?? 10} XP</>
                : <><X size={16} strokeWidth={3} /> Jawaban kurang tepat</>
              }
            </div>
            <div style={{ fontSize: '13px', color: '#444', lineHeight: '1.65' }}>
              {q.explanation}
            </div>
          </div>
        )}

        {/* Action button */}
        <button
          onClick={submitted ? handleNext : handleSubmit}
          disabled={!submitted && selected === null}
          style={{
            width: '100%', padding: '14px', borderRadius: '14px', border: 'none',
            background: submitted ? '#F0A84B' : selected !== null ? '#7F77DD' : '#E4E2DC',
            color: submitted ? '#fefcf9' : selected !== null ? 'white' : '#B4B2A9',
            fontSize: '14px', fontWeight: '700',
            cursor: (!submitted && selected === null) ? 'not-allowed' : 'pointer',
            fontFamily: 'Plus Jakarta Sans, sans-serif',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
            transition: 'background 0.2s, transform 0.1s',
          }}
          onMouseEnter={e => {
            if (submitted) e.currentTarget.style.background = '#e09738';
            else if (selected !== null) e.currentTarget.style.background = '#534AB7';
          }}
          onMouseLeave={e => {
            if (submitted) e.currentTarget.style.background = '#F0A84B';
            else if (selected !== null) e.currentTarget.style.background = '#7F77DD';
          }}
          onMouseDown={e => { if (submitted || selected !== null) e.currentTarget.style.transform = 'scale(0.98)'; }}
          onMouseUp={e => { e.currentTarget.style.transform = 'scale(1)'; }}
        >
          {submitted
            ? isLast ? 'Lihat hasil' : 'Soal berikutnya'
            : 'Kirim jawaban'
          }
          <ChevronRight size={17} />
        </button>
      </div>
    </Layout>
  );
}
