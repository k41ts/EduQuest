import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import type { UserProfile } from '../types';
import { BookOpen, Eye, EyeOff, AlertCircle, Mail, Lock, User } from 'lucide-react';

const ERRORS: Record<string, string> = {
  'auth/email-already-in-use': 'Email ini sudah terdaftar. Coba masuk aja!',
  'auth/invalid-email': 'Format email tidak valid.',
  'auth/weak-password': 'Password minimal 6 karakter ya.',
};

export default function Register() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  useEffect(() => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap';
    document.head.appendChild(link);
  }, []);

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (password !== confirmPw) {
      setError('Password-nya belum sama nih. Cek lagi ya!');
      return;
    }
    if (password.length < 6) {
      setError('Password minimal 6 karakter ya.');
      return;
    }

    setLoading(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(cred.user, { displayName: name });

      const profile: UserProfile = {
        uid: cred.user.uid,
        name,
        email,
        level: 1,
        xp: 0,
        streak: 0,
        lastActiveDate: '',
        targetMajor: '',
        subjects: [],
        onboardingComplete: false,
        createdAt: new Date().toISOString(),
      };
      await setDoc(doc(db, 'users', cred.user.uid), profile);
      navigate('/onboarding');
    } catch (err: any) {
      setError(ERRORS[err.code] || 'Terjadi kesalahan. Coba lagi.');
    } finally {
      setLoading(false);
    }
  }

  const isFocused = (f: string) => focusedField === f;

  const fieldWrap = (field: string): React.CSSProperties => ({
    display: 'flex', alignItems: 'center', gap: '10px',
    padding: '13px 16px',
    border: `2px solid ${isFocused(field) ? '#7F77DD' : '#EDE9FE'}`,
    borderRadius: '14px',
    background: isFocused(field) ? '#FAFAFF' : '#FDFCFF',
    transition: 'border-color 0.2s, background 0.2s',
    cursor: 'text',
  });

  const inputInner: React.CSSProperties = {
    flex: 1, border: 'none', outline: 'none', fontSize: '14px',
    fontFamily: 'Plus Jakarta Sans, sans-serif',
    background: 'transparent', color: '#26215C',
  };

  const iconColor = (field: string) => isFocused(field) ? '#7F77DD' : '#AFA9EC';

  return (
    <div style={{
      minHeight: '100vh', width: '100%',
      background: '#EEEDFE',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'Plus Jakarta Sans, sans-serif',
      padding: '24px',
      position: 'relative',
      overflow: 'hidden',
    }}>

      {/* Background blobs */}
      <div style={{ position: 'absolute', top: -60, right: -60, width: 280, height: 280, borderRadius: '50%', background: '#AFA9EC', opacity: 0.3, pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: -80, left: -40, width: 320, height: 320, borderRadius: '50%', background: '#7F77DD', opacity: 0.2, pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', top: '30%', left: '8%', width: 100, height: 100, borderRadius: '50%', background: '#F0A84B', opacity: 0.15, pointerEvents: 'none' }} />

      {/* Decorative dots */}
      {[
        { top: '12%', right: '14%' }, { top: '20%', right: '20%' },
        { top: '72%', left: '14%' }, { top: '80%', left: '22%' },
        { top: '8%', left: '32%' },
      ].map((pos, i) => (
        <div key={i} style={{
          position: 'absolute', width: 8, height: 8, borderRadius: '50%',
          background: '#7F77DD', opacity: 0.25, pointerEvents: 'none', ...pos,
        }} />
      ))}

      {/* Card */}
      <div style={{
        background: 'white', borderRadius: '28px', padding: '36px 32px',
        width: '100%', maxWidth: '420px', position: 'relative',
        boxShadow: '0 8px 40px rgba(127, 119, 221, 0.15)',
      }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{
            width: '60px', height: '60px', borderRadius: '18px',
            background: '#7F77DD', display: 'inline-flex',
            alignItems: 'center', justifyContent: 'center', marginBottom: '14px',
          }}>
            <BookOpen size={28} color="white" strokeWidth={2} />
          </div>
          <div style={{ fontSize: '22px', fontWeight: '700', color: '#26215C', marginBottom: '4px' }}>
            Gabung EduQuest!
          </div>
          <div style={{ fontSize: '13px', color: '#888780' }}>
            Gratis selamanya, mulai belajar sekarang
          </div>
        </div>

        <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

          {/* Name */}
          <div>
            <label style={{ fontSize: '13px', fontWeight: '600', color: '#444', display: 'block', marginBottom: '7px' }}>
              Nama lengkap
            </label>
            <div style={fieldWrap('name')} onClick={() => document.getElementById('name-input')?.focus()}>
              <User size={17} color={iconColor('name')} style={{ flexShrink: 0 }} />
              <input
                id="name-input"
                type="text" value={name} required
                onChange={e => setName(e.target.value)}
                onFocus={() => setFocusedField('name')}
                onBlur={() => setFocusedField(null)}
                placeholder="Nama Lengkap"
                style={inputInner}
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label style={{ fontSize: '13px', fontWeight: '600', color: '#444', display: 'block', marginBottom: '7px' }}>
              Email
            </label>
            <div style={fieldWrap('email')} onClick={() => document.getElementById('email-input')?.focus()}>
              <Mail size={17} color={iconColor('email')} style={{ flexShrink: 0 }} />
              <input
                id="email-input"
                type="email" value={email} required
                onChange={e => setEmail(e.target.value)}
                onFocus={() => setFocusedField('email')}
                onBlur={() => setFocusedField(null)}
                placeholder="nama@email.com"
                style={inputInner}
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label style={{ fontSize: '13px', fontWeight: '600', color: '#444', display: 'block', marginBottom: '7px' }}>
              Password
            </label>
            <div style={fieldWrap('password')} onClick={() => document.getElementById('pw-input')?.focus()}>
              <Lock size={17} color={iconColor('password')} style={{ flexShrink: 0 }} />
              <input
                id="pw-input"
                type={showPw ? 'text' : 'password'} value={password} required
                onChange={e => setPassword(e.target.value)}
                onFocus={() => setFocusedField('password')}
                onBlur={() => setFocusedField(null)}
                placeholder="Minimal 6 karakter"
                style={inputInner}
              />
              <button type="button" onClick={() => setShowPw(!showPw)} style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: '#AFA9EC', display: 'flex', alignItems: 'center', padding: 0,
              }}>
                {showPw ? <Eye size={17} /> : <EyeOff size={17} />}
              </button>
            </div>
          </div>

          {/* Confirm password */}
          <div>
            <label style={{ fontSize: '13px', fontWeight: '600', color: '#444', display: 'block', marginBottom: '7px' }}>
              Konfirmasi password
            </label>
            <div style={fieldWrap('confirmPw')} onClick={() => document.getElementById('confirm-input')?.focus()}>
              <Lock size={17} color={iconColor('confirmPw')} style={{ flexShrink: 0 }} />
              <input
                id="confirm-input"
                type={showConfirmPw ? 'text' : 'password'} value={confirmPw} required
                onChange={e => setConfirmPw(e.target.value)}
                onFocus={() => setFocusedField('confirmPw')}
                onBlur={() => setFocusedField(null)}
                placeholder="Ulangi password"
                style={{
                  ...inputInner,
                  color: confirmPw && confirmPw !== password ? '#D85A30' : '#26215C',
                }}
              />
              <button type="button" onClick={() => setShowConfirmPw(!showConfirmPw)} style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: '#AFA9EC', display: 'flex', alignItems: 'center', padding: 0,
              }}>
                {showConfirmPw ? <Eye size={17} /> : <EyeOff size={17} />}
              </button>
            </div>
            {/* Inline password match hint */}
            {confirmPw && confirmPw !== password && (
              <p style={{ fontSize: '12px', color: '#D85A30', margin: '6px 0 0 4px', fontWeight: '500' }}>
                Password tidak sama
              </p>
            )}
            {confirmPw && confirmPw === password && (
              <p style={{ fontSize: '12px', color: '#1D9E75', margin: '6px 0 0 4px', fontWeight: '500' }}>
                Password sudah benar!
              </p>
            )}
          </div>

          {/* Error */}
          {error && (
            <div style={{
              background: '#FAECE7', border: '2px solid #F0997B', borderRadius: '12px',
              padding: '11px 14px', fontSize: '13px', color: '#993C1D',
              display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '500',
            }}>
              <AlertCircle size={16} color="#993C1D" style={{ flexShrink: 0 }} />
              {error}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit" disabled={loading}
            style={{
              width: '100%', padding: '14px',
              background: loading ? '#AFA9EC' : '#F0A84B',
              border: 'none', borderRadius: '14px',
              fontSize: '15px', fontWeight: '700',
              color: loading ? 'white' : '#fefcf9',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontFamily: 'Plus Jakarta Sans, sans-serif',
              marginTop: '4px', transition: 'background 0.2s, transform 0.1s',
              letterSpacing: '0.1px',
            }}
            onMouseEnter={e => { if (!loading) (e.currentTarget.style.background = '#e09738'); }}
            onMouseLeave={e => { if (!loading) (e.currentTarget.style.background = '#F0A84B'); }}
            onMouseDown={e => { if (!loading) (e.currentTarget.style.transform = 'scale(0.98)'); }}
            onMouseUp={e => { (e.currentTarget.style.transform = 'scale(1)'); }}
          >
            {loading ? 'Membuat akun...' : 'Buat akun gratis'}
          </button>
        </form>

        <p style={{ textAlign: 'center', fontSize: '13px', color: '#888780', margin: '20px 0 0' }}>
          Sudah punya akun?{' '}
          <Link to="/login" style={{ color: '#7F77DD', fontWeight: '700', textDecoration: 'none' }}>
            Masuk di sini
          </Link>
        </p>
      </div>
    </div>
  );
}