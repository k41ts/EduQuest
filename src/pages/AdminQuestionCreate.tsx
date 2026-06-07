import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { addDoc, collection } from 'firebase/firestore';
import AdminLayout from '../components/AdminLayout';
import { db } from '../firebase';
import { AdminSection, adminButton, adminCard, adminPage, adminStatCard, adminStatGrid, adminTitle } from '../components/adminUi';
import { QuestionEditorFields, defaultQuestionDraft, type QuestionDraft } from '../components/QuestionEditorFields';

export default function AdminQuestionCreate() {
  const navigate = useNavigate();
  const [draft, setDraft] = useState<QuestionDraft>(defaultQuestionDraft());
  const [saving, setSaving] = useState(false);

  async function handleCreate() {
    setSaving(true);
    try {
      await addDoc(collection(db, 'questions'), draft);
      navigate('/admin/questions');
    } finally {
      setSaving(false);
    }
  }

  return (
    <AdminLayout>
      <div style={adminPage}>
        <div style={{ marginBottom: 22, display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'start', flexWrap: 'wrap' }}>
          <div>
            <h2 style={adminTitle.title}>Generate Question</h2>
            <p style={adminTitle.subtitle}>Isi pertanyaan, 4 jawaban, jawaban benar, dan explanation lalu simpan ke Firestore.</p>
          </div>
          <Link to="/admin/questions" style={{ textDecoration: 'none' }}>
            <button type="button" style={adminButton('secondary')}>Back to Questions</button>
          </Link>
        </div>

        <div style={{ marginBottom: 18 }}>
          <div style={adminStatGrid}>
            <div style={adminStatCard}>
              <div style={{ fontSize: 12, color: '#726F86', marginBottom: 8 }}>Mode input</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: '#1F2240' }}>Full page</div>
            </div>
            <div style={adminStatCard}>
              <div style={{ fontSize: 12, color: '#726F86', marginBottom: 8 }}>Jawaban</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: '#1F2240' }}>1 - 4</div>
            </div>
            <div style={adminStatCard}>
              <div style={{ fontSize: 12, color: '#726F86', marginBottom: 8 }}>Status</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: '#1F2240' }}>Ready</div>
            </div>
          </div>
        </div>

        <div style={{ ...adminCard, padding: 24 }}>
          <AdminSection title="Create new question" subtitle="Gunakan field terpisah agar jawaban lebih gampang diubah." >
            <QuestionEditorFields draft={draft} onChange={setDraft} />
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 18 }}>
              <button type="button" onClick={handleCreate} style={adminButton('primary')} disabled={saving}>
                {saving ? 'Saving...' : 'Save Question'}
              </button>
            </div>
          </AdminSection>
        </div>
      </div>
    </AdminLayout>
  );
}
