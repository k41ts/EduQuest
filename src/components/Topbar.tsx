import { useAuth } from '../contexts/AuthContext';
import { Flame, Star } from 'lucide-react';

export default function Topbar() {
  const { userProfile } = useAuth();

  return (
    <div style={{
      padding: '14px 24px', background: 'white',
      borderBottom: '1px solid #EDE9FE',
      display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
      gap: '10px', flexShrink: 0,
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: '6px',
        background: '#FAEEDA', borderRadius: '10px', padding: '6px 14px',
      }}>
        <Flame size={15} color="#EF9F27" />
        <span style={{ fontSize: '13px', fontWeight: '700', color: '#412402' }}>
          {userProfile?.streak ?? 0} hari
        </span>
      </div>
      <div style={{
        display: 'flex', alignItems: 'center', gap: '6px',
        background: '#EEEDFE', borderRadius: '10px', padding: '6px 14px',
      }}>
        <Star size={15} color="#7F77DD" />
        <span style={{ fontSize: '13px', fontWeight: '700', color: '#26215C' }}>
          {userProfile?.xp ?? 0} XP
        </span>
      </div>
    </div>
  );
}