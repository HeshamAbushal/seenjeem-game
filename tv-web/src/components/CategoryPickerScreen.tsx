import React, { useState } from 'react';
import { GENERAL_CATEGORIES, QuestionCategoryData } from '../data/categoriesData';

interface CategoryPickerScreenProps {
  onConfirmCategories: (selectedCategoryIds: string[]) => void;
  onOpenSavedGames?: () => void;
  onSignOut?: () => void;
  currentUser?: { name: string; username: string; email: string } | null;
  hostName?: string;
}

export const CategoryPickerScreen: React.FC<CategoryPickerScreenProps> = ({
  onConfirmCategories,
  onOpenSavedGames,
  onSignOut,
  currentUser,
  hostName
}) => {
  // Start with no default selections
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const toggleCategory = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((item) => item !== id));
    } else {
      // Maximum 6 categories per board round
      if (selectedIds.length >= 6) return;
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleConfirm = () => {
    if (selectedIds.length === 6) {
      onConfirmCategories(selectedIds);
    }
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
      {/* Top Header info */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '2.2rem', fontWeight: '900', color: '#ff6b00', margin: 0 }}>
            اختيار تصنيفات الأسئلة للجولة 🎯
          </h1>
          <p style={{ color: '#a1a1aa', fontSize: '1.05rem', marginTop: '6px' }}>
            {hostName ? `مرحباً ${hostName}! ` : ''}اختر 6 تصنيفات لبناء لوحة المسابقة العامة
          </p>
        </div>

        {/* Header Action Badges */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
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

          {onOpenSavedGames && (
            <button
              onClick={onOpenSavedGames}
              style={{
                height: '48px',
                padding: '0 22px',
                borderRadius: '14px',
                border: '1.5px solid #ff6b00',
                background: 'rgba(255, 107, 0, 0.15)',
                color: '#ffffff',
                fontWeight: '900',
                fontSize: '1rem',
                cursor: 'pointer',
                boxShadow: '0 4px 15px rgba(255, 107, 0, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxSizing: 'border-box'
              }}
            >
              🎮 ألعابي المحفوظة
            </button>
          )}

          <div className="glass-panel" style={{
            height: '48px',
            padding: '0 22px',
            borderRadius: '14px',
            border: '1.5px solid rgba(255, 255, 255, 0.2)',
            fontSize: '1rem',
            fontWeight: 'bold',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxSizing: 'border-box'
          }}>
            المحدد: <span style={{ color: '#ff6b00', fontSize: '1.2rem', margin: '0 4px' }}>{selectedIds.length}</span> / 6 تصنيفات
          </div>
        </div>
      </div>

      {/* Grid of 20 Categories */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
        gap: '18px',
        flex: 1,
        marginBottom: '30px',
        maxHeight: '68vh',
        overflowY: 'auto',
        paddingRight: '6px'
      }}>
        {GENERAL_CATEGORIES.map((cat: QuestionCategoryData) => {
          const isSelected = selectedIds.includes(cat.id);
          return (
            <div
              key={cat.id}
              onClick={() => toggleCategory(cat.id)}
              className="glass-panel"
              style={{
                display: 'flex',
                flexDirection: 'column',
                padding: '20px',
                borderRadius: '18px',
                cursor: 'pointer',
                transition: 'all 0.2s ease-in-out',
                background: isSelected ? 'rgba(255, 107, 0, 0.16)' : 'rgba(255, 255, 255, 0.03)',
                border: isSelected ? '2px solid #ff6b00' : '1px solid rgba(255, 255, 255, 0.1)',
                boxShadow: isSelected ? '0 0 20px rgba(255, 107, 0, 0.3)' : 'none',
                position: 'relative'
              }}
            >
              {/* Checkbox indicator */}
              <div style={{
                position: 'absolute',
                top: '16px',
                left: '16px',
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                background: isSelected ? '#ff6b00' : 'rgba(255, 255, 255, 0.1)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 'bold',
                fontSize: '0.85rem'
              }}>
                {isSelected ? '✓' : ''}
              </div>

              <div style={{ fontSize: '2.5rem', marginBottom: '10px' }}>{cat.icon}</div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', margin: '0 0 6px 0', color: isSelected ? '#ff8533' : '#ffffff' }}>
                {cat.name}
              </h3>
              <p style={{ fontSize: '0.88rem', color: '#a1a1aa', margin: 0, lineHeight: '1.4' }}>
                {cat.description}
              </p>
            </div>
          );
        })}
      </div>

      {/* Bottom Confirm Bar */}
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <button
          onClick={handleConfirm}
          disabled={selectedIds.length !== 6}
          style={{
            padding: '18px 48px',
            borderRadius: '16px',
            border: 'none',
            fontSize: '1.35rem',
            fontWeight: '900',
            background: selectedIds.length !== 6 ? '#27272a' : 'linear-gradient(90deg, #ff6b00, #ff8533)',
            color: selectedIds.length !== 6 ? '#71717a' : '#ffffff',
            cursor: selectedIds.length !== 6 ? 'not-allowed' : 'pointer',
            boxShadow: selectedIds.length !== 6 ? 'none' : '0 8px 30px rgba(255, 107, 0, 0.5)',
            transition: 'all 0.2s'
          }}
        >
          {selectedIds.length === 6
            ? 'تأكيد الـ 6 تصنيفات وبدء اللعبة 🚀'
            : `الرجاء اختيار 6 تصنيفات بالضبط (المحدد: ${selectedIds.length} من 6) 🎯`}
        </button>
      </div>
    </div>
  );
};
