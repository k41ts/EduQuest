import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Layout from '../components/Layout';
import type { Question } from '../types';
import { fetchQuestions, getRandomQuestions, XP_MAP } from '../utils/questUtils';
import { Clock, ChevronRight, BookOpen, Brain, Calculator, Zap } from 'lucide-react';

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

  // ✅ UPDATED: async question loader
  useEffect(() => {
    async function loadQuestions() {
      try {
        setLoading(true);

        const all = await fetchQuestions();
        const qs = getRandomQuestions(
          all,
          userProfile?.subjects ?? [],
          10
        );

        setQuestions(qs);
        setAnswers(new Array(qs.length).fill(null));
      } finally {
        setLoading(false);
      }
    }

    if (userProfile) {
      loadQuestions();
    }
  }, [userProfile]);

  // timer logic
  useEffect(() => {
    if (submitted || questions.length === 0) return;

    if (timeLeft <= 0) {
      const newAnswers = [...answers];
      newAnswers[index] = null;
      setAnswers(newAnswers);
      setSubmitted(true);
      return;
    }

    const t = setTimeout(() => setTimeLeft(t => t - 1), 1000);
    return () => clearTimeout(t);
  }, [timeLeft, submitted, questions]);

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
      navigate('/quest/results', {
        state: { questions, answers, xpEarned },
      });
      return;
    }

    setIndex(i => i + 1);
    setSelected(null);
    setSubmitted(false);
    setTimeLeft(TIMER);
  }

  // loading state
  if (loading || questions.length === 0) {
    return (
      <Layout>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
          <div style={{ fontSize: '14px', color: '#888780' }}>
            Memuat soal...
          </div>
        </div>
      </Layout>
    );
  }

  const q = questions[index];
  const timerColor = timeLeft > 30 ? '#7F77DD' : timeLeft > 10 ? '#EF9F27' : '#D85A30';
  const subjectMeta = SUBJECT_META[q.subject] ?? SUBJECT_META['TPS'];
  const diffMeta = DIFF_META[q.difficulty] ?? DIFF_META['medium'];
  const SubjectIcon = subjectMeta.icon;

  return (
    <Layout>
      <div style={{ padding: '24px', maxWidth: '760px', margin: '0 auto' }}>

        {/* Progress + timer */}
        <div style={{
          background: 'white',
          borderRadius: '16px',
          padding: '16px 20px',
          border: '1px solid #EDE9FE',
          marginBottom: '16px',
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
        }}>
          <div style={{ display: 'flex', gap: '5px', flex: 1 }}>
            {questions.map((_, i) => (
              <div
                key={i}
                style={{
                  flex: 1,
                  height: '7px',
                  borderRadius: '99px',
                  background: i < index ? '#7F77DD' : i === index ? '#F0A84B' : '#EDE9FE',
                }}
              />
            ))}
          </div>

          <span style={{ fontSize: '13px', fontWeight: '600', color: '#888780' }}>
            {index + 1} / {questions.length}
          </span>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: timeLeft <= 10 ? '#FAECE7' : '#EEEDFE',
            borderRadius: '10px',
            padding: '6px 12px',
          }}>
            <Clock size={14} color={timerColor} />
            <span style={{ fontSize: '13px', fontWeight: '700', color: timerColor }}>
              {String(Math.floor(timeLeft / 60)).padStart(2, '0')}:
              {String(timeLeft % 60).padStart(2, '0')}
            </span>
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            background: '#FAEEDA',
            borderRadius: '10px',
            padding: '6px 12px',
          }}>
            <Zap size={14} color="#EF9F27" />
            <span style={{ fontSize: '13px', fontWeight: '700', color: '#412402' }}>
              +{xpEarned} XP
            </span>
          </div>
        </div>

        {/* Question */}
        <div style={{
          background: 'white',
          borderRadius: '16px',
          padding: '24px',
          border: '1px solid #EDE9FE',
          marginBottom: '14px',
        }}>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
            <span style={{
              background: subjectMeta.bg,
              color: subjectMeta.color,
              fontSize: '11px',
              fontWeight: '600',
              padding: '4px 12px',
              borderRadius: '99px',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
            }}>
              <SubjectIcon size={12} /> {q.subject}
            </span>

            <span style={{
              background: diffMeta.bg,
              color: diffMeta.color,
              fontSize: '11px',
              fontWeight: '600',
              padding: '4px 12px',
              borderRadius: '99px',
            }}>
              {diffMeta.label}
            </span>
          </div>

          <div style={{ fontSize: '16px', fontWeight: '600', color: '#26215C' }}>
            {q.text}
          </div>
        </div>

        {/* Options */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          {q.options.map((opt, i) => {
            const isSelected = selected === i;
            const showCorrect = submitted && i === q.correctIndex;
            const showWrong = submitted && isSelected && i !== q.correctIndex;

            let border = '2px solid #EDE9FE';
            let bg = '#FDFCFF';
            let color = '#444';

            if (showCorrect) {
              border = '2px solid #1D9E75';
              bg = '#E1F5EE';
              color = '#0F6E56';
            } else if (showWrong) {
              border = '2px solid #D85A30';
              bg = '#FAECE7';
              color = '#993C1D';
            } else if (isSelected) {
              border = '2px solid #7F77DD';
              bg = '#EEEDFE';
              color = '#26215C';
            }

            return (
              <button
                key={i}
                onClick={() => !submitted && setSelected(i)}
                style={{
                  padding: '14px',
                  borderRadius: '14px',
                  border,
                  background: bg,
                  color,
                  cursor: submitted ? 'default' : 'pointer',
                }}
              >
                {opt}
              </button>
            );
          })}
        </div>

        {/* Action */}
        <button
          onClick={submitted ? handleNext : handleSubmit}
          disabled={!submitted && selected === null}
          style={{
            width: '100%',
            marginTop: '14px',
            padding: '14px',
            borderRadius: '14px',
            border: 'none',
            background: submitted ? '#F0A84B' : selected !== null ? '#7F77DD' : '#E4E2DC',
            color: 'white',
            fontWeight: '700',
            cursor: (!submitted && selected === null) ? 'not-allowed' : 'pointer',
          }}
        >
          {submitted
            ? index + 1 >= questions.length ? 'Lihat hasil' : 'Soal berikutnya'
            : 'Kirim jawaban'
          }
          <ChevronRight size={17} />
        </button>
      </div>
    </Layout>
  );
}