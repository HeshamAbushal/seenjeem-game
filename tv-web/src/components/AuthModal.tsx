import React, { useState } from 'react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: { username: string; email: string; name: string }) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onLoginSuccess }) => {
  const [isSignUp, setIsSignUp] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [emailOrUser, setEmailOrUser] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // UI states
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

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

    // Simulate auth API call
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
      onClose();
    }, 800);
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 9999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(13, 10, 27, 0.85)',
      backdropFilter: 'blur(12px)',
      padding: '20px',
      direction: 'rtl'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '460px',
        backgroundColor: '#160E2E',
        borderRadius: '24px',
        border: '1.5px solid rgba(255, 107, 0, 0.3)',
        boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6), 0 0 30px rgba(255, 107, 0, 0.15)',
        padding: '36px 30px',
        position: 'relative',
        animation: 'fadeInScale 0.3s ease-out'
      }}>
        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '20px',
            left: '20px',
            background: 'rgba(255, 255, 255, 0.06)',
            border: 'none',
            color: '#a1a1aa',
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            cursor: 'pointer',
            fontSize: '1.2rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          ✕
        </button>

        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{ fontSize: '3rem', marginBottom: '8px' }}>🍊</div>
          <h2 style={{ fontSize: '1.8rem', fontWeight: '900', color: '#ff6b00', margin: 0 }}>
            {isSignUp ? 'إنشاء حساب جديد' : 'تسجيل الدخول'}
          </h2>
          <p style={{ color: '#a1a1aa', fontSize: '0.95rem', marginTop: '6px' }}>
            {isSignUp ? 'انضم إلى تحدي سين جيم واحفظ نتائجك' : 'مرحباً بك مجدداً في حلبة أبو سعيد'}
          </p>
        </div>

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
              padding: '10px',
              borderRadius: '10px',
              border: 'none',
              fontWeight: 'bold',
              fontSize: '1rem',
              cursor: 'pointer',
              background: !isSignUp ? '#ff6b00' : 'transparent',
              color: !isSignUp ? '#ffffff' : '#a1a1aa',
              transition: 'all 0.2s'
            }}
          >
            تسجيل الدخول
          </button>
          <button
            type="button"
            onClick={() => { setIsSignUp(true); setError(null); }}
            style={{
              flex: 1,
              padding: '10px',
              borderRadius: '10px',
              border: 'none',
              fontWeight: 'bold',
              fontSize: '1rem',
              cursor: 'pointer',
              background: isSignUp ? '#ff6b00' : 'transparent',
              color: isSignUp ? '#ffffff' : '#a1a1aa',
              transition: 'all 0.2s'
            }}
          >
            حساب جديد
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
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
              fontSize: '1.2rem',
              fontWeight: '900',
              background: 'linear-gradient(90deg, #ff6b00, #ff8533)',
              color: '#ffffff',
              cursor: isLoading ? 'wait' : 'pointer',
              marginTop: '10px',
              boxShadow: '0 8px 20px rgba(255, 107, 0, 0.4)',
              transition: 'all 0.2s'
            }}
          >
            {isLoading ? 'جاري التحقق...' : (isSignUp ? 'إنشاء حساب جديد 🚀' : 'تسجيل الدخول 🚀')}
          </button>
        </form>

        {/* Play as Guest Option */}
        <div style={{ textAlign: 'center', marginTop: '20px' }}>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: '#a1a1aa',
              fontSize: '0.9rem',
              cursor: 'pointer',
              textDecoration: 'underline'
            }}
          >
            تخطي ومتابعة اللعب كزائر 🎮
          </button>
        </div>
      </div>
      <style>{`
        @keyframes fadeInScale {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
};
