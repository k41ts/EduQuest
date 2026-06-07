import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { BookOpen, Eye, EyeOff, AlertCircle, CheckCircle, Mail, Lock } from 'lucide-react';

const ERRORS: Record<string, string> = {
  'auth/invalid-credential': 'Email atau password salah. Coba lagi ya!',
  'auth/user-not-found': 'Akun tidak ditemukan.',
  'auth/wrong-password': 'Password salah. Coba lagi ya!',
  'auth/too-many-requests': 'Terlalu banyak percobaan. Istirahat dulu ya.',
  'auth/invalid-email': 'Format email tidak valid.',
};

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [resetSent, setResetSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  useEffect(() => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap';
    document.head.appendChild(link);
  }, []);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(''); setResetSent(false); setLoading(true);
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      const snap = await getDoc(doc(db, 'users', cred.user.uid));

      const userData = snap.data();
      if (userData?.role === 'admin') {
        console.log('NAVIGATING TO ADMIN');
        navigate('/admin');
      } else {
        console.log('NAVIGATING TO DASHBOARD');
        navigate(userData?.onboardingComplete ? '/dashboard' : '/onboarding');
}
    } catch (err: any) {
      setError(ERRORS[err.code] || 'Terjadi kesalahan. Coba lagi.');
    } finally {
      setLoading(false);
    }
  }

  async function handleForgotPassword() {
    if (!email) { setError('Isi email dulu ya sebelum reset password.'); return; }
    try {
      await sendPasswordResetEmail(auth, email);
      setResetSent(true); setError('');
    } catch (err: any) {
      setError(ERRORS[err.code] || 'Gagal mengirim email reset.');
    }
  }

  const isFocused = (f: string) => focusedField === f;

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
      <div style={{ position: 'absolute', top: -60, left: -60, width: 260, height: 260, borderRadius: '50%', background: '#AFA9EC', opacity: 0.3, pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: -80, right: -40, width: 320, height: 320, borderRadius: '50%', background: '#7F77DD', opacity: 0.2, pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', top: '40%', right: '8%', width: 120, height: 120, borderRadius: '50%', background: '#F0A84B', opacity: 0.15, pointerEvents: 'none' }} />

      {/* Decorative dots */}
      {[
        { top: '15%', left: '12%' }, { top: '25%', left: '18%' },
        { top: '70%', right: '15%' }, { top: '80%', right: '22%' },
        { top: '10%', right: '30%' },
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
            Halo, selamat datang!
          </div>
          <div style={{ fontSize: '13px', color: '#888780' }}>
            Yuk masuk dan lanjut belajar
          </div>
        </div>

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

          {/* Email */}
          <div>
            <label style={{ fontSize: '13px', fontWeight: '600', color: '#444', display: 'block', marginBottom: '7px' }}>
              Email
            </label>
            <div style={{
              display: 'flex', alignItems: 'center', gap: '10px',
              padding: '13px 16px',
              border: `2px solid ${isFocused('email') ? '#7F77DD' : '#EDE9FE'}`,
              borderRadius: '14px',
              background: isFocused('email') ? '#FAFAFF' : '#FDFCFF',
              transition: 'border-color 0.2s, background 0.2s',
              cursor: 'text',
            }} onClick={() => document.getElementById('email-input')?.focus()}>
              <Mail size={17} color={isFocused('email') ? '#7F77DD' : '#AFA9EC'} style={{ flexShrink: 0 }} />
              <input
                id="email-input"
                type="email" value={email} required
                onChange={e => setEmail(e.target.value)}
                onFocus={() => setFocusedField('email')}
                onBlur={() => setFocusedField(null)}
                placeholder="nama@email.com"
                style={{
                  flex: 1, border: 'none', outline: 'none', fontSize: '14px',
                  fontFamily: 'Plus Jakarta Sans, sans-serif',
                  background: 'transparent', color: '#26215C',
                }}
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label style={{ fontSize: '13px', fontWeight: '600', color: '#444', display: 'block', marginBottom: '7px' }}>
              Password
            </label>
            <div style={{
              display: 'flex', alignItems: 'center', gap: '10px',
              padding: '13px 16px',
              border: `2px solid ${isFocused('password') ? '#7F77DD' : '#EDE9FE'}`,
              borderRadius: '14px',
              background: isFocused('password') ? '#FAFAFF' : '#FDFCFF',
              transition: 'border-color 0.2s, background 0.2s',
              cursor: 'text',
            }} onClick={() => document.getElementById('pw-input')?.focus()}>
              <Lock size={17} color={isFocused('password') ? '#7F77DD' : '#AFA9EC'} style={{ flexShrink: 0 }} />
              <input
                id="pw-input"
                type={showPw ? 'text' : 'password'} value={password} required
                onChange={e => setPassword(e.target.value)}
                onFocus={() => setFocusedField('password')}
                onBlur={() => setFocusedField(null)}
                placeholder="Password"
                style={{
                  flex: 1, border: 'none', outline: 'none', fontSize: '14px',
                  fontFamily: 'Plus Jakarta Sans, sans-serif',
                  background: 'transparent', color: '#26215C',
                }}
              />
              <button type="button" onClick={() => setShowPw(!showPw)} style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: '#AFA9EC', display: 'flex', alignItems: 'center', padding: 0,
              }}>
                {showPw ? <Eye size={17} /> : <EyeOff size={17} />}
              </button>
            </div>

            {/* Forgot password — now below the input */}
            <div style={{ textAlign: 'right', marginTop: '8px' }}>
              <button type="button" onClick={handleForgotPassword} style={{
                background: 'none', border: 'none', fontSize: '12px',
                color: '#7F77DD', cursor: 'pointer', fontFamily: 'inherit',
                padding: 0, fontWeight: '600',
              }}>
                Lupa password?
              </button>
            </div>
          </div>
          {/* Feedback */}
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
          {resetSent && (
            <div style={{
              background: '#E1F5EE', border: '2px solid #5DCAA5', borderRadius: '12px',
              padding: '11px 14px', fontSize: '13px', color: '#0F6E56',
              display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '500',
            }}>
              <CheckCircle size={16} color="#0F6E56" style={{ flexShrink: 0 }} />
              Cek email kamu ya, link reset sudah dikirim!
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
            {loading ? 'Masuk...' : 'Masuk sekarang'}
          </button>
        </form>

        <p style={{ textAlign: 'center', fontSize: '13px', color: '#888780', margin: '20px 0 0' }}>
          Belum punya akun?{' '}
          <Link to="/register" style={{ color: '#7F77DD', fontWeight: '700', textDecoration: 'none' }}>
            Daftar sekarang
          </Link>
        </p>
      </div>
    </div>
  );
}