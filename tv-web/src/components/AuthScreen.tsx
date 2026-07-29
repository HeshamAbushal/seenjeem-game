import React, { useState } from 'react';

interface AuthScreenProps {
  onLoginSuccess: (user: { username: string; email: string; name: string }) => void;
  onContinueAsGuest: () => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onLoginSuccess, onContinueAsGuest }) => {
  const [isSignUp, setIsSignUp] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [emailOrUser, setEmailOrUser] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // UI states
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!emailOrUser.trim() || !password.trim()) {
      setError('الرجاء إدخال جميع الحقول المطلوبة');
      return;
    }

    if (isSignUp) {
      if (!name.trim()) {
        setError('الرجاء إدخال الاسم الكامل');
        return;
      }
      if (password !== confirmPassword) {
        setError('كلمات المرور غير متطابقة');
        return;
      }
      if (password.length < 6) {
        setError('يجب أن تتكون كلمة المرور من 6 أحرف على الأقل');
        return;
      }
    }

    setIsLoading(true);

    // Simulate auth API login/signup
    setTimeout(() => {
      setIsLoading(false);
      const user = {
        name: isSignUp ? name : (emailOrUser.includes('@') ? emailOrUser.split('@')[0] : emailOrUser),
        email: emailOrUser.includes('@') ? emailOrUser : `${emailOrUser}@seenjeem.com`,
        username: emailOrUser
      };

      // Save user to localStorage
      localStorage.setItem('seen_jeem_user', JSON.stringify(user));
      onLoginSuccess(user);
    }, 600);
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      minHeight: '100vh',
      width: '100%',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '30px',
      boxSizing: 'border-box',
      direction: 'rtl',
      background: 'radial-gradient(circle at 50% 30%, #1f1642 0%, #0d0a1b 100%)'
    }}>
      {/* Header Brand Logo */}
      <div style={{ textAlign: 'center', marginBottom: '30px' }}>
        <span style={{ fontSize: '4.5rem' }}>🍊</span>
        <h1 style={{ fontSize: '2.5rem', fontWeight: '900', color: '#ff6b00', margin: '10px 0 0 0' }}>
          تحدي سين جيم - أبو سعيد
        </h1>
        <p style={{ color: '#a1a1aa', fontSize: '1.1rem', marginTop: '8px' }}>
          سجل الدخول أو أنشئ حساباً لبدء اللعبة والتحكم بالجولة
        </p>
      </div>

      {/* Main Glass Card */}
      <div className="glass-panel" style={{
        width: '100%',
        maxWidth: '460px',
        borderRadius: '24px',
        border: '1.5px solid rgba(255, 107, 0, 0.4)',
        boxShadow: '0 20px 50px rgba(0,0,0,0.6), 0 0 40px rgba(255, 107, 0, 0.2)',
        padding: '36px 30px'
      }}>
        {/* Tab Switcher */}
        <div style={{
          display: 'flex',
          background: 'rgba(255, 255, 255, 0.04)',
          padding: '4px',
          borderRadius: '14px',
          marginBottom: '24px',
          border: '1px solid rgba(255, 255, 255, 0.08)'
        }}>
          <button
            type="button"
            onClick={() => { setIsSignUp(false); setError(null); }}
            style={{
              flex: 1,
              padding: '12px',
              borderRadius: '10px',
              border: 'none',
              fontWeight: 'bold',
              fontSize: '1rem',
              cursor: 'pointer',
              background: !isSignUp ? '#ff6b00' : 'transparent',
              color: !isSignUp ? '#ffffff' : '#a1a1aa',
              transition: 'all 0.2s',
              boxShadow: !isSignUp ? '0 4px 15px rgba(255, 107, 0, 0.4)' : 'none'
            }}
          >
            تسجيل الدخول
          </button>
          <button
            type="button"
            onClick={() => { setIsSignUp(true); setError(null); }}
            style={{
              flex: 1,
              padding: '12px',
              borderRadius: '10px',
              border: 'none',
              fontWeight: 'bold',
              fontSize: '1rem',
              cursor: 'pointer',
              background: isSignUp ? '#ff6b00' : 'transparent',
              color: isSignUp ? '#ffffff' : '#a1a1aa',
              transition: 'all 0.2s',
              boxShadow: isSignUp ? '0 4px 15px rgba(255, 107, 0, 0.4)' : 'none'
            }}
          >
            حساب جديد
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {isSignUp && (
            <div>
              <label style={{ display: 'block', color: '#ff8533', fontSize: '0.9rem', fontWeight: 'bold', marginBottom: '6px' }}>
                الاسم الكامل
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="مثال: أبو سعيد المقاطي"
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  borderRadius: '12px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  color: '#ffffff',
                  fontSize: '1rem',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>
          )}

          <div>
            <label style={{ display: 'block', color: '#ff8533', fontSize: '0.9rem', fontWeight: 'bold', marginBottom: '6px' }}>
              البريد الإلكتروني أو اسم المستخدم
            </label>
            <input
              type="text"
              value={emailOrUser}
              onChange={(e) => setEmailOrUser(e.target.value)}
              placeholder="name@example.com"
              style={{
                width: '100%',
                padding: '14px 16px',
                borderRadius: '12px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                color: '#ffffff',
                fontSize: '1rem',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', color: '#ff8533', fontSize: '0.9rem', fontWeight: 'bold', marginBottom: '6px' }}>
              كلمة المرور
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              style={{
                width: '100%',
                padding: '14px 16px',
                borderRadius: '12px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                color: '#ffffff',
                fontSize: '1rem',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>

          {isSignUp && (
            <div>
              <label style={{ display: 'block', color: '#ff8533', fontSize: '0.9rem', fontWeight: 'bold', marginBottom: '6px' }}>
                تأكيد كلمة المرور
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  borderRadius: '12px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  color: '#ffffff',
                  fontSize: '1rem',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>
          )}

          {error && (
            <div style={{
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid #ef4444',
              color: '#ef4444',
              padding: '10px 14px',
              borderRadius: '10px',
              fontSize: '0.9rem',
              textAlign: 'center',
              fontWeight: 'bold'
            }}>
              ⚠️ {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            style={{
              width: '100%',
              padding: '16px',
              borderRadius: '14px',
              border: 'none',
              fontSize: '1.25rem',
              fontWeight: '900',
              background: 'linear-gradient(90deg, #ff6b00, #ff8533)',
              color: '#ffffff',
              cursor: isLoading ? 'wait' : 'pointer',
              marginTop: '10px',
              boxShadow: '0 8px 25px rgba(255, 107, 0, 0.4)',
              transition: 'all 0.2s'
            }}
          >
            {isLoading ? 'جاري الدخول...' : (isSignUp ? 'إنشاء حساب ودخول اللعبة 🚀' : 'تسجيل الدخول ودخول اللعبة 🚀')}
          </button>
        </form>

        {/* Continue as Guest */}
        <div style={{ textAlign: 'center', marginTop: '24px', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <button
            onClick={onContinueAsGuest}
            style={{
              background: 'none',
              border: 'none',
              color: '#a1a1aa',
              fontSize: '0.95rem',
              cursor: 'pointer',
              fontWeight: 'bold',
              textDecoration: 'underline'
            }}
          >
            تخطي والمتابعة كزائر 🎮
          </button>
        </div>
      </div>
    </div>
  );
};
