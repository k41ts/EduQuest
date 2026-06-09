import { useEffect, useMemo, useState } from 'react';
import AdminLayout from '../components/AdminLayout';
import { Link } from 'react-router-dom';
import { collection, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';
import {
  adminBadge,
  adminButton,
  adminCard,
  adminField,
  adminPage,
  adminHero,
  adminStatCard,
  adminStatGrid,
  adminTitle,
} from '../components/adminUi';
import { QuestionEditorFields, defaultQuestionDraft, type QuestionDraft } from '../components/QuestionEditorFields';

type QuestionDifficulty = 'all' | 'easy' | 'medium' | 'hard';
type QuestionSubjectFilter = 'all' | 'TPS' | 'Literasi' | 'Matematika';

function EditQuestionCard({
  question,
  onSaved,
  onClose,
}: {
  question: any;
  onSaved: () => void;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState<QuestionDraft>(defaultQuestionDraft(question));
  const [saving, setSaving] = useState(false);

  async function saveQuestion() {
    setSaving(true);
    try {
      await updateDoc(doc(db, 'questions', question.id), {
        ...draft,
      });
      onSaved();
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ ...adminCard, padding: 16, marginTop: 14, border: '1px solid rgba(127,119,221,0.22)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginBottom: 12 }}>
        <div>
          <div style={{ fontWeight: 800, color: '#1F2240' }}>Edit Question</div>
          <div style={{ fontSize: 12, color: '#726F86', marginTop: 4 }}>Ubah pertanyaan, jawaban 1-4, jawaban benar, dan explanation.</div>
        </div>
        <button type="button" onClick={onClose} style={adminButton('secondary')}>
          Close
        </button>
      </div>

      <div style={{ display: 'grid', gap: 12 }}>
        <QuestionEditorFields draft={draft} onChange={setDraft} />
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <button type="button" onClick={onClose} style={adminButton('secondary')}>
            Cancel
          </button>
          <button type="button" onClick={saveQuestion} style={adminButton('primary')} disabled={saving}>
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminQuestions() {
  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSubject, setActiveSubject] = useState<QuestionSubjectFilter>('all');
  const [difficultyFilter, setDifficultyFilter] = useState<QuestionDifficulty>('all');
  const [editingId, setEditingId] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const snap = await getDocs(collection(db, 'questions'));
    setQuestions(snap.docs.map(d => ({ id: d.id, ...(d.data() as any) })));
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function remove(id: string) {
    if (!confirm('Delete this question?')) return;
    await deleteDoc(doc(db, 'questions', id));
    await load();
  }

  const filteredQuestions = useMemo(() => {
    return questions.filter(q => {
      const subjectMatch = activeSubject === 'all' ? true : q.subject === activeSubject;
      const difficultyMatch = difficultyFilter === 'all' ? true : q.difficulty === difficultyFilter;
      return subjectMatch && difficultyMatch;
    });
  }, [questions, activeSubject, difficultyFilter]);

  const groupedBySubject = useMemo(() => {
    const groups: Record<string, any[]> = {
      'Matematika': [],
      'TPS': [],
      'Literasi': [],
    };
    questions.forEach(q => {
      if (groups[q.subject]) {
        groups[q.subject].push(q);
      }
    });
    return groups;
  }, [questions]);

  const subjectColors: Record<string, { bg: string; border: string; text: string; lightBg: string }> = {
    'Matematika': { bg: '#FF6B6B', border: '#FF5252', text: '#FFFFFF', lightBg: '#FFE8E8' },
    'TPS': { bg: '#4ECDC4', border: '#38BDB3', text: '#FFFFFF', lightBg: '#E0F7F6' },
    'Literasi': { bg: '#FFB84D', border: '#FFA500', text: '#FFFFFF', lightBg: '#FFF3E0' },
  };

  const correctGreen = '#10B981';

  return (
    <AdminLayout>
      <div style={adminPage}>
        <div style={adminHero}>
          <div style={{ minWidth: 0 }}>
            <h2 style={adminTitle.title}>Manage Questions</h2>
            <p style={adminTitle.subtitle}>Filter berdasarkan subject/difficulty, edit langsung, dan buat soal baru dari halaman khusus.</p>
          </div>

          <Link to="/admin/questions/new" style={{ textDecoration: 'none', flexShrink: 0 }}>
            <button type="button" style={adminButton('primary')}>
              + Tambah Pertanyaan
            </button>
          </Link>
        </div>

        <div style={{ marginBottom: 18 }}>
          <div style={adminStatGrid}>
            <div style={adminStatCard}>
              <div style={{ fontSize: 12, color: '#726F86', marginBottom: 8 }}>Matematika</div>
              <div style={{ fontSize: 26, fontWeight: 800, color: '#1F2240' }}>{groupedBySubject['Matematika'].length}</div>
            </div>
            <div style={adminStatCard}>
              <div style={{ fontSize: 12, color: '#726F86', marginBottom: 8 }}>TPS</div>
              <div style={{ fontSize: 26, fontWeight: 800, color: '#1F2240' }}>{groupedBySubject['TPS'].length}</div>
            </div>
            <div style={adminStatCard}>
              <div style={{ fontSize: 12, color: '#726F86', marginBottom: 8 }}>Literasi</div>
              <div style={{ fontSize: 26, fontWeight: 800, color: '#1F2240' }}>{groupedBySubject['Literasi'].length}</div>
            </div>
            <div style={adminStatCard}>
              <div style={{ fontSize: 12, color: '#726F86', marginBottom: 8 }}>Total soal</div>
              <div style={{ fontSize: 26, fontWeight: 800, color: '#1F2240' }}>{questions.length}</div>
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 18, alignItems: 'start' }}>
          <div>
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  {(['all', 'Matematika', 'TPS', 'Literasi'] as QuestionSubjectFilter[]).map(subject => {
                    const isActive = activeSubject === subject;
                    const label = subject === 'all' ? 'Semua Soal' : subject;
                    const count = subject === 'all' ? questions.length : groupedBySubject[subject]?.length || 0;
                    const colors = subject === 'all' ? { bg: '#7F77DD', border: '#6B65C4', text: '#FFFFFF', lightBg: '#F0ECFF' } : subjectColors[subject];

                    return (
                      <button
                        key={subject}
                        onClick={() => setActiveSubject(subject)}
                        style={{
                          padding: '14px 24px',
                          borderRadius: 12,
                          border: isActive ? 'none' : `2px solid ${colors.bg}20`,
                          background: isActive
                            ? `linear-gradient(135deg, ${colors.bg} 0%, ${colors.border} 100%)`
                            : colors.lightBg,
                          color: isActive ? colors.text : colors.bg,
                          fontWeight: isActive ? 700 : 600,
                          cursor: 'pointer',
                          fontSize: 15,
                          transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
                          boxShadow: isActive
                            ? `0 8px 20px ${colors.bg}30, inset 0 1px 0 ${colors.text}20`
                            : '0 2px 8px rgba(0, 0, 0, 0.04)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                          position: 'relative',
                          overflow: 'hidden',
                          transform: isActive ? 'scale(1)' : 'scale(1)',
                        }}
                        onMouseEnter={(e) => {
                          const button = e.currentTarget;
                          if (!isActive) {
                            button.style.background = `${colors.lightBg}`;
                            button.style.borderColor = colors.bg;
                            button.style.color = colors.bg;
                            button.style.transform = 'scale(1.05)';
                            button.style.boxShadow = `0 4px 16px ${colors.bg}20`;
                          } else {
                            button.style.transform = 'scale(1.02)';
                            button.style.boxShadow = `0 12px 28px ${colors.bg}40, inset 0 1px 0 ${colors.text}20`;
                          }
                        }}
                        onMouseLeave={(e) => {
                          const button = e.currentTarget;
                          if (!isActive) {
                            button.style.background = colors.lightBg;
                            button.style.borderColor = `${colors.bg}20`;
                            button.style.color = colors.bg;
                            button.style.transform = 'scale(1)';
                            button.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.04)';
                          } else {
                            button.style.transform = 'scale(1)';
                            button.style.boxShadow = `0 8px 20px ${colors.bg}30, inset 0 1px 0 ${colors.text}20`;
                          }
                        }}
                      >
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: 10,
                          height: 10,
                          borderRadius: '50%',
                          background: isActive ? colors.text : colors.bg,
                          opacity: isActive ? 1 : 0.6,
                          transition: 'all 0.3s ease',
                        }} />
                        <span style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                          {label}
                          <span style={{
                            fontSize: 12,
                            opacity: 0.7,
                            fontWeight: isActive ? 600 : 500,
                            background: isActive ? 'rgba(255,255,255,0.2)' : colors.bg + '15',
                            padding: '2px 8px',
                            borderRadius: 4,
                          }}>
                            {count}
                          </span>
                        </span>
                      </button>
                    );
                  })}
                </div>

                <select
                  value={difficultyFilter}
                  onChange={e => setDifficultyFilter(e.target.value as QuestionDifficulty)}
                  style={{
                    ...adminField,
                    padding: '12px 16px',
                    fontSize: 14,
                    borderRadius: 10,
                    border: '1px solid #E8E5F0',
                    background: '#FCFCFF',
                    cursor: 'pointer',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
                    fontWeight: 500,
                    color: '#2E3152',
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = '#7F77DD';
                    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(127, 119, 221, 0.1), 0 2px 8px rgba(0, 0, 0, 0.06)';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = '#E8E5F0';
                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.06)';
                  }}
                >
                  <option value="all">Semua Difficulty</option>
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>
            </div>

            {loading ? (
              <div style={{ color: '#726F86', padding: '40px 20px', textAlign: 'center' }}>Loading…</div>
            ) : (
              <div style={{ display: 'grid', gap: 16 }}>
                {filteredQuestions.length > 0 ? (
                  filteredQuestions.map(q => {
                    const isEditing = editingId === q.id;
                    const qColors = subjectColors[q.subject] || { bg: '#7F77DD', border: '#6B65C4', text: '#FFFFFF', lightBg: '#F0ECFF' };
                    return (
                      <div
                        key={q.id}
                        style={{
                          ...adminCard,
                          padding: 20,
                          border: '1px solid #E8E5F0',
                          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
                          transition: 'all 0.3s ease',
                          borderLeft: `4px solid ${qColors.bg}`,
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.12)';
                          e.currentTarget.style.transform = 'translateY(-2px)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.04)';
                          e.currentTarget.style.transform = 'translateY(0)';
                        }}
                      >
                        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 132px', gap: 16, alignItems: 'start' }}>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
                              <span style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 6,
                                padding: '6px 12px',
                                borderRadius: 6,
                                background: qColors.lightBg,
                                color: qColors.bg,
                                fontSize: 12,
                                fontWeight: 700,
                              }}>
                                <span style={{
                                  display: 'inline-block',
                                  width: 6,
                                  height: 6,
                                  borderRadius: '50%',
                                  background: qColors.bg,
                                }} />
                                {q.subject}
                              </span>
                              <span style={adminBadge(q.difficulty as any)}>{q.difficulty}</span>
                            </div>

                            <div style={{ fontSize: 18, fontWeight: 800, color: '#1F2240', lineHeight: 1.55, whiteSpace: 'pre-wrap' }}>
                              {q.text}
                            </div>

                            <div style={{ marginTop: 16, display: 'grid', gap: 10 }}>
                              {(q.options || []).map((option: string, index: number) => (
                                <div
                                  key={`${q.id}-${index}`}
                                  style={{
                                    display: 'flex',
                                    gap: 10,
                                    alignItems: 'flex-start',
                                    padding: '12px 14px',
                                    borderRadius: 12,
                                    background: index === q.correctIndex ? '#ECFDF5' : '#FCFCFF',
                                    border: index === q.correctIndex ? `2px solid ${correctGreen}` : '1px solid #ECEAF7',
                                    transition: 'all 0.2s ease',
                                  }}
                                >
                                  <span style={{ ...adminBadge('neutral'), minWidth: 32, justifyContent: 'center' }}>{index + 1}</span>
                                  <span style={{ flex: 1, color: '#2E3152', fontSize: 14, lineHeight: 1.55 }}>
                                    {option}
                                    {index === q.correctIndex && <strong style={{ color: correctGreen }}> (correct)</strong>}
                                  </span>
                                </div>
                              ))}
                            </div>

                            <div style={{ marginTop: 14, color: '#726F86', fontSize: 12, lineHeight: 1.8 }}>
                              <strong style={{ color: '#4B4761' }}>Explanation:</strong> {q.explanation}
                            </div>
                          </div>

                          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, minWidth: 132 }}>
                            <button type="button" onClick={() => navigator.clipboard.writeText(q.id)} style={adminButton('secondary')}>
                              Copy ID
                            </button>
                            <button type="button" onClick={() => setEditingId(isEditing ? null : q.id)} style={adminButton('primary')}>
                              {isEditing ? 'Close Edit' : 'Edit'}
                            </button>
                            <button type="button" onClick={() => remove(q.id)} style={adminButton('danger')}>
                              Delete
                            </button>
                          </div>
                        </div>

                        {isEditing && (
                          <EditQuestionCard
                            question={q}
                            onSaved={load}
                            onClose={() => setEditingId(null)}
                          />
                        )}
                      </div>
                    );
                  })
                ) : (
                  <div style={{ color: '#726F86', padding: '40px 20px', textAlign: 'center', ...adminCard }}>
                    Tidak ada soal yang cocok dengan filter ini.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
