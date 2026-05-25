import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { BookOpen, Brain, Calculator, ChevronRight, ChevronLeft, Check } from 'lucide-react';

const MAJORS = [
  'Teknik Informatika', 'Kedokteran', 'Hukum', 'Psikologi',
  'Ekonomi & Bisnis', 'Arsitektur', 'Ilmu Komunikasi', 'Farmasi',
  'Teknik Sipil', 'Pendidikan', 'Hubungan Internasional', 'Akuntansi',
];

const SUBJECTS = [
  {
    id: 'TPS',
    label: 'Tes Potensi Skolastik',
    shortLabel: 'TPS',
    desc: 'Penalaran umum, pemahaman bacaan, pengetahuan kuantitatif',
    icon: Brain,
    color: '#7F77DD',
    bg: '#EEEDFE',
  },
  {
    id: 'Literasi',
    label: 'Literasi',
    shortLabel: 'Literasi',
    desc: 'Literasi bahasa Indonesia & bahasa Inggris',
    icon: BookOpen,
    color: '#1D9E75',
    bg: '#E1F5EE',
  },
  {
    id: 'Matematika',
    label: 'Penalaran Matematika',
    shortLabel: 'Mat.',
    desc: 'Matematika dasar hingga lanjut',
    icon: Calculator,
    color: '#EF9F27',
    bg: '#FAEEDA',
  },
];

