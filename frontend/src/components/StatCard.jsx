import React from 'react';

export default function StatCard({ title, value, subtitle, icon: Icon, color = '#6366F1', badge, onClick }) {
  return (
    <div
      onClick={onClick}
      className={`glass-card ${onClick ? 'glass-card-interactive' : ''}`}
      style={{
        padding: '20px 24px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        position: 'relative',
        overflow: 'hidden',
        cursor: onClick ? 'pointer' : 'default'
      }}
    >
      {/* Background Accent Glow */}
      <div style={{
        position: 'absolute',
        top: '-20px',
        right: '-20px',
        width: '80px',
        height: '80px',
        background: color,
        filter: 'blur(45px)',
        opacity: 0.18,
        pointerEvents: 'none'
      }} />

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
        <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          {title}
        </span>
        {Icon && (
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '10px',
            background: `rgba(${parseInt(color.slice(1,3),16)}, ${parseInt(color.slice(3,5),16)}, ${parseInt(color.slice(5,7),16)}, 0.15)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: `1px solid rgba(${parseInt(color.slice(1,3),16)}, ${parseInt(color.slice(3,5),16)}, ${parseInt(color.slice(5,7),16)}, 0.3)`
          }}>
            <Icon size={18} color={color} />
          </div>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '6px' }}>
        <h3 style={{ fontSize: '1.9rem', fontWeight: 800, color: '#FFFFFF', letterSpacing: '-0.03em', fontFamily: 'var(--font-heading)' }}>
          {value}
        </h3>
        {badge && (
          <span className="badge" style={{ background: 'rgba(255,255,255,0.08)', color: color, fontSize: '0.7rem' }}>
            {badge}
          </span>
        )}
      </div>

      {subtitle && (
        <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)', fontWeight: 500 }}>
          {subtitle}
        </p>
      )}
    </div>
  );
}
