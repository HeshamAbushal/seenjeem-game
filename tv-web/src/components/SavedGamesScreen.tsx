import React, { useState, useEffect } from 'react';
import { GENERAL_CATEGORIES } from '../data/categoriesData';

export interface SavedGame {
  id: string;
  userEmail: string;
  title: string;
  categoryIds: string[];
  categoryNames: string[];
  date: string;
  lastWinner?: string;
  lastScore?: string;
}

interface SavedGamesScreenProps {
  currentUser: { username: string; email: string; name: string } | null;
  onSelectGameToPlay: (categoryIds: string[]) => void;
  onBackToCategories: () => void;
  onOpenLogin: () => void;
  onSignOut?: () => void;
}

export const SavedGamesScreen: React.FC<SavedGamesScreenProps> = ({
  currentUser,
  onSelectGameToPlay,
  onBackToCategories,
  onOpenLogin,
  onSignOut
}) => {
  const [games, setGames] = useState<SavedGame[]>([]);

  useEffect(() => {
    if (!currentUser) return;

    // Load saved games for this account from localStorage
    const storageKey = `seen_jeem_games_${currentUser.email || currentUser.username}`;
    const rawData = localStorage.getItem(storageKey);

    if (rawData) {
      try {
        setGames(JSON.parse(rawData));
      } catch {
        setGames([]);
      }
    } else {
      // Default sample games for new accounts
      const defaultGames: SavedGame[] = [
        {
          id: 'game_sample_1',
          userEmail: currentUser.email,
          title: 'جولة المعلومات العامة الكبرى 🏆',
          categoryIds: ['sports', 'cinema', 'geography', 'history', 'islamic', 'science'],
          categoryNames: ['رياضة كرة القدم', 'سينما وأفلام', 'جغرافيا ودول', 'تاريخ وحضارات', 'ثقافة إسلامية', 'علوم واكتشافات'],
          date: '29 يوليو 2026',
          lastWinner: 'فريق التحدي الأول',
          lastScore: '400 - 250'
        },
        {
          id: 'game_sample_2',
          userEmail: currentUser.email,
          title: 'تحدي الثقافة والترفيه 🎬',
          categoryIds: ['cinema', 'gaming', 'music', 'tv_shows', 'tech', 'general_knowledge'],
          categoryNames: ['سينما وأفلام', 'ألعاب إلكترونية', 'موسيقى وأغاني', 'مسلسلات ودراما', 'تكنولوجيا وشبكات', 'معلومات عامة'],
          date: '28 يوليو 2026',
          lastWinner: 'سناعيس الكرو',
          lastScore: '500 - 450'
        }
      ];
      localStorage.setItem(storageKey, JSON.stringify(defaultGames));
      setGames(defaultGames);
    }
  }, [currentUser]);

  const handleDeleteGame = (gameId: string) => {
    if (!currentUser) return;
    const updated = games.filter((g) => g.id !== gameId);
    setGames(updated);
    const storageKey = `seen_jeem_games_${currentUser.email || currentUser.username}`;
    localStorage.setItem(storageKey, JSON.stringify(updated));
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      minHeight: '100vh',
      width: '100%',
      padding: '30px',
      boxSizing: 'border-box',
      direction: 'rtl',
      background: 'radial-gradient(circle at 50% 20%, #1f1642 0%, #0d0a1b 100%)',
      color: '#ffffff'
    }}>
      {/* Top Header Navigation */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        {/* Right side: Page Title */}
        <div>
          <h1 style={{ fontSize: '2.2rem', fontWeight: '900', color: '#ff6b00', margin: 0 }}>
            🎮 ألعابي المحفوظة
          </h1>
          <p style={{ color: '#a1a1aa', fontSize: '1.05rem', marginTop: '4px' }}>
            {currentUser ? `قائمة الألعاب السابقة للحساب: ${currentUser.name}` : 'سجل ألعابك السابقة ومسابقاتك المفضلة'}
          </p>
        </div>

        {/* Left side: Return Button & Logout Badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={onBackToCategories}
            style={{
              height: '48px',
              padding: '0 20px',
              borderRadius: '14px',
              border: '1.5px solid rgba(255, 255, 255, 0.2)',
              background: 'rgba(255, 255, 255, 0.06)',
              color: '#ffffff',
              fontWeight: 'bold',
              cursor: 'pointer',
              fontSize: '1rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxSizing: 'border-box'
            }}
          >
            ↩️ العودة للتصنيفات
          </button>

          {currentUser && onSignOut && (
            <div style={{
              height: '48px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              background: 'rgba(255, 107, 0, 0.12)',
              padding: '0 18px',
              borderRadius: '14px',
              border: '1px solid rgba(255, 107, 0, 0.4)',
              boxSizing: 'border-box'
            }}>
              <span style={{ fontWeight: 'bold', fontSize: '0.95rem' }}>👤 {currentUser.name}</span>
              <button
                onClick={onSignOut}
                style={{
                  background: 'rgba(239, 68, 68, 0.18)',
                  border: '1px solid #ef4444',
                  color: '#ef4444',
                  padding: '5px 12px',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  fontSize: '0.85rem',
                  fontWeight: 'bold'
                }}
              >
                تسجيل الخروج 🚪
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Guest Warning */}
      {!currentUser ? (
        <div className="glass-panel" style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '60px 20px',
          borderRadius: '24px',
          textAlign: 'center',
          margin: 'auto 0'
        }}>
          <span style={{ fontSize: '4rem', marginBottom: '16px' }}>🔒</span>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#ff6b00' }}>
            الرجاء تسجيل الدخول لعرض ألعابك المحفوظة
          </h2>
          <p style={{ color: '#a1a1aa', fontSize: '1.1rem', maxWidth: '500px', margin: '10px 0 24px 0', lineHeight: '1.6' }}>
            عند تسجيل الدخول بحسابك، يتم حفظ جميع الجولات والتصنيفات التي لعبتها تلقائياً لتستطيع إعادة لعبها بضغطة زر في أي وقت!
          </p>
          <button
            onClick={onOpenLogin}
            style={{
              padding: '16px 36px',
              borderRadius: '14px',
              border: 'none',
              fontSize: '1.2rem',
              fontWeight: '900',
              background: 'linear-gradient(90deg, #ff6b00, #ff8533)',
              color: '#ffffff',
              cursor: 'pointer',
              boxShadow: '0 8px 25px rgba(255, 107, 0, 0.4)'
            }}
          >
            👤 تسجيل الدخول / إنشاء حساب 🚀
          </button>
        </div>
      ) : games.length === 0 ? (
        /* Empty State */
        <div className="glass-panel" style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '60px 20px',
          borderRadius: '24px',
          textAlign: 'center',
          margin: 'auto 0'
        }}>
          <span style={{ fontSize: '4rem', marginBottom: '16px' }}>🎮</span>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#ffffff' }}>لا توجد ألعاب محفوظة حالياً</h2>
          <p style={{ color: '#a1a1aa', fontSize: '1.1rem', marginTop: '8px' }}>
            اختر التصنيفات وافتتح جولتك الأولى لتظهر تلقائياً في قائمة ألعابي!
          </p>
          <button
            onClick={onBackToCategories}
            style={{
              marginTop: '20px',
              padding: '14px 28px',
              borderRadius: '12px',
              border: 'none',
              fontSize: '1.1rem',
              fontWeight: 'bold',
              background: '#ff6b00',
              color: '#ffffff',
              cursor: 'pointer'
            }}
          >
            اختيار تصنيفات وبدء جولة 🚀
          </button>
        </div>
      ) : (
        /* Games Grid List */
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))',
          gap: '24px',
          flex: 1,
          alignContent: 'start'
        }}>
          {games.map((game) => (
            <div
              key={game.id}
              className="glass-panel"
              style={{
                display: 'flex',
                flexDirection: 'column',
                padding: '24px',
                borderRadius: '20px',
                border: '1.5px solid rgba(255, 107, 0, 0.3)',
                justifyContent: 'space-between',
                gap: '16px',
                boxShadow: '0 10px 30px rgba(0,0,0,0.4)'
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                  <h3 style={{ fontSize: '1.4rem', fontWeight: '900', color: '#ff6b00', margin: 0 }}>
                    {game.title}
                  </h3>
                  <span style={{ fontSize: '0.85rem', color: '#a1a1aa', background: 'rgba(255,255,255,0.05)', padding: '4px 10px', borderRadius: '8px' }}>
                    📅 {game.date}
                  </span>
                </div>

                {/* Categories Pills */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', margin: '14px 0' }}>
                  {game.categoryIds.map((catId) => {
                    const catObj = GENERAL_CATEGORIES.find((c) => c.id === catId);
                    return (
                      <span
                        key={catId}
                        style={{
                          background: 'rgba(255, 255, 255, 0.06)',
                          border: '1px solid rgba(255,255,255,0.12)',
                          borderRadius: '8px',
                          padding: '4px 10px',
                          fontSize: '0.85rem',
                          color: '#ffffff',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}
                      >
                        <span>{catObj?.icon || '📌'}</span>
                        <span>{catObj?.name || catId}</span>
                      </span>
                    );
                  })}
                </div>

                {game.lastWinner && (
                  <div style={{ fontSize: '0.9rem', color: '#10b981', fontWeight: 'bold', marginTop: '6px' }}>
                    🏆 آخر نتيجة: {game.lastWinner} ({game.lastScore})
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
                <button
                  onClick={() => onSelectGameToPlay(game.categoryIds)}
                  style={{
                    flex: 1,
                    padding: '14px',
                    borderRadius: '12px',
                    border: 'none',
                    fontSize: '1.1rem',
                    fontWeight: '900',
                    background: 'linear-gradient(90deg, #ff6b00, #ff8533)',
                    color: '#ffffff',
                    cursor: 'pointer',
                    boxShadow: '0 4px 15px rgba(255, 107, 0, 0.3)'
                  }}
                >
                  🔄 إعادة اللعب الآن
                </button>
                <button
                  onClick={() => handleDeleteGame(game.id)}
                  style={{
                    padding: '14px 18px',
                    borderRadius: '12px',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    background: 'rgba(239, 68, 68, 0.1)',
                    color: '#ef4444',
                    fontWeight: 'bold',
                    cursor: 'pointer'
                  }}
                >
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