export default function Onboarding() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [step, setStep] = useState(1);
  const [selectedMajor, setSelectedMajor] = useState<string | null>(null);
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap';
    document.head.appendChild(link);
  }, []);

  function toggleSubject(id: string) {
    setSelectedSubjects(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  }

  async function handleFinish() {
    if (!currentUser || selectedSubjects.length === 0) return;
    setLoading(true);
    try {
      await updateDoc(doc(db, 'users', currentUser.uid), {
        targetMajor: selectedMajor,
        subjects: selectedSubjects,
        onboardingComplete: true,
      });
      navigate('/dashboard');
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const canNext = step === 1 ? selectedMajor !== null : selectedSubjects.length > 0;

  return (
    <div style={{
      minHeight: '100vh', width: '100%',
      background: '#EEEDFE',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'Plus Jakarta Sans, sans-serif',
      padding: '24px', position: 'relative', overflow: 'hidden',
    }}>

      {/* Background blobs */}
      <div style={{ position: 'absolute', top: -60, left: -60, width: 260, height: 260, borderRadius: '50%', background: '#AFA9EC', opacity: 0.3, pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: -80, right: -40, width: 320, height: 320, borderRadius: '50%', background: '#7F77DD', opacity: 0.2, pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', top: '40%', right: '8%', width: 120, height: 120, borderRadius: '50%', background: '#F0A84B', opacity: 0.15, pointerEvents: 'none' }} />
      {[
        { top: '15%', left: '12%' }, { top: '25%', left: '18%' },
        { top: '70%', right: '15%' }, { top: '80%', right: '22%' },
      ].map((pos, i) => (
        <div key={i} style={{
          position: 'absolute', width: 8, height: 8, borderRadius: '50%',
          background: '#7F77DD', opacity: 0.25, pointerEvents: 'none', ...pos,
        }} />
      ))}

      {/* Card */}
      <div style={{
        background: 'white', borderRadius: '28px', padding: '36px 32px',
        width: '100%', maxWidth: '480px', position: 'relative',
        boxShadow: '0 8px 40px rgba(127, 119, 221, 0.15)',
      }}>

        {/* Progress bar */}
        <div style={{ marginBottom: '28px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <span style={{ fontSize: '12px', fontWeight: '600', color: '#7F77DD' }}>
              Langkah {step} dari 2
            </span>
            <span style={{ fontSize: '12px', color: '#B4B2A9' }}>
              {step === 1 ? 'Jurusan target' : 'Mata pelajaran'}
            </span>
          </div>
          <div style={{ height: '6px', background: '#EEEDFE', borderRadius: '99px', overflow: 'hidden' }}>
            <div style={{
              height: '100%', borderRadius: '99px', background: '#7F77DD',
              width: step === 1 ? '50%' : '100%',
              transition: 'width 0.4s ease',
            }} />
          </div>
        </div>

        {/* Step 1 — Major selection */}
        {step === 1 && (
          <div>
            <div style={{ marginBottom: '20px' }}>
              <div style={{ fontSize: '20px', fontWeight: '700', color: '#26215C', marginBottom: '6px' }}>
                Jurusan yang kamu incar?
              </div>
              <div style={{ fontSize: '13px', color: '#888780' }}>
                Soal yang kamu dapat akan disesuaikan dengan jurusan ini
              </div>
            </div>

            <div style={{
              display: 'grid', gridTemplateColumns: '1fr 1fr',
              gap: '10px', marginBottom: '24px',
            }}>
              {MAJORS.map(major => {
                const selected = selectedMajor === major;
                return (
                  <button
                    key={major}
                    onClick={() => setSelectedMajor(major)}
                    style={{
                      padding: '12px 14px', borderRadius: '14px', textAlign: 'left',
                      border: `2px solid ${selected ? '#7F77DD' : '#EDE9FE'}`,
                      background: selected ? '#EEEDFE' : '#FDFCFF',
                      color: selected ? '#26215C' : '#555',
                      fontSize: '13px', fontWeight: selected ? '600' : '400',
                      cursor: 'pointer', fontFamily: 'Plus Jakarta Sans, sans-serif',
                      transition: 'all 0.15s', display: 'flex',
                      justifyContent: 'space-between', alignItems: 'center',
                    }}
                    onMouseEnter={e => { if (!selected) e.currentTarget.style.borderColor = '#AFA9EC'; }}
                    onMouseLeave={e => { if (!selected) e.currentTarget.style.borderColor = '#EDE9FE'; }}
                  >
                    {major}
                    {selected && (
                      <div style={{
                        width: '18px', height: '18px', borderRadius: '50%',
                        background: '#7F77DD', display: 'flex',
                        alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                      }}>
                        <Check size={11} color="white" strokeWidth={3} />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Step 2 — Subject selection */}
        {step === 2 && (
          <div>
            <div style={{ marginBottom: '20px' }}>
              <div style={{ fontSize: '20px', fontWeight: '700', color: '#26215C', marginBottom: '6px' }}>
                Mau latihan mapel apa?
              </div>
              <div style={{ fontSize: '13px', color: '#888780' }}>
                Pilih satu atau lebih — bisa diubah nanti
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '24px' }}>
              {SUBJECTS.map(({ id, label, desc, icon: Icon, color, bg }) => {
                const selected = selectedSubjects.includes(id);
                return (
                  <button
                    key={id}
                    onClick={() => toggleSubject(id)}
                    style={{
                      padding: '16px', borderRadius: '16px', textAlign: 'left',
                      border: `2px solid ${selected ? color : '#EDE9FE'}`,
                      background: selected ? bg : '#FDFCFF',
                      cursor: 'pointer', fontFamily: 'Plus Jakarta Sans, sans-serif',
                      display: 'flex', alignItems: 'center', gap: '14px',
                      transition: 'all 0.15s',
                    }}
                    onMouseEnter={e => { if (!selected) e.currentTarget.style.borderColor = '#AFA9EC'; }}
                    onMouseLeave={e => { if (!selected) e.currentTarget.style.borderColor = '#EDE9FE'; }}
                  >
                    {/* Icon */}
                    <div style={{
                      width: '44px', height: '44px', borderRadius: '12px',
                      background: selected ? color : '#EEEDFE',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                      transition: 'background 0.15s',
                    }}>
                      <Icon size={22} color={selected ? 'white' : '#AFA9EC'} strokeWidth={1.8} />
                    </div>

                    {/* Text */}
                    <div style={{ flex: 1 }}>
                      <div style={{
                        fontSize: '14px', fontWeight: '600',
                        color: selected ? '#26215C' : '#444', marginBottom: '3px',
                      }}>
                        {label}
                      </div>
                      <div style={{ fontSize: '12px', color: '#888780', lineHeight: '1.4' }}>
                        {desc}
                      </div>
                    </div>

                    {/* Checkbox */}
                    <div style={{
                      width: '22px', height: '22px', borderRadius: '6px', flexShrink: 0,
                      border: `2px solid ${selected ? color : '#D3D1C7'}`,
                      background: selected ? color : 'transparent',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      transition: 'all 0.15s',
                    }}>
                      {selected && <Check size={13} color="white" strokeWidth={3} />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Footer buttons */}
        <div style={{ display: 'flex', gap: '10px' }}>
          {step === 2 && (
            <button
              onClick={() => setStep(1)}
              style={{
                padding: '14px 20px', borderRadius: '14px',
                border: '2px solid #EDE9FE', background: 'white',
                color: '#7F77DD', fontSize: '14px', fontWeight: '600',
                cursor: 'pointer', fontFamily: 'Plus Jakarta Sans, sans-serif',
                display: 'flex', alignItems: 'center', gap: '6px',
                transition: 'all 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = '#EEEDFE'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'white'; }}
            >
              <ChevronLeft size={16} /> Kembali
            </button>
          )}

          <button
            onClick={step === 1 ? () => setStep(2) : handleFinish}
            disabled={!canNext || loading}
            style={{
              flex: 1, padding: '14px',
              background: canNext ? '#F0A84B' : '#E4E2DC',
              border: 'none', borderRadius: '14px',
              fontSize: '15px', fontWeight: '700',
              color: canNext ? '#fefcf9' : '#B4B2A9',
              cursor: canNext ? 'pointer' : 'not-allowed',
              fontFamily: 'Plus Jakarta Sans, sans-serif',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              transition: 'background 0.2s, transform 0.1s',
            }}
            onMouseEnter={e => { if (canNext) e.currentTarget.style.background = '#e09738'; }}
            onMouseLeave={e => { if (canNext) e.currentTarget.style.background = canNext ? '#F0A84B' : '#E4E2DC'; }}
            onMouseDown={e => { if (canNext) (e.currentTarget.style.transform = 'scale(0.98)'); }}
            onMouseUp={e => { e.currentTarget.style.transform = 'scale(1)'; }}
          >
            {loading ? 'Menyimpan...' : step === 1 ? (
              <><span>Lanjut</span><ChevronRight size={16} /></>
            ) : (
              <><span>Mulai belajar!</span><ChevronRight size={16} /></>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}