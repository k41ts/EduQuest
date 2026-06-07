import type { CSSProperties, ReactNode } from 'react';

export const adminPage: CSSProperties = {
  minHeight: '100%',
  padding: '32px',
  background: 'linear-gradient(180deg, #FBFAFF 0%, #F7F6F2 100%)',
};

export const adminTitle = {
  title: {
    margin: 0,
    fontSize: '28px',
    lineHeight: 1.1,
    fontWeight: 800,
    color: '#1F2240',
    letterSpacing: '-0.02em',
  } as CSSProperties,
  subtitle: {
    margin: '8px 0 0',
    color: '#726F86',
    fontSize: '14px',
  } as CSSProperties,
};

export const adminCard: CSSProperties = {
  background: 'rgba(255,255,255,0.86)',
  border: '1px solid rgba(127, 119, 221, 0.12)',
  borderRadius: '20px',
  boxShadow: '0 12px 30px rgba(28, 26, 55, 0.06)',
  backdropFilter: 'blur(10px)',
};

export const adminPanel = {
  padding: '22px',
  ...adminCard,
} as CSSProperties;

export const adminHero: CSSProperties = {
  ...adminCard,
  padding: '22px 24px',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'start',
  gap: '16px',
  marginBottom: '18px',
};

export const adminToolbar: CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: '10px',
  alignItems: 'center',
};

export const adminStatGrid: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
  gap: '12px',
};

export const adminStatCard: CSSProperties = {
  ...adminCard,
  padding: '18px',
};

export const adminField: CSSProperties = {
  width: '100%',
  border: '1px solid #E5E2F4',
  borderRadius: '12px',
  padding: '12px 14px',
  fontSize: '14px',
  color: '#1F2240',
  background: 'white',
  outline: 'none',
  transition: 'border-color .15s, box-shadow .15s',
};

export const adminTextArea: CSSProperties = {
  ...adminField,
  minHeight: '100px',
  resize: 'vertical',
};

export const adminButton = (variant: 'primary' | 'secondary' | 'danger' = 'primary'): CSSProperties => ({
  border: 'none',
  borderRadius: '12px',
  padding: '10px 14px',
  fontSize: '13px',
  fontWeight: 700,
  cursor: 'pointer',
  transition: 'transform .15s ease, box-shadow .15s ease, background .15s ease',
  color: variant === 'secondary' ? '#2D2A57' : 'white',
  background:
    variant === 'primary' ? 'linear-gradient(135deg, #7F77DD, #5F55D4)' :
    variant === 'danger' ? 'linear-gradient(135deg, #F87171, #EF4444)' :
    '#F2F0FF',
  boxShadow: variant === 'secondary' ? 'none' : '0 10px 18px rgba(127, 119, 221, 0.18)',
});

export const adminBadge = (tone: 'neutral' | 'easy' | 'medium' | 'hard' | 'admin' = 'neutral'): CSSProperties => ({
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  padding: '6px 10px',
  borderRadius: '999px',
  fontSize: '12px',
  fontWeight: 700,
  color:
    tone === 'easy' ? '#0F766E' :
    tone === 'medium' ? '#B45309' :
    tone === 'hard' ? '#B91C1C' :
    tone === 'admin' ? '#5B21B6' : '#5B5A74',
  background:
    tone === 'easy' ? '#ECFDF5' :
    tone === 'medium' ? '#FFF7ED' :
    tone === 'hard' ? '#FEF2F2' :
    tone === 'admin' ? '#F3E8FF' : '#F5F5FB',
  border: '1px solid rgba(0,0,0,0.04)',
});

export function AdminSection({ title, subtitle, actions, children }: { title: string; subtitle?: string; actions?: ReactNode; children: ReactNode }) {
  return (
    <div style={adminPanel}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', gap: 16, marginBottom: 18 }}>
        <div>
          <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#1F2240' }}>{title}</h3>
          {subtitle && <p style={{ margin: '6px 0 0', color: '#726F86', fontSize: 13 }}>{subtitle}</p>}
        </div>
        {actions}
      </div>
      {children}
    </div>
  );
}
