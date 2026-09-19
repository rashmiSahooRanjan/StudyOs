import React, { useState } from 'react';

const levelColors = [
  'rgba(255, 255, 255, 0.05)', // Level 0: 0 mins
  'rgba(99, 102, 241, 0.35)',   // Level 1: < 1 hour
  'rgba(99, 102, 241, 0.65)',   // Level 2: 1-3 hours
  'rgba(16, 185, 129, 0.8)',    // Level 3: 3-5 hours
  '#10B981'                     // Level 4: 5+ hours
];

export default function Heatmap({ data = [] }) {
  const [hoveredDay, setHoveredDay] = useState(null);

  if (!data || data.length === 0) {
    return <p style={{ color: 'var(--text-dim)', fontSize: '0.85rem' }}>No activity logged yet.</p>;
  }

  return (
    <div>
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '5px',
        alignItems: 'center',
        padding: '8px 0'
      }}>
        {data.map((day) => (
          <div
            key={day.date}
            onMouseEnter={() => setHoveredDay(day)}
            onMouseLeave={() => setHoveredDay(null)}
            style={{
              width: '14px',
              height: '14px',
              borderRadius: '3px',
              background: levelColors[day.level] || levelColors[0],
              cursor: 'pointer',
              transition: 'transform 0.15s ease, outline 0.15s ease',
              outline: hoveredDay?.date === day.date ? '2px solid #FFFFFF' : 'none',
              transform: hoveredDay?.date === day.date ? 'scale(1.25)' : 'scale(1)',
              zIndex: hoveredDay?.date === day.date ? 10 : 1
            }}
          />
        ))}
      </div>

      {/* Hover Information Banner */}
      <div style={{ minHeight: '24px', marginTop: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {hoveredDay ? (
          <span style={{ fontSize: '0.8rem', color: '#A5B4FC', fontWeight: 600 }}>
            📅 {hoveredDay.date}: {(hoveredDay.minutes / 60).toFixed(1)} hrs ({hoveredDay.sessions} sessions)
          </span>
        ) : (
          <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
            Hover over blocks to inspect study consistency
          </span>
        )}

        {/* Legend */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.72rem', color: 'var(--text-dim)' }}>
          <span>Less</span>
          {levelColors.map((col, idx) => (
            <div key={idx} style={{ width: '10px', height: '10px', borderRadius: '2px', background: col }} />
          ))}
          <span>More</span>
        </div>
      </div>
    </div>
  );
}
