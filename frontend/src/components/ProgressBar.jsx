import React from 'react';

export default function ProgressBar({ value = 0, max = 100, color = 'var(--primary)', height = 8, showLabel = false, label = '' }) {
  const pct = Math.min(100, Math.max(0, (value / (max || 100)) * 100));

  return (
    <div style={{ width: '100%' }}>
      {(showLabel || label) && (
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '0.8rem' }}>
          <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>{label}</span>
          <span style={{ color: 'var(--text-main)', fontWeight: 700 }}>{pct.toFixed(0)}%</span>
        </div>
      )}
      <div style={{
        width: '100%',
        height: `${height}px`,
        background: 'rgba(255, 255, 255, 0.08)',
        borderRadius: '999px',
        overflow: 'hidden',
        position: 'relative'
      }}>
        <div style={{
          width: `${pct}%`,
          height: '100%',
          background: color,
          borderRadius: '999px',
          transition: 'width 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
          boxShadow: `0 0 10px ${color}`
        }} />
      </div>
    </div>
  );
}
