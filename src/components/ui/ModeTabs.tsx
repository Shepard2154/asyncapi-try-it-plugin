import React from 'react';

interface ModeTabsProps {
  mode: 'form' | 'raw';
  onChange: (mode: 'form' | 'raw') => void;
}

export function ModeTabs({ mode, onChange }: ModeTabsProps) {
  return (
    <div style={{ display: 'flex', gap: '5px' }}>
      <button
        type="button"
        style={{
          background: mode === 'raw' ? 'none' : '#f0f0f0',
          border: 'none',
          padding: '8px 16px',
          cursor: 'pointer',
          borderTopLeftRadius: '6px',
          borderBottomLeftRadius: '6px',
          fontWeight: mode === 'raw' ? 'normal' : '600',
          color: mode === 'raw' ? '#666' : '#333',
          transition: 'all 0.2s',
          fontSize: '12px',
        }}
        onClick={() => onChange('form')}
      >
        Form
      </button>
      <button
        type="button"
        style={{
          background: mode === 'raw' ? '#f0f0f0' : 'none',
          border: 'none',
          padding: '8px 16px',
          cursor: 'pointer',
          borderTopRightRadius: '6px',
          borderBottomRightRadius: '6px',
          fontWeight: mode === 'raw' ? '600' : 'normal',
          color: mode === 'raw' ? '#333' : '#666',
          transition: 'all 0.2s',
          fontSize: '12px',
        }}
        onClick={() => onChange('raw')}
      >
        Raw JSON
      </button>
    </div>
  );
}
