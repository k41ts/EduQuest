import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { Clock, HelpCircle, ChevronRight } from 'lucide-react';

const MOCK_TESTS = [
  {
    id: 'utbk-full',
    name: 'UTBK Full Simulation',
    desc: 'Simulasi lengkap semua mata pelajaran',
    subjects: ['TPS', 'Literasi', 'Matematika'],
    questionCount: 15,
    durationMinutes: 25,
    tag: 'Terlengkap', tagColor: '#7F77DD', tagBg: '#EEEDFE',
  },
  {
    id: 'tps-drill',
    name: 'TPS Drill',
    desc: 'Fokus latihan Tes Potensi Skolastik',
    subjects: ['TPS'],
    questionCount: 5,
    durationMinutes: 10,
    tag: 'Populer', tagColor: '#EF9F27', tagBg: '#FAEEDA',
  },
  {
    id: 'mat-drill',
    name: 'Matematika Drill',
    desc: 'Fokus latihan Penalaran Matematika',
    subjects: ['Matematika'],
    questionCount: 6,
    durationMinutes: 12,
    tag: null, tagColor: '', tagBg: '',
  },
];

export default function Mock() {
  const navigate = useNavigate();

  return (
    <Layout>
      <div style={{ padding: '24px', maxWidth: '720px', margin: '0 auto' }}>
        <div style={{ marginBottom: '20px' }}>
          <div style={{ fontSize: '20px', fontWeight: '700', color: '#26215C', marginBottom: '4px' }}>
            Mock Test
          </div>
          <div style={{ fontSize: '13px', color: '#888780' }}>
            Simulasi ujian UTBK — tanpa feedback sampai selesai
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {MOCK_TESTS.map(test => (
            <div key={test.id} style={{
              background: 'white', borderRadius: '16px', padding: '20px 24px',
              border: '1px solid #EDE9FE',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '20px',
            }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                  <div style={{ fontSize: '15px', fontWeight: '700', color: '#26215C' }}>
                    {test.name}
                  </div>
                  {test.tag && (
                    <span style={{
                      background: test.tagBg, color: test.tagColor,
                      fontSize: '11px', fontWeight: '600', padding: '2px 10px', borderRadius: '99px',
                    }}>
                      {test.tag}
                    </span>
                  )}
                </div>
                <div style={{ fontSize: '12px', color: '#888780', marginBottom: '10px' }}>
                  {test.desc}
                </div>
                <div style={{ display: 'flex', gap: '14px' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#888780' }}>
                    <HelpCircle size={13} color="#AFA9EC" /> {test.questionCount} soal
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#888780' }}>
                    <Clock size={13} color="#AFA9EC" /> {test.durationMinutes} menit
                  </span>
                  <span style={{ display: 'flex', gap: '4px' }}>
                    {test.subjects.map(s => (
                      <span key={s} style={{
                        fontSize: '11px', fontWeight: '600', padding: '1px 8px',
                        borderRadius: '99px', background: '#EEEDFE', color: '#7F77DD',
                      }}>{s}</span>
                    ))}
                  </span>
                </div>
              </div>

              <button
                onClick={() => navigate('/mock/session', { state: test })}
                style={{
                  padding: '10px 20px', borderRadius: '12px',
                  background: '#7F77DD', border: 'none',
                  color: 'white', fontSize: '13px', fontWeight: '700',
                  cursor: 'pointer', fontFamily: 'Plus Jakarta Sans, sans-serif',
                  display: 'flex', alignItems: 'center', gap: '6px',
                  flexShrink: 0, transition: 'background 0.15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = '#534AB7'; }}
                onMouseLeave={e => { e.currentTarget.style.background = '#7F77DD'; }}
              >
                Mulai <ChevronRight size={15} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
}