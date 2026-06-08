import { useEffect, useMemo, useState } from 'react';
import AdminLayout from '../components/AdminLayout';
import { Link } from 'react-router-dom';
import { collection, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';
import {
  AdminSection,
  adminBadge,
  adminButton,
  adminCard,
  adminField,
  adminPage,
  adminHero,
  adminStatCard,
  adminStatGrid,
  adminTitle,
  adminToolbar,
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
  const [subjectFilter, setSubjectFilter] = useState<QuestionSubjectFilter>('all');
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
      const subjectMatch = subjectFilter === 'all' ? true : q.subject === subjectFilter;
      const difficultyMatch = difficultyFilter === 'all' ? true : q.difficulty === difficultyFilter;
      return subjectMatch && difficultyMatch;
    });
  }, [questions, subjectFilter, difficultyFilter]);

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
              <div style={{ fontSize: 12, color: '#726F86', marginBottom: 8 }}>Total soal</div>
              <div style={{ fontSize: 26, fontWeight: 800, color: '#1F2240' }}>{questions.length}</div>
            </div>
            <div style={adminStatCard}>
              <div style={{ fontSize: 12, color: '#726F86', marginBottom: 8 }}>Tampil sekarang</div>
              <div style={{ fontSize: 26, fontWeight: 800, color: '#1F2240' }}>{filteredQuestions.length}</div>
            </div>
            <div style={adminStatCard}>
              <div style={{ fontSize: 12, color: '#726F86', marginBottom: 8 }}>Mode edit</div>
              <div style={{ fontSize: 26, fontWeight: 800, color: '#1F2240' }}>{editingId ? 'Active' : 'Idle'}</div>
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 18, alignItems: 'start' }}>
          <AdminSection
            title="Existing questions"
            subtitle={`${filteredQuestions.length} soal tampil dari ${questions.length} total soal`}
            actions={
              <div style={adminToolbar}>
                <select value={subjectFilter} onChange={e => setSubjectFilter(e.target.value as QuestionSubjectFilter)} style={adminField}>
                  <option value="all">All subjects</option>
                  <option value="TPS">TPS</option>
                  <option value="Literasi">Literasi</option>
                  <option value="Matematika">Matematika</option>
                </select>
                <select value={difficultyFilter} onChange={e => setDifficultyFilter(e.target.value as QuestionDifficulty)} style={adminField}>
                  <option value="all">All difficulty</option>
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>
            }
          >
            {loading ? (
              <div style={{ color: '#726F86' }}>Loading…</div>
            ) : (
              <div style={{ display: 'grid', gap: 16 }}>
                {filteredQuestions.map(q => {
                  const isEditing = editingId === q.id;
                  return (
                    <div key={q.id} style={{ ...adminCard, padding: 20 }}>
                      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 132px', gap: 16, alignItems: 'start' }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
                            <span style={adminBadge('admin')}>{q.subject}</span>
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
                                  background: index === q.correctIndex ? '#EFF6FF' : '#FCFCFF',
                                  border: index === q.correctIndex ? '1px solid #BFDBFE' : '1px solid #ECEAF7',
                                }}
                              >
                                <span style={{ ...adminBadge('neutral'), minWidth: 32, justifyContent: 'center' }}>{index + 1}</span>
                                <span style={{ flex: 1, color: '#2E3152', fontSize: 14, lineHeight: 1.55 }}>
                                  {option}
                                  {index === q.correctIndex && <strong style={{ color: '#2563EB' }}> (correct)</strong>}
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
                })}

                {!filteredQuestions.length && (
                  <div style={{ color: '#726F86', padding: '20px 6px' }}>Tidak ada soal yang cocok dengan filter ini.</div>
                )}
              </div>
            )}
          </AdminSection>

        </div>
      </div>
    </AdminLayout>
  );
}
