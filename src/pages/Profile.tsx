import { useState } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import {
  BookOpen,
  Brain,
  Calculator,
  Check,
  Crown,
  Edit2,
  Flame,
  Mail,
  Target,
  Trophy,
  User,
  Zap,
} from 'lucide-react';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import Layout from '../components/Layout';
import { BADGE_DEFINITIONS } from '../utils/questUtils';

const SUBJECT_META: Record<string, { color: string; bg: string; icon: typeof BookOpen }> = {
  TPS: { color: '#7F77DD', bg: '#EEEDFE', icon: Brain },
  Literasi: { color: '#1D9E75', bg: '#E1F5EE', icon: BookOpen },
  Matematika: { color: '#EF9F27', bg: '#FAEEDA', icon: Calculator },
};

const cardStyle = {
  background: 'white',
  border: '1px solid #EDE9FE',
  borderRadius: '16px',
};

export default function Profile() {
  const { currentUser, userProfile, refreshProfile } = useAuth();
  const [editing, setEditing] = useState(false);
  const [newName, setNewName] = useState(userProfile?.name ?? '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const xp = userProfile?.xp ?? 0;
  const level = userProfile?.level ?? 1;
  const streak = userProfile?.streak ?? 0;
  const subjects = userProfile?.subjects ?? [];
  const badges = userProfile?.badges ?? [];
  const xpPerLevel = level * 500;
  const xpProgress = xp % xpPerLevel;
  const xpPct = Math.min((xpProgress / xpPerLevel) * 100, 100);
  const nextLevelXp = xpPerLevel - xpProgress;

  const initials = userProfile?.name
    ? userProfile.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : '?';

  async function handleSaveName() {
    if (!currentUser || !newName.trim()) return;
    setSaving(true);
    try {
      await updateDoc(doc(db, 'users', currentUser.uid), { name: newName.trim() });
      await refreshProfile();
      setEditing(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Layout>
      <style>
        {`
          .profile-page {
            padding: 24px;
            display: flex;
            flex-direction: column;
            gap: 16px;
          }

          .profile-hero {
            display: grid;
            grid-template-columns: minmax(0, 1fr) 260px;
            gap: 16px;
            align-items: stretch;
          }

          .profile-identity {
            min-width: 0;
            display: flex;
            align-items: center;
            gap: 16px;
          }

          .profile-stats-grid {
            display: grid;
            grid-template-columns: repeat(4, minmax(0, 1fr));
            gap: 14px;
          }

          .profile-content-grid {
            display: grid;
            grid-template-columns: minmax(0, 1.45fr) minmax(280px, 0.8fr);
            gap: 16px;
            align-items: start;
          }

          .profile-badge-grid {
            display: grid;
            grid-template-columns: repeat(3, minmax(0, 1fr));
            gap: 10px;
          }

          @media (max-width: 980px) {
            .profile-hero,
            .profile-content-grid {
              grid-template-columns: 1fr;
            }

            .profile-stats-grid {
              grid-template-columns: repeat(2, minmax(0, 1fr));
            }
          }

          @media (max-width: 620px) {
            .profile-page {
              padding: 16px;
            }

            .profile-identity {
              align-items: flex-start;
              flex-direction: column;
            }

            .profile-stats-grid,
            .profile-badge-grid {
              grid-template-columns: 1fr;
            }
          }
        `}
      </style>

      <div className="profile-page">
        <section className="profile-hero">
          <div style={{
            ...cardStyle,
            overflow: 'hidden',
            position: 'relative',
            background: 'linear-gradient(135deg, #26215C 0%, #534AB7 100%)',
            borderRadius: '20px',
            padding: '28px 32px',
          }}>

            <div className="profile-identity" style={{ position: 'relative' }}>
              <div style={{
                width: '72px',
                height: '72px',
                borderRadius: '18px',
                background: 'rgba(255,255,255,0.1)',
                border: '1px solid rgba(255,255,255,0.3)',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '24px',
                fontWeight: '700',
                flexShrink: 0,
              }}>
                {initials}
              </div>

              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '7px',
                  padding: '5px 10px',
                  borderRadius: '99px',
                  background: 'rgba(255,255,255,0.13)',
                  color: 'rgba(255,255,255,0.82)',
                  fontSize: '12px',
                  fontWeight: '600',
                  marginBottom: '10px',
                }}>
                  <Crown size={14} color="#F0A84B" /> Level {level} Learner
                </div>

                {editing ? (
                  <div style={{ maxWidth: '420px' }}>
                    <input
                      value={newName}
                      onChange={e => setNewName(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '11px 13px',
                        borderRadius: '12px',
                        border: '1px solid rgba(255,255,255,0.45)',
                        outline: 'none',
                        fontSize: '16px',
                        fontWeight: '700',
                        fontFamily: 'Plus Jakarta Sans, sans-serif',
                        color: '#26215C',
                        boxSizing: 'border-box',
                      }}
                    />
                    <div style={{ display: 'flex', gap: '8px', marginTop: '10px', flexWrap: 'wrap' }}>
                      <button
                        onClick={() => setEditing(false)}
                        style={{
                          padding: '10px 14px',
                          borderRadius: '10px',
                          border: '1px solid rgba(255,255,255,0.32)',
                          background: 'rgba(255,255,255,0.12)',
                          fontSize: '13px',
                          color: 'white',
                          cursor: 'pointer',
                          fontFamily: 'Plus Jakarta Sans, sans-serif',
                        }}
                      >
                        Batal
                      </button>
                      <button
                        onClick={handleSaveName}
                        disabled={saving}
                        style={{
                          padding: '10px 16px',
                          borderRadius: '10px',
                          border: 'none',
                          background: '#F0A84B',
                          fontSize: '13px',
                          color: '#fefcf9',
                          fontWeight: '700',
                          cursor: saving ? 'not-allowed' : 'pointer',
                          fontFamily: 'Plus Jakarta Sans, sans-serif',
                          opacity: saving ? 0.7 : 1,
                        }}
                      >
                        {saving ? 'Menyimpan...' : 'Simpan'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                    <h1 style={{
                      fontSize: '24px',
                      lineHeight: 1.2,
                      fontWeight: '700',
                      color: 'white',
                      overflowWrap: 'anywhere',
                    }}>
                      {userProfile?.name ?? 'User'}
                    </h1>
                    <button
                      aria-label="Edit nama"
                      title="Edit nama"
                      onClick={() => { setEditing(true); setNewName(userProfile?.name ?? ''); }}
                      style={{
                        width: '34px',
                        height: '34px',
                        borderRadius: '10px',
                        background: 'rgba(255,255,255,0.12)',
                        border: '1px solid rgba(255,255,255,0.24)',
                        cursor: 'pointer',
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <Edit2 size={16} />
                    </button>
                  </div>
                )}

                <div style={{
                  display: 'flex',
                  gap: '12px',
                  flexWrap: 'wrap',
                  color: 'rgba(255,255,255,0.72)',
                  fontSize: '13px',
                  marginTop: '10px',
                }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', minWidth: 0 }}>
                    <Mail size={14} /> {userProfile?.email}
                  </span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    <Target size={14} /> {userProfile?.targetMajor || 'Belum ada target'}
                  </span>
                </div>

                {saved && (
                  <div style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    marginTop: '12px',
                    color: '#DDF8EC',
                    fontSize: '13px',
                    fontWeight: '700',
                  }}>
                    <Check size={14} /> Nama diperbarui
                  </div>
                )}
              </div>
            </div>
          </div>

          <div style={{ ...cardStyle, padding: '22px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '14px', marginBottom: '12px' }}>
              <div>
                <div style={{ fontSize: '12px', color: '#888780', marginBottom: '4px' }}>Progress level</div>
                <div style={{ fontSize: '24px', fontWeight: '700', color: '#26215C' }}>
                  {xpProgress} XP
                </div>
              </div>
              <div style={{
                width: '46px',
                height: '46px',
                borderRadius: '14px',
                background: '#FAEEDA',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}>
                <Zap size={22} color="#EF9F27" />
              </div>
            </div>
            <div style={{ height: '10px', background: '#EEEDFE', borderRadius: '99px', overflow: 'hidden', marginBottom: '10px' }}>
              <div style={{
                height: '100%',
                borderRadius: '99px',
                background: 'linear-gradient(90deg, #7F77DD, #F0A84B)',
                width: `${xpPct}%`,
                transition: 'width 0.5s ease',
              }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#888780', fontSize: '12px' }}>
              <span>Level {level}</span>
              <span>{nextLevelXp} XP ke level berikutnya</span>
            </div>
          </div>
        </section>

        <section className="profile-stats-grid">
          {[
            { label: 'Total XP', value: `${xp}`, icon: Zap, color: '#7F77DD', bg: '#EEEDFE' },
            { label: 'Level', value: `${level}`, icon: Trophy, color: '#1D9E75', bg: '#E1F5EE' },
            { label: 'Streak aktif', value: `${streak} hari`, icon: Flame, color: '#EF9F27', bg: '#FAEEDA' },
            { label: 'Mapel aktif', value: `${subjects.length}`, icon: User, color: '#D85A30', bg: '#FAECE7' },
          ].map(({ label, value, icon: Icon, color, bg }) => (
            <div key={label} style={{ ...cardStyle, padding: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                background: bg,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}>
                <Icon size={19} color={color} strokeWidth={1.8} />
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: '24px', lineHeight: 1, fontWeight: '700', color, overflowWrap: 'anywhere' }}>
                  {value}
                </div>
                <div style={{ fontSize: '12px', color: '#888780', marginTop: '5px' }}>{label}</div>
              </div>
            </div>
          ))}
        </section>

        <section className="profile-content-grid">
          <div style={{ ...cardStyle, padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <div>
                <div style={{ fontSize: '15px', fontWeight: '700', color: '#26215C' }}>Badge koleksi</div>
                <div style={{ fontSize: '12px', color: '#888780', marginTop: '4px' }}>
                  {badges.length} dari {BADGE_DEFINITIONS.length} sudah terbuka
                </div>
              </div>
              <div style={{
                width: '44px',
                height: '44px',
                borderRadius: '14px',
                background: '#EEEDFE',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}>
                <Trophy size={20} color="#7F77DD" />
              </div>
            </div>

            <div className="profile-badge-grid">
              {BADGE_DEFINITIONS.map(({ id, label, desc, icon: Icon, color, bg }) => {
                const isUnlocked = badges.includes(id);
                return (
                  <div key={id} style={{
                    borderRadius: '12px',
                    padding: '14px',
                    background: isUnlocked ? bg : '#F7F6F2',
                    border: `1px solid ${isUnlocked ? color : '#E4E2DC'}`,
                    opacity: isUnlocked ? 1 : 0.72,
                    minHeight: '126px',
                  }}>
                    <div style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: '12px',
                      background: isUnlocked ? color : '#D8D5CA',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: '10px',
                    }}>
                      <Icon size={20} color="white" strokeWidth={1.9} />
                    </div>
                    <div style={{
                      fontSize: '13px',
                      fontWeight: '700',
                      color: isUnlocked ? '#26215C' : '#8F8B80',
                      marginBottom: '4px',
                      overflowWrap: 'anywhere',
                    }}>
                      {label}
                    </div>
                    <div style={{ fontSize: '11px', color: isUnlocked ? '#6F6A60' : '#AAA69B', lineHeight: 1.45 }}>
                      {desc}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ ...cardStyle, padding: '20px' }}>
              <div style={{ fontSize: '15px', fontWeight: '700', color: '#26215C', marginBottom: '14px' }}>
                Mata pelajaran aktif
              </div>

              {subjects.length === 0 ? (
                <div style={{
                  background: '#F7F6F2',
                  border: '1px dashed #D8D5CA',
                  borderRadius: '14px',
                  padding: '18px',
                  color: '#888780',
                  fontSize: '13px',
                  lineHeight: 1.5,
                }}>
                  Belum ada mata pelajaran aktif.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {subjects.map(subject => {
                    const meta = SUBJECT_META[subject] ?? SUBJECT_META.TPS;
                    const Icon = meta.icon;
                    return (
                      <div key={subject} style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '12px',
                        borderRadius: '14px',
                        background: meta.bg,
                        border: `1px solid ${meta.color}22`,
                      }}>
                        <div style={{
                          width: '38px',
                          height: '38px',
                          borderRadius: '11px',
                          background: meta.color,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}>
                          <Icon size={18} color="white" strokeWidth={1.8} />
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontSize: '13px', fontWeight: '600', color: '#26215C', overflowWrap: 'anywhere' }}>
                            {subject}
                          </div>
                          <div style={{ fontSize: '11px', color: '#888780', marginTop: '3px' }}>
                            Aktif di quest kamu
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div style={{
              ...cardStyle,
              padding: '20px',
              background: 'linear-gradient(135deg, #FFF8EC 0%, #FFFFFF 100%)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '11px',
                  background: '#FAEEDA',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <Flame size={18} color="#EF9F27" />
                </div>
                <div style={{ fontSize: '15px', fontWeight: '700', color: '#26215C' }}>
                  Ritme belajar
                </div>
              </div>
              <div style={{ fontSize: '13px', color: '#6F6A60', lineHeight: 1.55 }}>
                Kamu punya streak {streak} hari dan sudah mengumpulkan {xp} XP.
              </div>
            </div>
          </div>
        </section>
      </div>
    </Layout>
  );
}
